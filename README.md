# InventoryOS • Home Inventory System

<div align="center">
  <img src="/public/favicon.svg" alt="InventoryOS Logo" width="84" height="84" />
  <h3>InventoryOS</h3>
  <p><b>A modern, full-stack home inventory, storage box, and electronics tracking system.</b></p>
  <p>Organize household belongings, smart home gear, and tools with barcode generation, Brother P-Touch label printing, live camera scanning, room categorization, and real-time cloud synchronization.</p>
</div>

---

## Key Features

### 📦 Storage Box & Container Management
- **Physical Box Tracking**: Organize items into storage bins, totes, or shelves with unique box codes (e.g., `BOX-001`).
- **Location Mapping**: Assign storage boxes directly to specific household rooms and zones.
- **Visual Color Tags**: Tag boxes with custom color highlights for instant physical identification.

### 🏷️ Barcode & Label Generation (Brother P-Touch Compatible)
- **Code 128 & QR Generation**: Automatically generates crisp vector barcodes for every item and storage box.
- **Brother P-Touch Cube (PT-P300BT) Support**: Built-in print presets formatted specifically for Brother P-Touch 12mm (0.47") and 9mm (0.35") continuous thermal label tape.
- **Sheet Label Printing**: Supports standard label paper sheets (Avery 5160, shipping labels, and compact adhesive formats).
- **In-App Camera Barcode Scanner**: Scan barcodes directly using your device camera or webcam with audio-visual scan confirmations.

### 🏠 Rooms & Physical Locations
- **Zone Organization**: Define household areas across floors (e.g., Garage, Living Room, Attic, Workshop).
- **Loose & Boxed Item Tracking**: Track both unboxed loose gear and containerized boxes per room.
- **Location Analytics**: View total room valuation and item distributions.

### ⚡ Electronics & Smart Home Gear Specs
- **Smart Protocol Tracking**: Track IoT protocols including Zigbee, Z-Wave, Thread, Matter, Apple HomeKit, Wi-Fi, and Bluetooth LE.
- **Asset Metadata**: Record brand, model numbers, serial numbers, purchase dates, warranty info, and purchase prices.
- **Item Photo Management**:
  - Direct image URL entry.
  - Image upload with local previews.
  - Built-in **Google Image Search** to find and attach product photos in one click.

### ☁️ Cloud Sync & Offline-First Persistence
- **Dual Persistence**: Works seamlessly offline using local browser storage, and automatically syncs to Firebase Firestore when signed in.
- **Google Authentication & Guest Mode**: Use as a guest with local storage or sign in with Google for real-time multi-device cloud synchronization.
- **In-App Confirmations**: Safe, accessible dialogs for deleting items, unpacking boxes, or clearing accounts.

### 🌓 Full Dark Mode & High-Contrast Design
- Clean, responsive dashboard built with Tailwind CSS.
- One-click toggle for Dark, Light, and System preference themes.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion
- **Barcode & Scanning**: `jsbarcode`, `html5-qrcode`
- **Backend API**: Node.js, Express, `tsx`
- **Cloud Database & Auth**: Firebase Firestore & Firebase Authentication
- **Search Services**: Google Custom Search API / Web image proxy

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/home-inventory-system.git
   cd home-inventory-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional for local guest mode):
   ```bash
   cp .env.example .env
   ```
   Add any optional API keys in your `.env` file (see [Environment Variables](#environment-variables)).

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Web server port | `3000` |
| `GEMINI_API_KEY` | Optional Google Gemini API key for smart assistance | *Optional* |
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search JSON API Key for image search | *Optional* |
| `GOOGLE_SEARCH_ENGINE_ID`| Google Programmable Search Engine CX ID | *Optional* |

*Note: If Google Custom Search keys are omitted, the app includes fallback web image lookups and curated sample photos.*

---

## Project Structure

```
├── index.html                  # HTML entry point with InventoryOS icon
├── package.json                # Project dependencies and build scripts
├── server.ts                   # Express server proxying image search & static Vite build
├── firestore.rules             # Firebase Firestore security rules
├── public/
│   └── favicon.svg             # InventoryOS brand icon
├── src/
│   ├── main.tsx                # React application bootstrap
│   ├── App.tsx                 # Core application controller & views router
│   ├── types.ts                # TypeScript data models (Items, Boxes, Rooms)
│   ├── lib/
│   │   └── firebase.ts         # Firebase Firestore initialization & listeners
│   └── components/
│       ├── InventoryOSLogo.tsx # Brand logo and isometric package squircle icon
│       ├── Header.tsx          # Top navigation bar, search, auth & theme toggles
│       ├── ItemCard.tsx        # Grid card for individual inventory items
│       ├── ItemDetailModal.tsx # Full item details & specs viewer
│       ├── ItemFormModal.tsx   # Add/Edit item form with Google Image search
│       ├── BoxDetailModal.tsx  # Contents and packing list for storage boxes
│       ├── BoxFormModal.tsx    # Add/Edit storage box modal
│       ├── RoomsView.tsx       # Rooms and household locations screen
│       ├── AnalyticsView.tsx   # Valuation, category, and protocol metrics
│       ├── BarcodeScannerModal.tsx # HTML5 camera barcode scanner
│       ├── BarcodePrintModal.tsx   # Barcode sheet & Brother P-Touch label generator
│       └── ConfirmModal.tsx    # Accessible confirmation dialogs
```

---

## Printing Barcode Labels

### Brother P-Touch Cube (PT-P300BT / PT-P710BT)
1. Click **Print Labels** in the header or on any item/box card.
2. Select **Brother P-Touch (12mm Tape)** or **(9mm Tape)** in the format selector.
3. Click **Print Labels**.
4. In your browser print dialog:
   - Destination: Select your Brother P-Touch printer.
   - Paper Size: Set to `12mm` (or `9mm`) continuous tape.
   - Margins: Set to **None**.
   - Scale: Set to **100%**.

---

## Build & Production Deployment

To create an optimized production build:

```bash
npm run build
```

This compiles both the frontend client assets (via Vite) and bundles the backend server into `dist/server.cjs`.

To run the production server:
```bash
npm start
```

---

## License

This project is licensed under the MIT License.
