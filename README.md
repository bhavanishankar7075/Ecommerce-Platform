# 🛒 E-Commerce Platform (EasyCartPlus)

A full-stack production-grade e-commerce web application with a customer-facing storefront, a powerful admin dashboard, and a robust REST API backend. Built with the MERN stack.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://frontend-8uy4.onrender.com/)
[![Admin Panel](https://img.shields.io/badge/Admin-Panel-green?style=for-the-badge)](https://admin-frontend-o3u7.onrender.com/login)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-black?style=for-the-badge&logo=github)](https://github.com/bhavanishankar7075/Ecommerce-Platform)

---

## 📌 Project Overview

EasyCartPlus is a complete online retail solution consisting of three main components:

| Component | Description |
|---|---|
| **Ecommerce Frontend** | Customer-facing storefront for browsing, cart, checkout |
| **Admin Frontend** | Admin dashboard for products, orders, users, analytics |
| **Backend API** | RESTful API server handling all business logic and data |

---

## 🚀 Live Links

| Link | URL |
|---|---|
| 🛍️ Customer Store | https://frontend-8uy4.onrender.com/ |
| 🔧 Admin Panel | https://admin-frontend-o3u7.onrender.com/login |

> **Admin Login:** `admin@gmail.com` / `admin123`

---

## 🛠️ Tech Stack

### Frontend (Customer Store)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-7952B3?logo=bootstrap)
![Stripe](https://img.shields.io/badge/Stripe-Payment-635BFF?logo=stripe)

- **Framework:** React.js v19.0.0
- **Routing:** React Router DOM v7.2.0
- **State Management:** React Context API (AuthContext, CartContext, ProductContext)
- **UI:** Bootstrap 5, Font Awesome, Framer Motion (animations)
- **Payments:** Stripe.js
- **HTTP:** Axios
- **Notifications:** React Toastify

### Frontend (Admin Dashboard)
- **Framework:** React.js v19.1.0
- **Charts:** Chart.js via react-chartjs-2
- **CSV Export:** react-csv, papaparse
- **Auth:** JWT Decode
- **Image Processing:** Sharp

### Backend
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)

- **Runtime:** Node.js + Express.js v4.21.2
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + bcrypt (password hashing)
- **File Uploads:** Multer + Cloudinary (image storage)
- **Payments:** Stripe v17.7.0 (Payment Intents + Webhooks)
- **Email:** Nodemailer
- **Security:** CORS, dotenv, Role-Based Access Control (RBAC)

---

## ✨ Features

### 🛍️ Customer Features
- Browse products by category with filters and sorting (price, popularity, rating)
- Product detail pages with image gallery, reviews, and ratings
- Shopping cart with quantity management and coupon codes
- Wishlist to save products for later
- Secure multi-step checkout with **Stripe payment integration**
- User authentication (Register / Login / Logout)
- Order history with detailed order tracking
- User profile management with address book

### 🔧 Admin Features
- **Dashboard** — Real-time stats: total sales, orders, users, stock levels with charts
- **Product Management** — Add, edit, delete products with bulk CSV upload and image upload via Cloudinary
- **Order Management** — View and update order statuses (Pending → Processing → Shipped → Delivered)
- **User Management** — View, edit roles, deactivate accounts
- **Category Management** — Create, update, delete product categories
- **Review Moderation** — Manage and moderate customer reviews
- **Analytics & Reporting** — Sales charts, category distribution, revenue tracking with CSV export

---

## 📁 Project Structure

```
Ecommerce-Platform/
├── admin-frontend/          # Admin React app
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/           # Dashboard, Products, Orders, Users
│       └── styles/
│
├── ecommerce-frontend/      # Customer React app
│   └── src/
│       ├── components/
│       ├── context/         # AuthContext, CartContext, ProductContext
│       ├── pages/           # Home, Products, Cart, Checkout, Profile
│       └── utils/
│
└── ecommerce-backend/       # Node.js + Express API
    ├── config/
    ├── controllers/         # Business logic per resource
    ├── middleware/          # Auth, error handling
    ├── models/              # User, Product, Order, Cart, Wishlist, Review
    ├── routes/              # API route definitions
    └── server.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/products` | Get all products (filter, sort, paginate) |
| POST | `/api/products` | Create product *(Admin)* |
| PUT | `/api/products/:id` | Update product *(Admin)* |
| DELETE | `/api/products/:id` | Delete product *(Admin)* |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/my` | Get user's orders |
| PUT | `/api/orders/:id/status` | Update order status *(Admin)* |
| POST | `/api/payment/create-intent` | Create Stripe Payment Intent |
| GET | `/api/dashboard/summary` | Admin dashboard stats |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js (LTS)
- MongoDB (local or Atlas)
- Stripe account
- Cloudinary account

### 1. Clone the repo
```bash
git clone https://github.com/bhavanishankar7075/Ecommerce-Platform.git
cd Ecommerce-Platform
```

### 2. Backend setup
```bash
cd ecommerce-backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

```bash
npm start
# Server runs on http://localhost:5000
```

### 3. Customer frontend setup
```bash
cd ecommerce-frontend
npm install
npm start
# Runs on http://localhost:3000
```

### 4. Admin frontend setup
```bash
cd admin-frontend
npm install
npm start
# Runs on http://localhost:3001
```

---

## 🗄️ Database Models

| Model | Key Fields |
|---|---|
| **User** | username, email, password (hashed), role (user/admin), address |
| **Product** | name, description, price, category, stock, images (Cloudinary), reviews |
| **Order** | user, products[], totalAmount, status, shippingAddress, paymentDetails |
| **Cart** | user, items[] (product + quantity) |
| **Wishlist** | user, products[] |
| **Review** | user, product, rating (1-5), comment |

---

## 🔐 Authentication Flow

1. User registers/logs in → Backend validates credentials → Issues **JWT token**
2. Token stored client-side → Sent in `Authorization: Bearer <token>` header
3. Backend middleware verifies token on protected routes
4. **Role-Based Access Control (RBAC):** `admin` role required for management APIs

---

## 💳 Payment Flow

1. Customer proceeds to checkout → Backend creates **Stripe Payment Intent**
2. Frontend collects card details securely via `@stripe/stripe-js`
3. Payment confirmed client-side → Backend webhook confirms transaction
4. Order status updated to confirmed on successful payment

---

## 🚀 Deployment

| Component | Platform |
|---|---|
| Backend | Render (Node.js server) |
| Customer Frontend | Render (Static site) |
| Admin Frontend | Render (Static site) |
| Database | MongoDB Atlas |
| Images | Cloudinary |

---

## 🔮 Future Improvements

- Real-time order notifications via WebSockets
- Product recommendation engine
- Advanced search with autocomplete
- Multi-currency and multi-language support
- Docker containerization for easier deployment
- Unit and integration tests (Jest)

---

## 👨‍💻 Author

**Bhavani Shankar Mandala**  
[LinkedIn](https://www.linkedin.com/in/bhavani-shankar-mandala-b728782ba/) • [GitHub](https://github.com/bhavanishankar7075)
