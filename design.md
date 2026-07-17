# QR Management System — Technical Design Document

This document outlines the architecture, database schema, API design, security model, and key technical specifications of the QR Management System.

---

## 1. System Overview
The system is a developer-grade, secure, multi-user SaaS platform for generating and managing dynamic QR codes. It supports role-based access control (RBAC), global system settings, usage limit controls, user self-registration toggles, scan tracking (scan counting, location logging), and advanced settings like auto-expiration dates and CSV history exports.

### High-Level Flow
```
               [ User Browser ]
                 /          \
  (App Layout / UI)        (Dynamic QR Scans)
               /              \
    [ React SPA Frontend ]    [ Express Backend ]
              \                /
             [ REST API Endpoint ]
                       |
               [ MongoDB Database ]
```

---

## 2. Technology Stack
- **Frontend:** React (Vite), Tailwind CSS (Premium Dark Navy Theme), React Router DOM, Lucide Icons, `qrcode.react`.
- **Backend:** Node.js, Express, MongoDB (Mongoose), JSON Web Tokens (JWT), `bcryptjs`.
- **Hosting Model:** Serverless-compatible (designed for Vercel/similar environments, avoiding persistent background state loops).

---

## 3. Database Schema Design

The database contains four core MongoDB collections.

### 3.1. User Schema (`User`)
Stores account credentials, profile metadata, and system privileges.
```javascript
{
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  department: { type: String, required: true, trim: true }
}
```

### 3.2. Settings Schema (`Settings` — Singleton)
Stores global system configurations. Only one document exists in this collection.
```javascript
{
  allowSelfRegistration: { type: Boolean, default: true },
  maxQrLimitPerUser: { type: Number, default: 20 }
}
```

### 3.3. QR Code Schema (`QRCode`)
Stores the dynamic QR redirect configurations, metadata, expiration rules, and usage state.
```javascript
{
  title: { type: String, required: true, trim: true },
  destinationUrl: { type: String, required: true, trim: true },
  shortCode: { type: String, required: true, unique: true },
  scanCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}
```

### 3.4. Scan Log Schema (`ScanLog`)
Logs scan interactions for analytics.
```javascript
{
  qrCode: { type: Schema.Types.ObjectId, ref: 'QRCode', required: true },
  scannedAt: { type: Date, default: Date.now },
  userAgent: { type: String },
  ip: { type: String },
  location: {
    country: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  }
}
```

---

## 4. API Endpoint Specifications

All administrative and standard user endpoints are prefixed with `/api` and require a JWT token passed in the headers (`Authorization: Bearer <token>`).

### 4.1. Authentication Routes (`/api/auth`)
* `POST /register` — Register a new account. Checks `Settings.allowSelfRegistration` before allowing.
* `POST /login` — Authenticate and return JWT token + user profile.
* `GET /me` — Hydrate currently logged-in user details.

### 4.2. QR Code Routes (`/api/qrcodes`)
* `GET /` — List QR codes (Users see only their own; Admins see all).
* `POST /` — Generate new dynamic QR code (Checks `Settings.maxQrLimitPerUser` for standard users).
* `GET /:id` — Retrieve detailed statistics of a single QR code.
* `PUT /:id` — Update destination URL/title/expiration.
* `DELETE /:id` — Delete a QR code + its entire scan history.
* `PATCH /:id/toggle` — Toggle QR status (`isActive`).
* `GET /:id/scans` — Fetch scan history logs.
* `GET /:id/export` — Stream scans history as a CSV file (authenticated).

### 4.3. User & Admin Routes (`/api/users`)
* `GET /` — List all system users with their QR counts (Admin only).
* `GET /settings` — Retrieve global system settings (Admin only).
* `PATCH /settings` — Update global system settings (Admin only).
* `GET /:id` — View details of a specific user and their QRs (Admin only).
* `PATCH /:id/role` — Update a user's role (Admin only).
* `DELETE /:id` — Delete a user and clean up all their QR codes and scan logs (Admin only).

### 4.4. Public Resolution Routes (`/q/:shortCode`)
* `GET /q/:shortCode` — Resolves the short code, logs the scan entry, checks if active/expired, and redirects to `destinationUrl`.
* `PATCH /api/public/scan/:scanLogId/location` — Upgrades a scan log with browser-obtained GPS coordinates.

---

## 5. Security & Middleware Design

### 5.1. Authentication Middleware (`protect`)
Verifies the signature of the incoming JWT token in the `Authorization` header and attaches the user document to `req.user`.

### 5.2. RBAC Guard (`adminOnly`)
Enforces admin-level privileges. Placed after `protect` on routes that require absolute privileges (e.g. system configurations, list users, role modifications).
```javascript
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    throw new AppError('Forbidden: Admin access required', 403);
  }
};
```

---

## 6. Key Implementation & UX Principles

1. **Self-Contained Expiration checks:** The redirect route validates expiration dates (`expiresAt`) and deactivation status (`isActive`) at request-time on the server. If expired or inactive, it returns a minimal, developer-grade HTTP 410 error page.
2. **Authenticated Downloads (CSV Export):** Instead of standard unauthenticated hyperlink clicks, the frontend exports scans programmatically using `fetch` with the `Authorization` header, converting the resulting data stream into a secure Blob URL for client-side download.
3. **Reactive Auth Verification:** The React application queries the backend on load to refresh user session states, preventing local storage manipulation or stale context roles from displaying broken blank layouts.
