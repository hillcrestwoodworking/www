# Hillcrest Woodworking — website

Plain HTML/CSS/JS site on Vercel, plus a few small Vercel Functions (`api/`) that power the owner's Admin page.

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Intro, product categories, recent work, how it works |
| Gallery | `gallery.html` | Work samples / products with photos, prices, category filters and a lightbox |
| Get a Quote | `quote.html` | Estimate request form → emailed to the business |
| Schedule | `schedule.html` | Date request for estimate visits, delivery/install, pickup |
| Order | `order.html` | Order form → emailed to the business |
| Pay | `pay.html` | PayPal checkout (deposit or balance) |
| Admin | `admin.html` | Password-protected: upload job photos, set products and prices |

## Admin portal (owner only)

Footer → **Admin** (bottom-right), or go to `/admin.html`. Log in with the admin password, then:

- **+ Add Item:** add photos (straight from the phone camera roll), a title, category, optional price ("Starting at" if you like) and a description. Photos are shrunk automatically before uploading.
- Leave the price blank and the gallery shows **Get a Quote** instead of **Order This**.
- **↑ / ↓** sets the order on the site. **Hide** takes an item off the site without deleting it.
- **Delete** needs two taps. Photos from deleted items are cleaned up automatically.
- Changes show on the public site within about a minute.

Customers can't change anything. Every admin action is checked on the server, the login is an HttpOnly cookie that lasts 14 days, and the admin page is hidden from search engines.

### Setup (one time)

1. **Photo storage:** Vercel → your project → **Storage → Create → Blob** → connect it to the project (all environments). Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
2. **Password:** Vercel → project → **Settings → Environment Variables** → add `ADMIN_PASSWORD` (at least 8 characters; longer is better) for Production, Preview and Development.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables take effect.

To change the password later, update `ADMIN_PASSWORD` in Vercel and redeploy. That signs everyone out.

## Other settings

- **Business details, form key, PayPal:** `js/config.js`
- **Gallery categories:** `js/gallery-data.js` (photos and prices are managed on the Admin page)
- **Colors / styling:** the variables at the top of `css/styles.css`

1. **Form emails (quote, schedule, order):** go to <https://web3forms.com>, enter the email that should receive requests, and paste the access key into `web3formsKey` in `js/config.js`.
2. **PayPal:** at <https://developer.paypal.com> log in with the business PayPal account → Apps & Credentials → **Live** → create an app → copy the **Client ID** into `paypal.clientId`. (Use a Sandbox client ID first if you want to test with fake money.) If you'd rather skip this, set `paypal.meHandle` to the PayPal.me name and the Pay page will send customers to PayPal.me instead.
3. Fill in `phone`, `email`, `serviceArea`.

## Run locally

```
npm install
npm run dev        # runs `vercel dev` — site + admin API at http://localhost:3000
```

The first run asks you to log in to Vercel and link this folder to the project. Local secrets go in `.env.local` (git-ignored; see `.env.example`):

- `ADMIN_PASSWORD`: any password for local testing
- `BLOB_READ_WRITE_TOKEN`: copy from Vercel → Storage → your Blob store → **.env.local** tab

Note: the local site uses the **same** Blob store as the live site, so photos you add while testing appear live. Hide or delete test items when you're done, or create a second Blob store just for Development.

`npx serve .` also works for looking at pages, but without the API: the gallery then uses the fallback list in `js/gallery-data.js` and the Admin page won't work.

## Deploy

1. Push to GitHub (`hillcrestwoodworking/www`).
2. In Vercel: **Add New → Project →** import the repo. Framework preset: **Other**. Leave the build command empty. Deploy.
3. Set up the Admin portal (above).
4. Vercel → Project → **Settings → Domains** → add the domain and `www.` version.

### Pointing the GoDaddy domain at Vercel

**Option A: Vercel nameservers** (what's planned). In GoDaddy → Domain → DNS → Nameservers → **Change → I'll use my own** → enter the nameservers Vercel shows. **Before switching**, write down every record in GoDaddy's DNS, especially **MX / TXT** records if the domain has email. After the switch, GoDaddy's DNS records stop working, so re-create them in Vercel → Domains → DNS Records or email will break.

**Option B: keep GoDaddy DNS.** Add the A record and CNAME that Vercel shows in its Domains settings (typically `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`). Email and other records are left alone.
