# 🥬 Keep-It-Fresh: Smart Grocery Expiry Tracker

A full-stack web application for managing grocery items with AI-powered features — including an intelligent chatbot for recipe suggestions, OCR-based expiry date scanning, Google OAuth authentication, and real-time push notifications.

---

## ✨ Features

### 🛒 Grocery Management
- Add, edit, and delete grocery items with expiry tracking
- Category-based filtering (Fruits, Vegetables, Dairy, Meat, Grains, Snacks, etc.)
- Expiry status indicators — Fresh, Expiring Soon, Expired
- Live stats bar showing counts per expiry status per category
- Automatic product images fetched via Wikipedia & Open Food Facts APIs
- Skeleton loading cards for a polished loading experience

### 📷 OCR Scanning
- Scan product labels using **Google Cloud Vision API**
- Auto-detects product name and expiry date from images
- Supports multiple date formats (DD/MM/YYYY, MAR 2026, 26-MAR-2026, etc.)
- Drag and drop or camera capture support

### 🤖 AI Chatbot
- Powered by **Google Gemini 2.5 Pro**
- Suggests recipes based on your current grocery list
- Prioritises ingredients expiring soon to reduce food waste
- Filters out expired items automatically
- Markdown-formatted responses rendered cleanly in chat

### 🔐 Authentication
- Email/password registration and login
- **Google OAuth 2.0** — Continue with Google
- JWT-based session management
- Secure password hashing with bcrypt

### 🎨 UI/UX
- Premium nature-themed design (light & dark mode toggle)
- Toast notifications replacing browser alerts
- Custom confirm dialogs for delete actions
- Fully responsive layout for mobile and desktop
- Food name validation middleware prevents invalid entries

### 🔔 Push Notifications
- Daily expiry alerts via Web Push API
- Service worker support for background notifications

---

## 🗂 Project Structure

```
Keep-It-Fresh/
├── .gitignore
├── README.md
├── package.json
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatbotController.js
│   │   ├── groceryController.js
│   │   └── ocrController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validateGrocery.js
│   ├── models/
│   │   ├── Grocery.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatbotRoutes.js
│   │   ├── groceryRoutes.js
│   │   ├── ocrRoutes.js
│   │   └── pushRoutes.js
│   ├── services/
│   │   └── pushNotificationService.js
│   └── server.js
│
└── frontend/
    ├── css/
    │   ├── chatbot.css
    │   ├── login.css
    │   ├── ocr.css
    │   ├── register.css
    │   └── style.css
    ├── js/
    │   ├── auth.js
    │   ├── chatbot.js
    │   ├── grocery.js
    │   ├── ocr.js
    │   ├── push-notifications.js
    │   ├── theme.js
    │   └── toast.js
    ├── pages/
    │   ├── home.html
    │   ├── index.html
    │   ├── login.html
    │   ├── ocr.html
    │   └── register.html
    └── service-worker.js
```

---

## 🚀 How to Run the Project

### 📦 Clone the Repository

```bash
git clone https://github.com/deslin-delvi/Keep-It-Fresh.git
cd Keep-It-Fresh
```

### 📁 Setup Environment

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/keepitfresh

# JWT
JWT_SECRET=your_jwt_secret_here

# Google Gemini (AI Chatbot)
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud Vision (OCR)
GOOGLE_VISION_KEY=your_vision_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret

# Web Push (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 🔧 Install Dependencies

```bash
npm install
```

### ▶️ Start the Server

```bash
node backend/server.js
```

Visit `http://localhost:4000` in your browser.

### 📌 Notes

- Ensure MongoDB is running locally or provide a **MongoDB Atlas** URI in `.env`
- Google Vision API requires billing enabled on Google Cloud (1000 free scans/month)
- Gemini API key can be obtained from [Google AI Studio](https://aistudio.google.com)
- Google OAuth credentials must be configured at [Google Cloud Console](https://console.cloud.google.com)
- Push notifications require a browser that supports the Web Push API

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI Chatbot | Google Gemini 2.5 Pro |
| OCR | Google Cloud Vision API |
| Authentication | JWT, Passport.js, Google OAuth 2.0 |
| Push Notifications | Web Push API, VAPID |
| Image Recognition | Wikipedia API, Open Food Facts API |

---

## 📬 Contact

For queries, reach out via:

[![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/deslin-delvi) [![Email](https://img.shields.io/badge/Email-red?style=for-the-badge&logo=gmail&logoColor=black)](mailto:deslindelvi7@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
