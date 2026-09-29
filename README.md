# Hillcrest Woodworking — website

Static site (plain HTML/CSS/JS, no build step) hosted on Vercel.

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Intro, product categories, recent photos, how it works |
| Gallery | `gallery.html` | Photo gallery with category filters and a lightbox |
| Get a Quote | `quote.html` | Estimate request form → emailed to the business |
| Schedule | `schedule.html` | Date request for estimate visits, delivery/install, pickup |
| Order | `order.html` | Order form → emailed to the business |
| Pay | `pay.html` | PayPal checkout (deposit or balance) |

## Editing

- **Business details, form key, PayPal:** `js/config.js`
- **Gallery photos:** put images in `images/gallery/<category>/`, then add each one to the `photos` list in `js/gallery-data.js`. Resize photos to about 1600px wide (JPG) before adding so pages load fast.
- **Colors / styling:** the variables at the top of `css/styles.css`

## One-time setup

1. **Form emails (quote, schedule, order):** go to <https://web3forms.com>, enter the email that should receive requests, and paste the access key into `web3formsKey` in `js/config.js`.
2. **PayPal:** at <https://developer.paypal.com> log in with the business PayPal account → Apps & Credentials → **Live** → create an app → copy the **Client ID** into `paypal.clientId`. (Use a Sandbox client ID first if you want to test with fake money.) If you'd rather skip this, set `paypal.meHandle` to the PayPal.me name and the Pay page will send customers to PayPal.me instead.
3. Fill in `phone`, `email`, `serviceArea`.

## Run locally

```
npx serve .
```

Then open http://localhost:3000.

## Deploy

1. Push to GitHub (`hillcrestwoodworking/www`).
2. In Vercel: **Add New → Project →** import the repo. Framework preset: **Other**. No build command. Deploy.
3. Vercel → Project → **Settings → Domains** → add the domain and `www.` version.

### Pointing the GoDaddy domain at Vercel

**Option A: Vercel nameservers** (what's planned). In GoDaddy → Domain → DNS → Nameservers → **Change → I'll use my own** → enter the nameservers Vercel shows. **Before switching**, write down every record in GoDaddy's DNS, especially **MX / TXT** records if the domain has email. After the switch, GoDaddy's DNS records stop working, so re-create them in Vercel → Domains → DNS Records or email will break.

**Option B: keep GoDaddy DNS.** Add the A record and CNAME that Vercel shows in its Domains settings (typically `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`). Email and other records are left alone.
