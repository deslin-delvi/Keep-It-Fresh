# 🥬 Keep-It-Fresh: Grocery Tracker with AI Chatbot

A full-stack web application for managing grocery items, featuring an AI-powered chatbot that suggests recipes and answers grocery-related queries.

---

## 🧩 Features

- 🖥️ Frontend with HTML, CSS, and JavaScript
- ⚙️ Backend using Node.js and Express
- 🗃️ MongoDB for database storage
- 🤖 AI Chatbot for:
  - Suggesting recipes based on available grocery items
  - Answering grocery-related questions
- 🔔 Push notification support with service workers
- 🔐 User authentication (Login/Register)

---

## 🗂 Project Structure
```bash
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
│   └── server.js       # Entry point of your backend server
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
```


---

## 🚀 How to Run the Project

### 📦 Clone the Repository
```bash
git clone https://github.com/deslin-delvi/Keep-It-Fresh.git
cd Keep-It-Fresh
```
### 📁 Setup Environment

Create a new .env file based on this .env
### 🔧 Install Dependencies
```bash
npm install
```
### ▶️ Start the Server
```bash
node backend/server.js
```
### 📌 Notes
Ensure MongoDB is running locally or provide a MongoDB Atlas URI in .env.

Service workers and push notifications are supported in supported browsers.

---

## 📬 Contact

Built by **Deslin Delvi**

For queries, contact me@:

[![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/deslin-delvi)  
[![Email](https://img.shields.io/badge/Email-0078D4?style=for-the-badge&logo=gmail&logoColor=white)](mailto:deslindelvi7@gmail.com)


---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
