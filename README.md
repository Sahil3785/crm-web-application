# Company CRM

A CRM with separate admin, HR and employee portals: lead pipeline, call logs, attendance, tasks, tickets, documents and subscriptions. Built with Next.js, TypeScript, Tailwind and shadcn/ui.

## Local database

The app runs on a database that lives in the browser (`lib/localDb.ts`), so it needs no hosted backend and never goes down because a database paused. It implements the parts of the Supabase client the app uses (queries, filters, joins such as `assigned_to(full_name)`, auth and file storage), and saves everything in `localStorage`.

- Demo data is created on the first visit from `lib/seedData.ts`, with dates relative to today.
- Changes are kept in that browser until you click **Reset demo data** on the login page.
- Each visitor gets their own copy, so nothing they change affects anyone else.

## Demo logins

Use the one-click buttons on the login page, or sign in by hand:

| Profile  | Email               | Password   |
| -------- | ------------------- | ---------- |
| Admin    | admin@demo.crm      | demo1234   |
| Employee | employee@demo.crm   | demo1234   |
| HR       | hr@demo.crm         | demo1234   |

## Run it

```bash
npm install
npm run dev
```

## Moving back to Supabase

`supabase/recreate_database.sql` has the full schema. To use a real database again, create the client in `lib/supabaseClient.ts` with `createClient(url, anonKey)` from `@supabase/supabase-js` (and add that package back). Every page imports `supabase` from that one file.
