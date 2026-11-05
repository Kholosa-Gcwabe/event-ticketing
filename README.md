# For Public Use: Event Ticketing

A small ticketing system for live events, built on Supabase (database, logins, server functions) and static pages hosted on Netlify. It covers an admin dashboard, QR gate scanning, gate sales, online ticket sales through Yoco, emailed tickets and end-of-event reports. Prices are in South African rand (ZAR).

It was used at a live concert in Khayelitsha, where it produced the ticket sales report for the event organiser. It is designed to be leased to one organiser at a time: the owner creates the logins, the organiser runs their event, the owner sends the report, then the access is removed.

## What is in this repo

| File | What it is |
|---|---|
| `index.html` | Admin dashboard: event details, tickets, prices and limits, online sales, reports, scan history |
| `scanner.html` | Gate staff app: scan QR codes, type a code, sell tickets at the gate (cash or EFT) |
| `buy.html` | Public page where buyers choose tickets and pay online |
| `ticket.html` | The buyer's ticket page (QR codes), reached after paying or from the email |
| `config.js` | Supabase address and publishable key, and the optional Turnstile site key |
| `sw.js`, `manifest-*.json`, `icon-*.png` | Service worker, manifests and icons so admin and scanner install on a phone |
| `online-sales/*.sql` | Database updates for online sales, ticket type limits, email tracking and safety |
| `online-sales/functions/` | Server functions (Supabase Edge Functions, TypeScript): `create-checkout`, `yoco-webhook`, `yoco-settings`, `send-tickets` |

## How it works

**Roles.** `owner` can do everything, including deleting and clearing data and seeing the team list. `admin` runs one event. `staff` is a gate login that can scan and sell at the gate only. Logins are created in Supabase and can have an expiry date.

**Check-in.** Every ticket has a unique ID (the QR code) and a short code such as `FPU-A1B2C3`. Check-in happens in one database step, so a ticket cannot be admitted twice, even if two scanners read it at once.

**Online sales.**
1. The buyer opens `buy.html?e=<link-name>`, picks a ticket and enters a name and contact.
2. `create-checkout` reserves the places for 20 minutes and creates a Yoco payment. The price always comes from the database, never from the browser.
3. The buyer pays on Yoco's page. The money goes to the organiser's own Yoco account, not through the platform owner.
4. Yoco calls `yoco-webhook`. The signature is checked, then the tickets are created. No payment confirmation, no tickets.
5. The buyer lands on `ticket.html` and `send-tickets` emails them a link (Resend).

**Capacity.** The event has an overall capacity and each ticket type can have its own limit. Sold tickets, tickets being paid for and gate sales all count. Voided and refunded tickets free their place.

**Secrets.** The Yoco secret key is stored in the database where only the server functions can read it. It is never sent to a web page. Only the Supabase publishable key and the Turnstile site key are in `config.js`, and both are safe to be public.

## Tech

Supabase (PostgreSQL, Auth, Edge Functions, row-level security), TypeScript, vanilla JavaScript, Yoco payments, Resend email, Cloudflare Turnstile, installable PWA, Netlify hosting.

## Setup

1. **Supabase project.** Run the base schema SQL, then create your own login and give it the `owner` role in the `profiles` table.
2. **Config.** Open `config.js` and set `SUPABASE_URL` and `SUPABASE_KEY` to your own project's address and `sb_publishable_` key. Never put a secret key in this file.
3. **Run the SQL files** in `online-sales/`, in order: `1-online-sales.sql`, `2-type-limits.sql`, `3-email-and-safety.sql`. Each is safe to run more than once.
4. **Create four Edge Functions** with exactly these names: `create-checkout`, `yoco-webhook`, `yoco-settings`, `send-tickets`. Turn **Verify JWT off** on all four. They check security themselves, because Yoco and buyers are not logged in.
5. **Secrets** (Supabase, Edge Functions, Secrets):
   - `SITE_URL`: your live address with no trailing slash
   - `RESEND_API_KEY` and `MAIL_FROM`: for emailed tickets (verify your domain at resend.com first)
   - `TURNSTILE_SECRET`: optional, for the bot check
6. **Deploy the pages** by pushing this repo to GitHub and connecting it to Netlify.
7. **Optional bot check.** Create a free Turnstile widget at Cloudflare, put the site key in `config.js` as `TURNSTILE_SITEKEY`, and the secret in `TURNSTILE_SECRET`.

## Running an event

1. In Supabase, create the organiser's admin login and the gate staff logins with an expiry date after the event.
2. The organiser signs in to the admin page, sets the event name, date, venue and capacity, and sets ticket prices and limits.
3. **Online sales:** connect the organiser's Yoco account from the Sales section (use the `sk_test_` key first), tick **Online** on the ticket types to sell, set a link name, support contact and terms, tick **Online sales are open** and save. Copy the buy link.
4. Do one test purchase with the test key. When it works, connect the `sk_live_` key.
5. At the event, staff use the scanner. Gate sales can be cash or EFT and are included in the report.
6. After the event: download the event report, send it to the organiser, disconnect Yoco, clear the tickets and scan history, and remove the logins.

## Admin features

- Mark paid, void, restore, check in or undo on any ticket. Voiding does not refund money.
- Online orders show PAID, PENDING, FAILED or EXPIRED, EMAILED or NOT EMAILED, and CHECK when something needs attention (wrong amount, or payment after the 20-minute hold). Resend email and Resolved are on each order.
- Refunds: refund the buyer in the Yoco dashboard first, then press **Mark refunded**. It cancels the order's tickets, frees the places and shows in the report.
- Bulk issue tickets from a pasted list or CSV, and download ticket packs (ZIP) by group.
- Scan history with search and filters, and an end of night report with cash and EFT reconciliation.

## Security notes

- Row-level security is on for every table. Gate staff cannot read orders or payment settings.
- Webhooks are accepted only with a valid Yoco signature, within 3 minutes, and only for the matching event. Wrong amounts create no tickets.
- Logins last only for the browser session and sign out after inactivity (15 minutes on admin, 30 on the scanner).
- Buyers are limited to 3 unpaid orders per email and 10 per device. Only a one-way hash of the network address is stored.
- Reports and ticket lists contain guests' personal details (POPIA applies in South Africa). Share them carefully and delete them when no longer needed.

## Known limits

- One event at a time per deployment. The admin page loads the first event.
- Refunds are done in Yoco, then recorded in the admin page. They are not automatic.
- Emails contain a link and ticket codes, not QR images.
- Supabase free projects can pause when unused, so check the project is awake before an event and download the ticket list as a backup.
- Each organiser needs their own approved Yoco account for live payments.
- Always do a real test purchase on every new setup.

## Author

Built by Kholosa Gcwabe, Cape Town. [github.com/Kholosa-Gcwabe](https://github.com/Kholosa-Gcwabe)
