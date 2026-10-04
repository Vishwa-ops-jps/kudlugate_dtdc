# DTDC Kudlu Gate — Courier Website (Node.js + Express + MongoDB)

A full-stack site for the DTDC Kudlu Gate franchise: parcel booking (tracking redirects to the official DTDC site)
(staff or customer self-booking), a shipping cost calculator, PDF receipts and
shipping labels, customer accounts with order history, multi-branch staff
accounts, an admin analytics dashboard, testimonials, a contact form, password
reset, and email/SMS delivery notifications.

## What's inside

- **Backend:** Node.js, Express, Mongoose (MongoDB Atlas)
- **Frontend:** Plain HTML/CSS/JS (no build step, no framework) + Chart.js via CDN for the analytics dashboard
- **Auth:** JWT, with three roles — `customer`, `staff`, `admin` — plus email-based "forgot password" reset
- **PDFs:** Booking receipts and shipping labels, generated server-side with `pdfkit`
- **Notifications:** Email via Nodemailer (free, works with a Gmail app password). SMS via Twilio (optional, needs a paid account).

## 1. Set up MongoDB Atlas (free tier)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free **M0 cluster**.
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, add your current IP (or `0.0.0.0/0` while testing).
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## 2. Configure the project

1. Install Node.js v22.5+ if you haven't already (https://nodejs.org).
2. Open this folder in VS Code.
3. Copy `.env.example` to a new file named `.env`.
4. Paste your Atlas connection string into `MONGODB_URI`, and add a database name
   before the `?`, e.g. `...mongodb.net/dtdc_kudlu_gate?retryWrites=true...`
5. Set `JWT_SECRET` to any long random string.
6. (Optional) Fill in the `EMAIL_*` settings with a Gmail address and an
   **App Password** (Google Account → Security → 2-Step Verification → App
   passwords) if you want email notifications to actually send. Set
   `EMAIL_ENABLED=true` once you've done that.
7. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to whatever you want your first admin
   login to be.
8. Set `APP_BASE_URL` to wherever the site is running (`http://localhost:3000`
   for local dev). It's only used to build the link inside "forgot password"
   emails — update it to your real domain once deployed.

## 3. Install and run

Open a terminal in this folder:

```bash
npm install
npm run seed     # creates your admin account, the Kudlu Gate branch, and default rates
npm start
```

Then open **http://localhost:3000** in your browser.

- Log in to the staff panel at **http://localhost:3000/admin/login.html** with
  the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`.
- From there, use **Branches & Staff** to add more branches and staff logins.
- Customers sign up themselves at **/register.html**.

For development with auto-restart on file changes, use `npm run dev` instead of `npm start`.

## Roles at a glance

| Role     | Can do |
|----------|--------|
| customer | Register/login, book their own parcels, view order history + download receipts, submit reviews, reset a forgotten password |
| staff    | Book parcels for their branch, update parcel status (their branch only), print shipping labels |
| admin    | Everything staff can do, plus: manage branches, manage staff accounts, approve/delete reviews, view/resolve enquiries, edit the rate card, view the analytics dashboard |

## Notes on the two optional notification channels

- **Email** works out of the box once `EMAIL_ENABLED=true` and Gmail app-password
  credentials are set — no extra install needed.
- **SMS** needs a paid Twilio account. If you want it: `npm install twilio`,
  fill in the `TWILIO_*` variables, and set `SMS_ENABLED=true`. Until then it's
  silently skipped and everything else keeps working.

## Project structure

```
server/
  server.js          Express app entry point
  config/db.js        MongoDB connection
  models/              Mongoose schemas (User, Branch, Parcel, Review, Enquiry, RateConfig)
  routes/              API endpoints
  middleware/auth.js   JWT auth + role checks
  utils/               email.js, sms.js, helpers.js, validators.js, pdf.js (receipts/labels)
  seed.js              One-time setup script
public/
  index.html, calculator.html, contact.html, book.html
  login.html, register.html, forgot-password.html, reset-password.html
  dashboard.html, reviews.html
  admin/login.html, admin/dashboard.html
  css/style.css
  js/api.js, js/chrome.js
```
