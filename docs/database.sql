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
