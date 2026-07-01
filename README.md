# QR Manager — Dynamic QR Code System

QR codes point to `/q/:shortCode` on your server, never to the final destination.
Change the destination in the dashboard anytime — the printed QR code keeps working.

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt
- **Frontend:** React (Vite), Tailwind CSS, React Router, qrcode.react

## Folder structure
```
qr-system/
├── backend/
│   ├── config/db.js
│   ├── models/          User, QRCode, ScanLog
│   ├── middleware/      auth (JWT), validate, errorHandler
│   ├── controllers/     auth, qr, scan, dashboard
│   ├── routes/          authRoutes, qrRoutes, dashboardRoutes, publicRoutes
│   ├── utils/           shortCode generator, geoLookup, token, AppError
│   ├── seed/createAdmin.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/         axios instance + endpoint calls
        ├── context/      Auth, Theme, Toast
        ├── components/   Sidebar, Navbar, QRCard, QRFormModal, ConfirmDialog, ...
        └── pages/        Login, Dashboard, QRList, QRDetail
```

## 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env`:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `PUBLIC_BASE_URL` — the URL people will actually scan (e.g. `https://api.yourdomain.com`). This gets embedded in every QR code, so set it correctly before creating QR codes for print.
- `CLIENT_URL` — where the frontend runs (for CORS)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — used once to create the admin login

Create the admin account, then start the server:
```bash
npm run seed:admin
npm run dev        # nodemon, auto-restart
# or: npm start
```

The API runs on `http://localhost:5000` by default. `GET /api/health` confirms it's up.

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to your backend URL. Runs on `http://localhost:5173`.

Log in with the admin credentials you set in the backend `.env`.

## How a scan works

1. QR code encodes `PUBLIC_BASE_URL/q/:shortCode` — nothing else.
2. A scan hits the backend, which immediately records the scan (IP-based
   country/state/city, timestamp) and increments the scan count.
3. The response is a small HTML page (not an instant redirect) that asks
   the browser for GPS permission for ~2.5 seconds. If granted, the
   coordinates are sent back and attached to that scan log.
4. Either way, the page then redirects to the current destination URL
   stored in the database.

## API endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | — | Admin login, returns JWT |
| GET | `/api/auth/me` | JWT | Current admin profile |
| GET | `/api/qrcodes` | JWT | List all QR codes |
| POST | `/api/qrcodes` | JWT | Create a QR code |
| GET | `/api/qrcodes/:id` | JWT | Single QR code |
| PUT | `/api/qrcodes/:id` | JWT | Update title/destination |
| DELETE | `/api/qrcodes/:id` | JWT | Delete QR code + its scan logs |
| GET | `/api/qrcodes/:id/scans` | JWT | Scan history for one QR code |
| GET | `/api/dashboard/stats` | JWT | Dashboard totals + recent scans |
| GET | `/q/:shortCode` | — | Public: records scan, redirects |
| PATCH | `/api/public/scan/:scanLogId/location` | — | Public: attaches GPS if granted |

## Deploying

A small VM works fine for this (e.g. Oracle Cloud Always Free tier):
- Run the backend with `pm2` or a `systemd` service so it restarts on crash/reboot.
- Build the frontend (`npm run build` → `frontend/dist`) and serve it with Nginx,
  reverse-proxying `/api` and `/q` to the Node backend on the same domain —
  that also sidesteps CORS entirely.
- Put both behind HTTPS (e.g. Certbot) since browsers block GPS permission
  prompts on plain HTTP for any domain other than localhost.

## Notes
- IP-based geolocation uses the free `ip-api.com` endpoint from the backend —
  no API key needed, but it requires the server to have outbound internet access.
- Passwords are hashed with bcrypt; the frontend never sees or stores a plaintext password.
- There's no self-serve admin signup by design — add more admins by running
  `seed:admin` again with different `ADMIN_USERNAME`/`ADMIN_PASSWORD` values,
  or insert directly via MongoDB.
