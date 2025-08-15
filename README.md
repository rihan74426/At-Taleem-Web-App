Table of contents

Overview

Tech stack

Repo structure (high level)

Environment variables

Local development

Database & indexes

Auth (Clerk)

Cron jobs & scheduled tasks

Email & notifications

Payments notes

Security & secrets (important)

Common issues & debugging tips

Recommended next steps / production checklist

Contact / Contribute

Overview

At-Taleem Web App provides:

Event management (weekly/monthly/yearly), creation, auto-generation for weekly events.

User management via Clerk (roles, public metadata for user preferences).

Notifications (in-app + email) and scheduled reminders.

Institutions listing and admission notifications.

Orders (bookstore) & payment integrations (SSLCommerz; alternative considered: bKash).

Admin controls (feature/complete/cancel events, send emails, manage institutions).

TailwindCSS + Flowbite UI components, server routes in Next.js App Router.

Tech stack

Frontend / Backend: Next.js (App Router)

Database: MongoDB (mongoose)

Auth: Clerk (user management)

Styling: Tailwind CSS, Flowbite

Email: Custom /api/emails route (recommend using a transactional provider like SendGrid/Postmark/Mailgun)

Hosting / Cron: Vercel (app + serverless routes). Note: Vercel's cron limitations on free plans.

Optional: Firebase admin (for push / storage) — do not commit service keys.

Repo structure (high level)
/src
/app
/api
/events
/institutions
/emails
/orders
/...routes
/lib
/models
Event.js
Institution.js
Order.js
Masalah.js (planned)
/mongodb
mongoose.js
/components
/styles
...
package.json
vercel.json (or crons config)
README.md

Environment variables

Create a .env.local in the project root (do not commit this). Example variables used by the app (names found across your codebase and common conventions):

# MongoDB

MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/your-db?retryWrites=true&w=majority"

# Clerk

NEXT*PUBLIC_CLERK_PUBLISHABLE_KEY=pk*...
CLERK*SECRET_KEY=sk*...
NEXT_PUBLIC_CLERK_FRONTEND_API=your-clerk-frontend-api

# App URLs / secrets

URL=https://your-site.com # production / used in emails
BASE_URL=http://localhost:3000 # local server base

# Cron secret (must match Authorization header used when calling cron endpoints)

CRON_SECRET=very-long-random-secret

# Email provider (recommended)

SENDGRID_API_KEY=xxx
EMAIL_FROM=notifications@yourdomain.com

# Firebase admin (if used)

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Payment (SSLCommerz) - or your payment gateway credentials

SSLCZ_STORE_ID=...
SSLCZ_STORE_PASSWORD=...

# Other (analytics, Sentry)

SENTRY_DSN=...

Important: For multi-line secrets such as FIREBASE_PRIVATE_KEY, store the key with \n sequences or use Vercel secret handling which preserves newlines. In Node you might need to process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').

Local development

Clone the repo:

git clone https://github.com/rihan74426/At-Taleem-Web-App.git
cd At-Taleem-Web-App

Install dependencies:

npm install

# or

pnpm install

Create .env.local using the variables above.

Run Dev server:

npm run dev

# Next will run at http://localhost:3000

Connect Clerk dev environment and MongoDB cluster string to your .env.local.

Database & Indexes

Models (Event, Order, Institution, Masalah) include common indexes. Ensure your MongoDB cluster has appropriate indexes for:

startDate, scope, createdBy, completed, canceled, notificationWants, etc.

If you run large list queries, consider paginating and using proper indexes to avoid full collection scans.

Backups: enable automatic backups for your DB (Atlas provides this).

Auth (Clerk)

Clerk provides both client (browser) and server helpers.

Use @clerk/nextjs on the client.

Use @clerk/nextjs/server for server routes (currentUser(), clerkClient).

Important: currentUser() and other Clerk helpers that depend on request headers must be called inside your route handler (not at module top-level). In Next.js app routes you might need to await or ensure proper server context.

Developer note: Clerk SDK return shapes changed between versions — check clerkClient.users.getUserList() return: older versions returned an array; newer may return { users, nextCursor }. Inspect the return value or log it while developing.

Cron jobs & scheduled tasks

You use server routes for cron tasks (e.g., auto create weeklies, daily reminders, mark complete). Vercel cron jobs can hit those routes.

Important limitations & suggestions:

On the free Vercel plan you might be limited in the number of scheduled jobs or frequency. If Vercel cron is restricted:

Combine multiple daily tasks into one route (you already did that).

Or use an external scheduler (e.g., GitHub Actions workflow_dispatch/cron, cron-job.org, EasyCron, Upptime, or a small server on Railway/Render).

Always protect cron endpoints with Authorization: Bearer ${CRON_SECRET} and verify on the server.

Example vercel.json crons (or use Vercel dashboard scheduled jobs):

{
"crons": [
{ "path": "/api/events/reminders/daily", "schedule": "0 6 * * *" },
{ "path": "/api/events/reminders/hourly", "schedule": "0 18 * * *" }
]
}

If Vercel blocks you from creating many jobs, put daily tasks in one route that runs once per day at a set time and make the hourly reminders triggered by an external scheduler or set a single hourly job.

Email & notifications

You have an /api/emails route. For production use, wire it to a trusted transactional email provider (SendGrid, Postmark, Mailgun).

Keep emails plain-text fallback and a responsive HTML template for clients.

When sending bulk emails, throttle and respect provider rate limits. For large lists, send in batches.

Payments

You implemented SSLCommerz; it can be complex and bureaucratic.

Alternative: accept manual bKash/mobile payments and let users provide transaction IDs — then verify using:

bKash server API (requires merchant account and API access), or

Ask users to provide screenshots and verify manually (only acceptable for low-volume).

Consider using Stripe (international) or other local gateways that provide server APIs and webhooks.

Always verify the amount and orderId returned from gateway against DB before marking orders as paid.

Security & secrets (important)

Never commit keys, service-account JSON, or .env to GitHub. Rotate any keys that have been committed (you already received a GCP notification — rotate that service account key immediately).

Use Vercel Environment Variables to store secrets (they don't appear in repo).

For Firebase admin private key: store in env and replace \\n with \n in runtime.

Use HTTPS for all webhook/callback endpoints and validate incoming requests (signature verification if provided).

Common issues & debugging tips

headers() must be awaited / currentUser() failing: In Next.js App Router, server helpers that read headers can cause issues if used synchronously at module top-level. Always call await currentUser() or await getAuth(req) inside the route handler.

Clerk getUserList return value: It may return an array or an object { users, nextCursor } depending on SDK version. Log the returned value to know how to extract user array.

Firebase key invalid PEM: When deploying, the private key may lose newline characters; convert \\n back to \n.

Vercel cron not triggering:

Confirm cron job configured in Vercel project settings or vercel.json.

Ensure the route responds within Vercel serverless timeout (keep work light / use queues).

Check logs in Vercel dashboard for 5xx/504 errors.

Duplicate autogenerated events: When checking for existing events, ensure query uses the same Date normalization (e.g., compare by ISO day or compare by date range startDate >= dayStart && startDate < nextDayStart). Timezone differences can cause duplicates. Store startDate at midnight UTC or use date-only representation.

Upstream image 404 (Next image optimizer): The external image URL returned 404; Next's image optimizer fails. Ensure the URL is accessible and add that domain to next.config.js images.domains/remotePatterns.

Recommended next steps / production checklist

Rotate any leaked credentials (Firebase/any service).

Use a transactional email provider and configure /api/emails accordingly.

Configure Monitoring & Logs: Sentry / LogRocket / Vercel logs for errors and alerts.

Backups: Enable MongoDB Atlas backups.

Rate limiting for endpoints that may be abused (you already added rate limiter in payment verify - apply elsewhere).

Unit + Integration tests for critical routes (orders, payment verify, cron).

E2E tests with Playwright or Cypress for critical flows (signup, payment, event creation).

CI/CD: GitHub Actions for lint/test, and Vercel for deploy.

SEO: add localized metadata (Bengali) for primary pages, and English alternate metadata for search engines indexing. Use JSON-LD structured data where appropriate.

Accessibility checks (axe, Lighthouse).

Privacy / Terms: add Privacy Policy and Terms pages if you collect payments/data.

Useful commands

# dev

npm run dev

# lint

npm run lint

# build

npm run build

# start (production)

npm start

(Adjust based on your package.json scripts.)

Where to look when something breaks

Vercel dashboard → Functions / Serverless logs

MongoDB Atlas logs & slow query profiler

Clerk dashboard → API logs & webhook logs

Email provider logs (SendGrid/Postmark)

Local console and console.error traces in your server routes

Final notes

This repository contains a lot of solid functionality and many pragmatic decisions (auto-creating weeklies, consolidated cron, Clerk for user prefs). Before public launch, prioritize security (rotate leaked keys), email reliability, and robust payment verification. If Vercel cron limitations continue to block scheduling, consider an external scheduler or a light worker on Railway/Render.
