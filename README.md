# Grocery Tracker App 🛒

This is a full-stack Grocery List Management Application with AI recipe suggestions and grocery-related queries.

## 🧩 Features
- Frontend with HTML, CSS, and JavaScript
- Backend using Node.js
- MongoDB for data storage
- AI chatbot for:
  - Suggesting recipes based on available grocery items
  - Handling grocery-related queries

## 🗂 Project Structure

Keep-It-Fresh/
├── .env
├── .gitignore
├── README.md
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
│   │   └── auth.js
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
│   |
│   └── server.js           # Entry point of your backend server
│
├── frontend/
│   ├── css/
│   │   ├── chatbot.css
│   │   ├── login.css
│   │   ├── ocr.css
│   │   ├── register.css
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── chatbot.js
│   │   ├── grocery.js
│   │   ├── ocr.js
│   │   └── push-notifications.js
│   ├── pages/
│   │   ├── home.html
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── ocr.html
│   │   └── register.html
│   └── service-worker.js   # For offline support / push notifications


## 🚀 How to Run

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install

