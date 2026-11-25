# Shop with Vikky backend

Modular Node.js/Express storefront and API using PostgreSQL. Requires Node.js 20+.

## Local setup

1. Copy `.env.example` to `.env`. Set `DATABASE_URL` to your Supabase Session Pooler string, Cloudinary credentials, a unique `JWT_SECRET` (at least 32 characters), and strong admin credentials.
2. Run `npm install`, `npm run seed`, then `npm run dev`.
3. The storefront and API are served at `http://localhost:5000`. `GET /health` checks the API and database.

Never commit `.env`. For production, deploy this server to Render (`PORT` is provided automatically), set `FRONTEND_URL` to the Vercel storefront origin, and set `COOKIE_SECURE=true`. The Vercel project should use the repository root, with `VITE_API_URL` set to the Render URL. Product images upload to the Cloudinary `fashion-store` folder.

## API overview

- Public: `GET /api/products`, `/api/categories`, `/api/settings`, `POST /api/orders`, `GET /api/orders/track/:trackingCode`, `POST /api/contact`, `POST /api/newsletter`.
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/csrf`.
- Admin (admin role required): `/api/admin/products`, `/api/admin/categories`, `/api/admin/orders`, `/api/admin/settings`, `POST /api/admin/uploads`.

Admin mutations and logout require the CSRF token returned by `/api/auth/csrf` in the `X-CSRF-Token` header. The API uses an httpOnly JWT cookie; browser clients should send credentials. Cart line prices and totals are always read from PostgreSQL, never trusted from the client. Order creation accepts `items: [{ productId, quantity }]`, customer name/email/phone/address, and a `paymentMethod` of `whatsapp` or `bank`.

## Assets and uploads

The supplied logo is available as `public/images/logo-full.png`. `logo-transparent.png` currently matches the supplied image; no background extraction was performed. Create `public/images/logo-icon.png` only from an approved standalone icon asset. Admin uploads are stored on Cloudinary and saved as `image_url` HTTPS links.

## Operations

Run `npm start` for production. The server listens on `process.env.PORT` or 5000, creates tables on startup, and exposes `GET /health` for uptime checks. `npm run seed` creates the initial catalog and administrator from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`; it is safe to rerun and does not replace existing products or reset an existing admin password.

## Storefront

- Customer pages are served from `public/`, including the home, shop, product, cart, checkout, success, tracking, about, contact, FAQ and 404 pages.
- The complete customer application is available at `http://localhost:5000`.
- The protected dashboard is available at `http://localhost:5000/admin/`.
- In the admin dashboard, Products supports adding, editing, hiding/reactivating, and permanently deleting products; image uploads, pricing, stock, category assignment, and homepage placement flags are available there. Hiding a product is safer than deleting it when you want to retain its history.
- Replace `public/images/logo-full.png` for the full logo, `public/images/logo-transparent.png` for transparent navigation artwork, and `public/images/logo-icon.svg` for the silhouette/favicon.
