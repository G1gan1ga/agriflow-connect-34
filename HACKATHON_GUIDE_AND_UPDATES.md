# 🌾 AgriFlow Connect (Krishi Setu) — Hackathon Presentation & Update Guide

> **Prepared for:** First-Year Hackathon Team  
> **Project:** Krishi Setu (AgriFlow Connect)  
> **Authority:** Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution (Government of India)

---

## 📌 Table of Contents
1. [Overview of the Updates](#1-overview-of-the-updates)
2. [Aadhaar Authentication & Verhoeff Algorithm](#2-aadhaar-authentication--verhoeff-algorithm)
3. [The Improved Smart Token System](#3-the-improved-smart-token-system)
4. [Kisan SMS & Feature-Phone Booking Gateway](#4-kisan-sms--feature-phone-booking-gateway)
5. [Codebase Architecture & File Guide](#5-codebase-architecture--file-guide)
6. [2-Minute Winning Pitch Script for Judges](#6-2-minute-winning-pitch-script-for-judges)
7. [Tough Questions Judges Will Ask & How to Answer](#7-tough-questions-judges-will-ask--how-to-answer)
8. [How to Run, Test, and Push This Code](#8-how-to-run-test-and-push-this-code)

---

## 1. Overview of the Updates

We have implemented three major capabilities requested for hackathon presentation readiness:

| Feature | What Was Built | Why It Matters for Judges |
| :--- | :--- | :--- |
| **Aadhaar e-KYC Verification** | Integrated mathematical **Verhoeff Checksum Algorithm** + simulated **UIDAI OTP Verification** modal. | Prevents fake registrations and demonstrates real-world compliance with UIDAI security guidelines. |
| **Smart Multi-Tenant Token System** | Formatted center tokens (e.g. `KRN-101`, `LDH-102`), digital gate passes with QR codes, multi-farmer session switching, and universal token tracking. | Multiple farmers can now register independently, get their own separate tokens, and track their queues individually. |
| **Kisan SMS Feature-Phone Gateway** | Visual **Nokia/JioKeypad phone simulator** supporting inbound SMS (`BOOK KRN WHEAT 30Q`) and automatic reply SMS with token confirmation. | Directly addresses rural digital divide for farmers who only have 2G/button phones without internet. |

---

## 2. Aadhaar Authentication & Verhoeff Algorithm

### How Real Aadhaar Numbers Work (The Math)
A 12-digit Aadhaar number is **not random digits**:
1. **Leading Digit Rule:** According to UIDAI specifications, an Aadhaar number **never starts with 0 or 1**. It always begins with digits 2 through 9.
2. **The Verhoeff Checksum:** The 12th digit is an error-detecting check digit calculated using the **Verhoeff algorithm**, which is based on dihedral group $D_5$ group mathematics.
   - It catches **100% of single-digit typing errors** (e.g. typing `5` instead of `6`).
   - It catches **100% of adjacent digit swap errors** (e.g. typing `47` instead of `74`).

### In Our Code (`src/lib/aadhaar.ts`)
- **`validateVerhoeff(str)`**: Runs the $D_5$ multiplication, permutation, and inversion matrix tables over the digits. If someone types a random 12-digit number, the system instantly flags:
  > *"Checksum failed: Not a genuine Aadhaar number (Verhoeff check failed)"*
- **`formatAadhaar(str)`**: Automatically adds hyphens as the farmer types (`XXXX-XXXX-XXXX`).
- **`generateDemoAadhaar()`**: Generates mathematically genuine sample Aadhaar numbers for quick live demos.
- **e-KYC OTP Simulation:**
  - Clicking **"Verify Aadhaar (e-KYC)"** dispatches a simulated 6-digit OTP via the notification drawer.
  - Entering the OTP marks the farmer profile with an official green badge: **"✓ UIDAI e-KYC Verified"**.

### Production Architecture (What to tell the judges)
> *"In a production deployment, our backend integrates with an authorized Authentication User Agency (AUA) or KYC User Agency (KUA) via UIDAI's REST APIs. It generates an XML payload signed with a digital certificate, triggers a one-time password via SMS to the mobile number registered on the Aadhaar Central Identities Data Repository (CIDR), and returns demographic authorization tokens."*

---

## 3. The Improved Smart Token System

### Structured Token Logic
Tokens are structured with **Center Prefix + Sequence Number**:
- `KRN-101`: Karnal Mandi Samiti
- `LDH-102`: Ludhiana APMC Yard
- `BPL-103`: Bhopal FCI Depot

### Multi-Farmer Support & Token Isolation
Previously, browser storage only remembered one farmer at a time. We solved this with three features:
1. **+ New Farmer Button:** Resets the form so team members can register a brand new farmer on the spot without wiping other farmers' data.
2. **Quick Demo Switcher:** Top bar chips let you toggle between real seed farmers (`Ramesh`, `Sukhwinder`, `Mahesh`) to show judges that each person has their own token, weighbridge data, and payment status.
3. **Track Any Token Search Bar:** Type `KRN-101` or `T-102` or an Aadhaar number from any screen to instantly load and track that specific farmer's live queue status and payment progress.
4. **Digital Gate Pass & QR Code:** Generates a high-contrast digital pass with farmer details, crop quantity, and a scannable gate code that procurement officers can verify.

---

## 4. Kisan SMS & Feature-Phone Booking Gateway

### The Problem
Over 35% of smallholder farmers in rural India do not own smartphones or have steady 4G/5G data connections.

### The Solution: SMS & USSD Integration (`src/routes/farmer.tsx` Tab `📱 SMS Booking`)
We built a simulated **Feature Phone (Keypad Handset)** interface:
1. The farmer sends an SMS to shortcode **`56161`** or calls toll-free **`1800-KRISHI`**:
   ```
   BOOK KRN WHEAT 30Q
   ```
2. The backend parser:
   - Identifies the mobile number.
   - Finds the nearest center (`KRN = Karnal`).
   - Automatically books the earliest available 1-hour slot with remaining capacity.
   - Generates the next token.
3. The automated SMS gateway sends an instant reply:
   ```
   Krishi Setu: Aapka token KRN-109 book ho gaya hai.
   Mandi: Mandi Samiti, Karnal | Samay: 10:00-11:00 aaj.
   Kripya samay par tractor pahuchein.
   ```
4. The booking is instantly visible in the Officer's dashboard and the live queue via real-time WebSockets!

---

## 5. Codebase Architecture & File Guide

```
src/
├── lib/
│   ├── aadhaar.ts         <-- Verhoeff algorithm & e-KYC OTP simulation
│   ├── store.tsx          <-- State engine, Supabase real-time, multi-farmer switching, SMS booking
│   ├── i18n.ts            <-- Multilingual dictionary (English, Hindi, Punjabi)
│   └── utils.ts           <-- Styling helpers (clsx, twMerge)
├── routes/
│   ├── __root.tsx         <-- App shell, meta tags, notification providers
│   ├── index.tsx          <-- Landing page with live mandi summary cards
│   ├── farmer.tsx         <-- Farmer Portal: Profile, Booking, Queue, Payments, SMS Gateway
│   └── officer.tsx        <-- Officer Portal: Verify & Scan, Weighbridge, Gate Queue, Analytics
└── components/
    └── AppShell.tsx       <-- Header navigation, Ministry emblem, language dropdown
```

---

## 6. 2-Minute Winning Pitch Script for Judges

*(Divide parts among your team members!)*

> **Speaker 1 (The Hook):**  
> *"Good morning, respected judges. During harvest seasons across India, thousands of farmers wait up to 48 hours in tractor queues outside APMC mandis just to weigh and sell their crop. This causes road blockages, harvest spoilage, and payment delays. We present **Krishi Setu**, a real-time procurement scheduling and live queue platform built for the Department of Consumer Affairs."*
>
> **Speaker 2 (Aadhaar & Booking):**  
> *"Our platform ensures authentic farmer registration using **Aadhaar verification**. We built client-side validation using UIDAI's mathematical **Verhoeff Checksum Algorithm** combined with a simulated **e-KYC OTP flow** to stop fraudulent bookings. Once verified, farmers book dedicated 1-hour time slots with strict capacity limits to avoid congestion."*
>
> **Speaker 3 (Inclusivity & SMS Gateway):**  
> *"We know millions of farmers use basic button phones without internet. So we built the **Kisan SMS Gateway**: a farmer simply texts `BOOK KRN WHEAT 30Q` to `56161`. Our system automatically allocates the earliest slot, generates a smart token, and texts back the confirmation."*
>
> **Speaker 4 (Real-Time Officer Flow & Payments):**  
> *"At the mandi, officers verify tokens with one click, record weighbridge weights in quintals, and advance the farmer through a transparent 6-stage pipeline. Payouts are computed automatically based on the government Minimum Support Price (MSP of ₹2,275/quintal) for Direct Benefit Transfer (DBT). Powered by React 19 and Supabase real-time WebSockets, all updates reflect live across devices without refreshing."*

---

## 7. Tough Questions Judges Will Ask & How to Answer

### Q1: "How do you verify if an Aadhaar number is real without official government access?"
**Answer:**  
*"In this prototype, we implemented the actual mathematical **Verhoeff Checksum Algorithm** that UIDAI uses for 12-digit numbers. It verifies whether the check digit matches the dihedral group permutations of the previous 11 digits and enforces the rule that valid Aadhaar numbers never begin with 0 or 1. For a production launch, we integrate with UIDAI's AUA/KUA e-KYC APIs."*

### Q2: "What if multiple farmers want to track their tokens separately?"
**Answer:**  
*"Our system has a dedicated **Universal Token Tracker** and multi-tenant session manager. Any farmer can enter their Token ID (e.g. `KRN-101`) or Aadhaar number to view their individual queue position, estimated wait time, weighbridge certificate, and payment status independently."*

### Q3: "What if the internet drops at the procurement center?"
**Answer:**  
*"We use optimistic local state updates with TanStack Router and cached local storage. The gate pass can also be downloaded or printed with an offline QR code containing signed token metadata so officers can verify it offline."*

---

## 8. How to Run, Test, and Push This Code

### Run Locally
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

### Quick Test Steps for Your Presentation:
1. Open the **Farmer Portal** (`/farmer`).
2. Click **"🎲 Auto-fill Valid Demo Aadhaar"** $\rightarrow$ Observe the green **"✓ Verhoeff Checksum Valid"** indicator.
3. Click **"Verify Aadhaar (e-KYC)"** $\rightarrow$ Click **"Auto-fill"** $\rightarrow$ Click **"Confirm & Verify"** $\rightarrow$ See the green **UIDAI Verified** badge appear.
4. Click **"Save Profile"** $\rightarrow$ Go to **"Book Slot"** $\rightarrow$ Pick a time slot $\rightarrow$ Click **"Confirm Booking"**.
5. Switch to the **"📱 SMS / Phone Booking"** tab $\rightarrow$ Click **"Simulate Send SMS"** to demonstrate keypad phone booking.
6. Open the **Officer Dashboard** (`/officer`) $\rightarrow$ Click on the waiting token $\rightarrow$ Click **"Verify Token & Open Gate"** $\rightarrow$ Go to **Weighbridge** $\rightarrow$ Enter net quintals and click **"Advance"**.
7. Return to the Farmer screen $\rightarrow$ Watch the **Payments Pipeline** update in real time!

---
*Created with ❤️ for your First Hackathon — Good luck!*
