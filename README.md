# 🏠 LazaRental — Smart Rental Guide

> Transparent rentals. Verified landlords. Fair deposits. No more nasty surprises.

LazaRental is a modern rental platform built for tenants and landlords in Africa. It solves the biggest pain points in the rental market — hidden bylaws, unfair deposit deductions, unverified landlords, and zero transparency — by putting all critical information upfront on every listing.

---

## 🌍 Live Demo

🚀 **[lazarental.vercel.app](https://lazarental.vercel.app)**

---

## 📸 Screenshots

| Login | Explore | Listing Detail |
|---|---|---|
| Family photo login with warm UI | Live search + map toggle | Price history, bylaws, deposit rules |

---

## ✨ Features

### For Tenants
- 🔍 **Live search** — filter by bedrooms, price range, neighbourhood
- 🗺️ **Map view** — see all listings on Google Maps with price pins
- 🏠 **Detailed listings** — bylaws, deposit rules, refund terms, amenities, price history chart
- 🔒 **Area security details** — know the safety situation before you move
- 📌 **Plot number** — verify the property officially
- ❤️ **Save listings** — bookmark properties for easy comparison
- 📋 **Apply directly** — submit an application and track its status
- 💬 **Message landlords** — in-app chat with real-time replies
- ⭐ **Community reviews** — read and write honest tenant reviews
- 📅 **Request viewings** — book a viewing slot directly in the app
- 📉 **Price history** — 6-month price trend chart on every listing

### For Landlords
- 📝 **Post listings** — full form with bylaws, deposit terms, refund rules, security details
- 📸 **Photo uploads** — multi-image upload with drag & drop, previews and progress bars
- 👁️ **View tracking** — see how many people viewed your listing
- 📊 **Application management** — approve or reject tenant applications
- 💰 **Deposit tracker** — manage all deposits in one place
- 📈 **Analytics** — views, enquiries, conversion rates

### Platform-wide
- ✅ **Landlord trust score** — verified badge + 0–100 trust rating on every listing
- 🔔 **Real-time notifications** — price drops, new messages, application updates
- 🔐 **Secure auth** — email + Google OAuth via Supabase
- 📱 **Mobile-first** — built for phones, works beautifully on desktop too

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | CSS-in-JS with warm design system |
| Typography | Fraunces (serif) + DM Sans |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Maps | Google Maps JavaScript API |
| Deployment | Vercel |
| Version Control | Git + GitHub |

---

## 🗄️ Database Schema

```
profiles          — user accounts (tenant / landlord roles)
properties        — listings with bylaws, deposit rules, plot numbers
reviews           — tenant reviews per property
applications      — tenant applications with status tracking
messages          — landlord-tenant chat (realtime)
saved_properties  — tenant favourites
notifications     — realtime alerts (price drops, messages, approvals)
viewing_requests  — scheduled viewings
```

All tables have **Row Level Security (RLS)** — tenants can only see their own data, landlords only manage their own listings.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Supabase account (free tier works)
- A Google Cloud account for Maps API (optional)

### Installation

```bash
# Clone the repo
git clone https://github.com/Frankline-Sable/laza-rental.git
cd laza-rental

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_KEY=your-google-maps-key-here
```

### Database Setup

1. Create a new Supabase project at [app.supabase.com](https://app.supabase.com)
2. Run `lazarental_schema_part1_core.sql` in the SQL Editor
3. Create storage bucket `property-images` (public) in the Storage tab
4. Sign up in the app as a Landlord, copy your UUID from Auth → Users
5. Replace `PASTE_YOUR_UUID_HERE` in `lazarental_schema_part2_seed.sql` and run it

### Run locally

```bash
npm run dev
# → http://localhost:5173
```

### Build for production

```bash
npm run build
```

---

## 📁 Project Structure

```
lazarental/
├── src/
│   ├── LazaRental.tsx          ← full app (screens, components, state)
│   └── lazarental_supabase.ts  ← supabase client + all data hooks
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── vercel.json                 ← deployment + SPA routing config
├── .env                        ← your secrets (never commit)
├── .env.example                ← template for contributors
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Auth (email signup/login, role selection)
- [x] Property listings with full transparency data
- [x] Live search + filters (bedrooms, price range)
- [x] Google Maps with price pins
- [x] In-app landlord messaging
- [x] Application tracking
- [x] Photo uploads (Supabase Storage)
- [x] Landlord trust score system
- [x] Community reviews with star ratings
- [x] Price history charts
- [x] Real-time notifications
- [x] Area security details
- [x] Plot number tracking
- [x] View count tracking
- [x] Vercel deployment

### 🔜 Coming Soon
- [ ] Google OAuth login
- [ ] Tenant behavioural data / scoring
- [ ] Lease agreement generation (PDF)
- [ ] Mobile app (React Native)
- [ ] M-Pesa / payment integration for deposits
- [ ] Landlord analytics dashboard
- [ ] Dispute resolution system
- [ ] Neighbourhood safety scores
- [ ] SMS notifications

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Frankline Sable**
- GitHub: [@Frankline-Sable](https://github.com/Frankline-Sable)

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.com) — open source Firebase alternative
- [Unsplash](https://unsplash.com) — beautiful free photography
- [Google Maps Platform](https://developers.google.com/maps) — location services
- [Vercel](https://vercel.com) — seamless deployment

---

<div align="center">
  <strong>LazaRental</strong> · Smart Rental Guide · Made with ❤️ for African renters
</div>