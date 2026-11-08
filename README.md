# OurDailyFood

A web-based fast-food ordering and delivery system for Rwanda. Customers order food online, the restaurant manages the menu and orders, and delivery people deliver them.

## Features

**Customers**
- Register with an optional profile photo, log in, reset a forgotten password
- Browse the menu, add items to the cart, enter a delivery location
- Pay by cash on delivery, or online (demo) with a one-time code
- Track an order from Pending to Delivered; the status updates automatically
- Rate a delivered order; good reviews appear on the home page
- Edit the profile (name, phone, photo)

**Admin**
- Add, price, hide and remove menu items
- Confirm orders and move them forward step by step
- Assign a delivery person to an order
- Sales and order reports, with a CSV download

**Delivery person**
- See assigned orders with the customer's address and phone number
- Mark orders Out for Delivery and Delivered

## Technology

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Supabase: authentication, PostgreSQL database, file storage
- lucide-react icons

## Order steps

Pending, Confirmed, Preparing, Out for Delivery, Delivered (or Cancelled).
The database allows only valid steps, recalculates prices on the server when an order is placed, and marks cash orders as paid when they are delivered.

## Pages

| Address | Who | Purpose |
|---|---|---|
| `/`, `/menu`, `/menu/[id]`, `/about`, `/contact` | Everyone | Browse the site |
| `/cart`, `/checkout` | Everyone | Order food |
| `/register`, `/login`, `/forgot-password`, `/reset-password` | Everyone | Accounts |
| `/my-orders`, `/profile` | Customer | Orders, payment, rating, profile |
| `/delivery` | Delivery person | Assigned deliveries |
| `/admin-login`, `/admin`, `/admin/assign`, `/admin/menu`, `/admin/reports` | Admin | Manage the restaurant |

## Run it

You need Node.js 20 or newer (https://nodejs.org). The steps are the same on Windows and Mac; only the terminal and a few commands differ.

### On Windows (PowerShell)

```powershell
cd path\to\ourdailyfood_website
npm install
notepad .env.local
npm run dev
```

### On Mac (Terminal)

```bash
cd path/to/ourdailyfood_website
npm install
nano .env.local
npm run dev
```

On a Mac you can also install Node with Homebrew: `brew install node`.

### The .env.local file

Create a file named `.env.local` in the project folder with these two lines (copy the values from your Supabase project, under Project Settings, API):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### Set up the database

In the Supabase SQL Editor, create the tables (orders, products, feedback, delivery_agents, payment_otps), their security rules and functions. Also create a public storage bucket named `avatars` for profile photos.

### Open the site

Open http://localhost:3000

For a faster run, for example in a demonstration:

```
npm run build
npm start
```

### If something looks wrong

Delete the generated folder and start again.

Windows:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

Mac:

```bash
rm -rf .next
npm run dev
```

If the project folder was copied from another computer (for example from a Mac to Windows), delete `node_modules` and run `npm install` again, because the installed packages are different on each system.

## Check the project

```
npm run lint
npx tsc --noEmit
npm run build
```

## Roles

- **Customer:** anyone who registers on the site.
- **Admin:** an account recognised by the `is_store_admin` function in the database. Sign in at `/admin-login`.
- **Delivery person:** a user listed in the `delivery_agents` table. Create the user in Supabase (Authentication, Users), then add a row for that user in `delivery_agents`.

## Menu images

Food photos are in `public/images/products/`. To use a new photo, copy it into that folder, then add or edit the menu item in the admin page and type its path, for example `/images/products/my-photo.jpg`.

## Documentation

The UML diagrams (use case, sequence, activity, state and class) are in the `docs` folder.

## Important notes

- Online payment is a demonstration. No real money is charged, and the one-time code is shown on screen instead of being sent by SMS.
- There is no GPS tracking yet.
- Never upload `.env.local` or any file that contains passwords. They are listed in `.gitignore`.

## Future work

- Real payment provider (for example MTN MoMo) with verified payment confirmations
- Real SMS or email for confirmation codes
- GPS delivery tracking
- Automated tests
