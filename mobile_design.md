# Mobile App UI/UX Specification: QR Manager

This document maps the Dynamic QR Management System onto a premium native mobile application layout (SwiftUI / React Native / Flutter) following the `mobile-app-ui-design` rules.

---

## 1. User Experience & Flows (UX Lens)

### 1.1. Core Goals
1. **Frictionless Creation:** Generate a redirectable link and dynamic QR code on the go in under 15 seconds.
2. **Instant Moderation:** Toggle a QR code active/disabled instantly from the thumb zone.
3. **Quick Scans Scanner:** Use the device's native camera to scan a QR code, verify its destination, and view its analytics.

### 1.2. Bottom Navigation Structure (Thumb Zone)
The navigation sits in a custom bottom tab bar with tap targets of **48×48px** to maximize reachability:
1. **📊 Dashboard:** Summary numbers and recent activity timeline.
2. **🔗 QR Codes:** Lists active/disabled codes (with quick search).
3. **📷 Scan Scanner (Primary CTA):** Floating center button to scan existing codes instantly.
4. **⚙️ Profile / System Settings:** Profile parameters and global controls (if admin).

```
 ┌───────────────────────────────┐
 │                               │
 │       [ Content Area ]        │
 │                               │
 ├───────────────────────────────┤
 │  [📊]   [🔗]   (📷)   [⚙️]      │  <- Bottom navigation bar (Thumb Zone)
 └───────────────────────────────┘
```

---

## 2. Visual Style & Themes (UI Lens)

We align with the **60/30/10 Color Rule** in a dark cinema mode:
- **60% Neutral Base:** Dark navy background (`#0B1220`) to prevent eye fatigue.
- **30% Secondary Elements:** Solid elevated surfaces (`#131B2E`) and light-grey details (`#EAEEF4`).
- **10% Accent Highlight:** Sharp teal (`#00C9A7`) for CTAs, active badges, and navigation focus indicators.

### Spacing & Grid System
All elements conform strictly to the **8-Point Spacing Grid**:
- Margin borders: `16px` (baseline outer screen bounds).
- Card internal padding: `24px`.
- Element relationships: Related items (e.g. title and shortcode) are spaced `8px` apart; separate blocks are spaced `16px` to `24px` apart.

---

## 3. Screen Compositions

### 3.1. Mobile Dashboard Screen
- **Stat Cards (Top 1/3):** Horizontal scrollable row showing Total QRs, Total Scans, and Active users.
- **Recent Scan Timeline (Bottom 2/3):** Visual timeline list showing:
  - Country name flag badge.
  - Active MapPin indicator (tappable to open maps app).
  - Relative time stamp (e.g. `"2 mins ago"`).

### 3.2. QR Code Detail Screen
- **Focused Card Presentation:** A floating card (`rounded-3xl` with a soft drop shadow) showing the QR code image.
- **Action Toolbar (Thumb Zone):** Fixed toolbar at the bottom containing:
  - **Disable/Enable Button:** Primary toggle with a clear visual state change.
  - **Share/Copy Button:** Programmatic clipboard call with quick success indicators.
  - **Delete Button:** Destructive warning modal.

---

## 4. Emotional Design (Peak-End Rule)

- **The Peak (Successful QR Creation):**
  - Trigger a soft haptic vibration feedback loop (e.g., `ImpactFeedbackGenerator` success pulse).
  - Play a subtle particle explode micro-animation (e.g. tiny teal dots) radiating from the generated code.
- **The Ending (Session Summary):**
  - Profile page displays a personal "Lifetime Impact Card" summarizing total redirects managed and total redirect traffic saved, giving returning users a clear sense of progression.
