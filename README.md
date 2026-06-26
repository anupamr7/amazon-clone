# Amazon Clone - Full-Stack E-Commerce Platform

A responsive, full-stack e-commerce application built using the MERN stack. This project replicates the core features of a modern online marketplace, prioritizing dynamic data flow, secure transactions, and a smooth user experience.

---

## 🚀 Features

* **Dynamic Product Catalog:** Interactive product listings, detailed view pages, and live item filtering/search.
* **Shopping Cart System:** Fully functional add-to-cart, quantity adjustments, and live price total calculations.
* **User Authentication:** Secure signup and login functionality to protect user sessions.
* **Secure Payments:** Integrated with the **Stripe API** for handling real-time end-to-end card transactions.
* **Responsive Design:** Optimized for seamless usage across mobile, tablet, and desktop screens.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, CSS3 / Material-UI
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Payment Gateway:** Stripe API

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally:

### 1. Clone the Repository
```bash
git clone <your-github-repository-url>
cd ecommerce
 ```

### 2. Setup the Backend (Server)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Create a .env file in the server root directory and add your environment variables:
   ```bash
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
### 3. Setup the Frontend (Client)
1. Open a new terminal window and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   
