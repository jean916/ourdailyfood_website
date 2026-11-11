-- OurDailyFood database setup (Supabase / PostgreSQL)
-- Run in the Supabase SQL Editor. Safe to run more than once.
-- Assumes the base "orders" table and the "is_store_admin()" function already exist.

create extension if not exists pgcrypto with schema extensions;

-- 1. Orders: payment and delivery columns
alter table public.orders
  add column if not exists payment_method text not null default 'cash_on_delivery',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists delivery_agent_id uuid;

-- 2. Menu items
create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price integer not null check (price > 0),
  image text not null default '/images/products/burger-classic.jpg',
  description text not null default '',
  rating integer not null default 5 check (rating between 1 and 5),
  available boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.products (id, name, category, price, image, description, rating)
overriding system value
select * from (values
  (1, 'Classic Beef Burger', 'Burger', 5500, '/images/products/burger-classic.jpg', 'Juicy grilled beef burger with fresh lettuce, tomato, cheese and signature sauce.', 5),
  (2, 'Chicken Burrito', 'Burrito', 6000, '/images/products/burrito-chicken.jpg', 'Soft tortilla filled with grilled chicken, vegetables and melted cheese.', 5),
  (3, 'Classic Hot Dog', 'Hot Dog', 4000, '/images/products/hotdog-classic.jpg', 'Grilled hot dog served with fresh vegetables, ketchup and mustard.', 4),
  (4, 'Fried Rice with Beef', 'Rice With Beef', 7500, '/images/products/fried-rice-beef.jpg', 'Delicious fried rice mixed with tender beef and fresh vegetables.', 5),
  (5, 'Chicken Salad', 'Salad', 5000, '/images/products/chicken-salad.jpg', 'Fresh salad topped with grilled chicken, tomatoes, cucumber and dressing.', 5),
  (6, 'French Fries', 'Chips', 3000, '/images/products/fries.jpg', 'Golden crispy French fries served hot with tomato ketchup.', 4),
  (7, 'Coca-Cola', 'Drinks', 1500, '/images/products/coca-cola.jpg', 'Refreshing chilled soft drink served ice cold.', 5),
  (8, 'Fresh Mango Juice', 'Juice', 2500, '/images/products/mango-juice.jpg', 'Freshly prepared mango juice made from ripe natural mangoes.', 5)
) as seed(id, name, category, price, image, description, rating)
where not exists (select 1 from public.products);

select setval(pg_get_serial_sequence('public.products', 'id'), (select max(id) from public.products));

alter table public.products enable row level security;

drop policy if exists "products visible" on public.products;
drop policy if exists "products visible anon" on public.products;
drop policy if exists "products visible auth" on public.products;
create policy "products visible anon" on public.products
  for select to anon using (available);
create policy "products visible auth" on public.products
  for select to authenticated using (available or public.is_store_admin());

drop policy if exists "admin manages products" on public.products;
create policy "admin manages products" on public.products
  for all to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

-- 3. Delivery people
create table if not exists public.delivery_agents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);
alter table public.delivery_agents enable row level security;

create or replace function public.is_delivery_agent()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.delivery_agents where user_id = auth.uid());
$$;

drop policy if exists "admin manages delivery agents" on public.delivery_agents;
create policy "admin manages delivery agents" on public.delivery_agents
  for all to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

drop policy if exists "agent reads own row" on public.delivery_agents;
create policy "agent reads own row" on public.delivery_agents
  for select to authenticated using (user_id = auth.uid());

-- 4. Who can see and change orders (added to the existing policies)
drop policy if exists "customers read own orders" on public.orders;
create policy "customers read own orders" on public.orders
  for select to authenticated using (customer_id = auth.uid());

drop policy if exists "customers insert own orders" on public.orders;
create policy "customers insert own orders" on public.orders
  for insert to authenticated with check (customer_id = auth.uid());

drop policy if exists "agents read assigned orders" on public.orders;
create policy "agents read assigned orders" on public.orders
  for select to authenticated
  using (delivery_agent_id = auth.uid() and public.is_delivery_agent());

drop policy if exists "admin updates orders" on public.orders;
create policy "admin updates orders" on public.orders
  for update to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

-- 5. New orders: the server recalculates prices and links the order to the signed-in customer
create or replace function public.orders_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  p record;
  qty integer;
  sub numeric := 0;
begin
  for it in select jsonb_array_elements(new.items::jsonb) loop
    qty := coalesce((it->>'quantity')::integer, 0);
    if qty < 1 or qty > 50 then raise exception 'Invalid quantity'; end if;
    select price, available into p from public.products where id = (it->'product'->>'id')::bigint;
    if not found or not p.available then
      raise exception 'An item in your cart is no longer available';
    end if;
    sub := sub + p.price * qty;
  end loop;
  if sub <= 0 then raise exception 'Your order is empty'; end if;
  new.subtotal := sub;
  new.delivery_fee := 1500;
  new.total := sub + 1500;
  new.status := 'Pending';
  new.payment_status := 'pending';
  new.delivery_agent_id := null;
  new.customer_id := auth.uid();
  if new.payment_method not in ('cash_on_delivery', 'mobile_money', 'card') then
    new.payment_method := 'cash_on_delivery';
  end if;
  return new;
end $$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

-- 6. Order steps: only valid status changes, and cash is marked paid when delivered
create or replace function public.orders_before_update()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'Pending' and new.status in ('Confirmed', 'Cancelled')) or
      (old.status = 'Confirmed' and new.status in ('Preparing', 'Cancelled')) or
      (old.status = 'Preparing' and new.status in ('Out for Delivery', 'Cancelled')) or
      (old.status = 'Out for Delivery' and new.status = 'Delivered')
    ) then
      raise exception 'Invalid status change: % to %', old.status, new.status;
    end if;
    if new.status = 'Delivered' and new.payment_method = 'cash_on_delivery' then
      new.payment_status := 'paid';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

-- 7. Delivery person updates (only their own assigned orders)
create or replace function public.delivery_set_status(p_order_id text, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_delivery_agent() then raise exception 'Not a delivery person'; end if;
  if p_status = 'Out for Delivery' then
    update public.orders set status = p_status
      where id::text = p_order_id and delivery_agent_id = auth.uid()
        and status = 'Preparing';
  elsif p_status = 'Delivered' then
    update public.orders set status = p_status
      where id::text = p_order_id and delivery_agent_id = auth.uid()
        and status = 'Out for Delivery';
  else
    raise exception 'Invalid status';
  end if;
  if not found then
    raise exception 'Order not found, not assigned to you, or not ready for this step';
  end if;
end $$;

-- 8. Demo online payment with a one-time code (OTP)
create table if not exists public.payment_otps (
  order_id text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0
);
alter table public.payment_otps enable row level security;

create or replace function public.request_payment_otp(p_order_id text, p_phone text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  o record;
  code text;
begin
  select id, customer_id, payment_method, payment_status, status into o
    from public.orders where id::text = p_order_id;
  if not found or o.customer_id is distinct from auth.uid() then raise exception 'Order not found'; end if;
  if o.payment_method = 'cash_on_delivery' then raise exception 'Cash on delivery does not need online payment'; end if;
  if o.payment_status = 'paid' then raise exception 'This order is already paid'; end if;
  if o.status = 'Cancelled' then raise exception 'This order was cancelled'; end if;
  if o.payment_method = 'mobile_money' and (p_phone is null or p_phone !~ '^07[2389][0-9]{7}$') then
    raise exception 'Enter a valid mobile money number such as 0788123456';
  end if;
  code := lpad((floor(random() * 900000) + 100000)::integer::text, 6, '0');
  insert into public.payment_otps (order_id, code_hash, expires_at, attempts)
    values (p_order_id, encode(digest(p_order_id || ':' || code, 'sha256'), 'hex'), now() + interval '5 minutes', 0)
    on conflict (order_id) do update
      set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0;
  -- DEMO ONLY: a real system sends the code by SMS instead of returning it.
  return json_build_object('demo_code', code, 'expires_in_minutes', 5);
end $$;

create or replace function public.confirm_payment_otp(p_order_id text, p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  o record;
  r record;
begin
  select id, customer_id into o from public.orders where id::text = p_order_id;
  if not found or o.customer_id is distinct from auth.uid() then raise exception 'Order not found'; end if;
  select * into r from public.payment_otps where order_id = p_order_id;
  if not found then return json_build_object('ok', false, 'message', 'Request a code first.'); end if;
  if r.expires_at < now() then return json_build_object('ok', false, 'message', 'The code expired. Request a new one.'); end if;
  if r.attempts >= 3 then return json_build_object('ok', false, 'message', 'Too many wrong attempts. Request a new code.'); end if;
  if r.code_hash <> encode(digest(p_order_id || ':' || p_code, 'sha256'), 'hex') then
    update public.payment_otps set attempts = attempts + 1 where order_id = p_order_id;
    return json_build_object('ok', false, 'message', 'Wrong code. Try again.');
  end if;
  update public.orders set payment_status = 'paid' where id::text = p_order_id;
  delete from public.payment_otps where order_id = p_order_id;
  return json_build_object('ok', true, 'message', 'Payment confirmed (demo). No real money was charged.');
end $$;

revoke execute on function public.request_payment_otp(text, text) from public, anon;
revoke execute on function public.confirm_payment_otp(text, text) from public, anon;
revoke execute on function public.delivery_set_status(text, text) from public, anon;
grant execute on function public.request_payment_otp(text, text) to authenticated;
grant execute on function public.confirm_payment_otp(text, text) to authenticated;
grant execute on function public.delivery_set_status(text, text) to authenticated;

-- 9. Customer feedback
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  order_id text not null unique,
  customer_id uuid not null default auth.uid(),
  rating integer not null check (rating between 1 and 5),
  comment text,
  featured boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.feedback add column if not exists featured boolean not null default true;
alter table public.feedback enable row level security;

drop policy if exists "customers add feedback" on public.feedback;
create policy "customers add feedback" on public.feedback
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id::text = order_id and o.customer_id = auth.uid() and o.status = 'Delivered'
    )
  );

drop policy if exists "customers change own feedback" on public.feedback;
create policy "customers change own feedback" on public.feedback
  for update to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

drop policy if exists "read feedback" on public.feedback;
create policy "read feedback" on public.feedback
  for select to authenticated
  using (customer_id = auth.uid() or public.is_store_admin());

-- 10. Reviews shown on the home page (first name only, 4 and 5 stars)
create or replace function public.public_testimonials(p_limit integer default 6)
returns table (rating integer, comment text, first_name text, avatar_url text, created_at timestamptz)
language sql stable security definer set search_path = public, auth as $$
  select f.rating,
         f.comment,
         split_part(coalesce(nullif(o.customer_name, ''), 'Customer'), ' ', 1) as first_name,
         nullif(u.raw_user_meta_data ->> 'avatar_url', '') as avatar_url,
         f.created_at
  from public.feedback f
  join public.orders o on o.id::text = f.order_id
  left join auth.users u on u.id = f.customer_id
  where f.featured
    and f.rating >= 4
    and f.comment is not null
    and length(trim(f.comment)) >= 5
  order by f.created_at desc
  limit least(greatest(p_limit, 1), 12);
$$;

revoke execute on function public.public_testimonials(integer) from public;
grant execute on function public.public_testimonials(integer) to anon, authenticated;

-- 11. Profile photos (public storage bucket "avatars")
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 12. Hardening: closed admin list, valid values, links between tables, indexes

-- A. Nobody can read or change the admin list or the payment codes through the website API.
alter table public.store_admins enable row level security;
revoke all on public.store_admins from anon, authenticated;
revoke all on public.payment_otps from anon, authenticated;

-- B. Only valid values can be stored in orders.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')) not valid;
alter table public.orders validate constraint orders_status_check;

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('cash_on_delivery', 'mobile_money', 'card')) not valid;
alter table public.orders validate constraint orders_payment_method_check;

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed')) not valid;
alter table public.orders validate constraint orders_payment_status_check;

-- C. Links between tables, so records cannot point to people who do not exist.
alter table public.orders drop constraint if exists orders_customer_fk;
alter table public.orders add constraint orders_customer_fk
  foreign key (customer_id) references auth.users (id) on delete set null not valid;

alter table public.orders drop constraint if exists orders_delivery_agent_fk;
alter table public.orders add constraint orders_delivery_agent_fk
  foreign key (delivery_agent_id) references public.delivery_agents (user_id) on delete set null not valid;

alter table public.feedback drop constraint if exists feedback_customer_fk;
alter table public.feedback add constraint feedback_customer_fk
  foreign key (customer_id) references auth.users (id) on delete cascade not valid;

-- D. Indexes, so pages stay fast when there are many orders.
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_agent_idx on public.orders (delivery_agent_id);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists feedback_customer_idx on public.feedback (customer_id);

-- 13. Order rules (updated): online orders must be paid before they are confirmed,
--     and an order cannot go out for delivery without a delivery person.
create or replace function public.orders_before_update()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'Pending' and new.status in ('Confirmed', 'Cancelled')) or
      (old.status = 'Confirmed' and new.status in ('Preparing', 'Cancelled')) or
      (old.status = 'Preparing' and new.status in ('Out for Delivery', 'Cancelled')) or
      (old.status = 'Out for Delivery' and new.status = 'Delivered')
    ) then
      raise exception 'Invalid status change: % to %', old.status, new.status;
    end if;
    if new.status = 'Confirmed' and new.payment_method <> 'cash_on_delivery' and new.payment_status <> 'paid' then
      raise exception 'This order must be paid online before it can be confirmed';
    end if;
    if new.status = 'Out for Delivery' and new.delivery_agent_id is null then
      raise exception 'Assign a delivery person before sending the order out';
    end if;
    if new.status = 'Delivered' and new.payment_method = 'cash_on_delivery' then
      new.payment_status := 'paid';
    end if;
  end if;
  return new;
end $$;
