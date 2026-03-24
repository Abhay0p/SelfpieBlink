# Smart Grocery System (SelfpieBlink)

## Overview
SelfpieBlink is a production-ready, full-stack Smart Grocery Billing System designed to eliminate physical checkout queues. It provides a "Blinkit-style" seamless shopping experience for customers and a powerful "Queue-Buster" dashboard for merchants. The system streamlines grocery shopping by bridging the gap between physical stores and digital convenience, allowing users to scan items, process AI-based handwritten lists, and checkout from their own devices.

## Key Features
- **Customer Shopping Interface**: A modern, responsive "Blinkit-style" interface tailored for an intuitive mobile and desktop shopping experience.
- **Merchant Queue-Buster Dashboard**: A real-time control center for merchants to manage inventory, monitor active streams, and oversee transactions.
- **AI-Powered List Matching**: Customers can upload images of handwritten grocery lists. The system leverages Google GenAI to parse the text and automatically match items against the real-time store inventory.
- **Smart Barcode Scanning**: Built-in, browser-based hardware scanner integration to add products quickly and efficiently without manual entry.
- **Real-Time Order & Inventory Sync**: Powered by WebSockets to ensure that instantaneous inventory updates and active cart changes are synced seamlessly between merchant and customers.
- **Hardware-Level Exit Verification**: Secure, QR-code based exit verification at the store boundaries to validate customer purchases before leaving.
- **Manual Product Search**: Advanced text search functionality allowing customers to manually find and add products if they don't wish to use scanning.

## Tech Stack

### Frontend
- **Core**: React 19 (via Vite)
- **Styling**: Tailwind CSS & PostCSS
- **State Management**: Zustand
- **Routing**: React Router DOM V7
- **Real-Time Communication**: Socket.io-client
- **Hardware Integration**: html5-qrcode (for Barcode & QR code parsing)
- **Data Visualization**: Recharts
- **Icons**: Lucide-React

### Backend
- **Core**: Node.js & Express.js
- **Database**: MongoDB (via Mongoose)
- **Real-Time Engine**: Socket.io
- **AI Integration**: Google GenAI SDK (Gemini)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **File Uploads**: Multer
- **Environment Management**: dotenv

## Project Structure
```text
Project root/
├── backend/          # Express backend application
│   ├── package.json  # Backend dependencies
│   ├── server.js     # Core Application Entry Point
│   └── seed.js       # Database seeder utility
└── frontend/         # React SPA (Vite)
    ├── package.json  # Frontend dependencies
    └── vite.config.js# Vite Configuration
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) instance running locally or via MongoDB Atlas
- Google Gemini API Key (for the AI handwritten list feature)

### Installation

1. **Clone the repository** (or navigate to the project directory)
   ```bash
   cd ProjectSelfpie
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory and add your environment variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
   Start the backend development server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   Open a new terminal session:
   ```bash
   cd frontend
   npm install
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

## Application Deep Dive
- **Real-Time Synchronization Mechanism**: As merchants update stock or add completely new items to their inventory list, `Socket.io` instances instantly broadcast the updates to all connected customers. 
- **Scan & Go Architecture**: The platform integrates an intelligent debouncing and deduplication mechanism in the frontend (`SpAbhay_BarcodeScanner` component) to prevent accidental double-scans of the same item.
- **Systematic Security**: Upon payment completion, the backend generates a cryptographically signed exit QR code. Local store validators inspect this QR code to confirm that every outbound item has a corresponding valid receipt.

## License
ISC
