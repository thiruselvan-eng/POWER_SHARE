# PowerShare Account Credentials & Authentication Guide

Use the following email addresses and passwords to authenticate against the live PostgreSQL database backend. Alternatively, use the **Demo Mode** buttons to bypass backend connectivity entirely.

---

## 🔐 1. Standard Database Accounts (Require Running Backend)

These accounts are seeded automatically into the database on application startup if the tables are empty.

### 👤 Root Platform Admin
* **Role**: `ROLE_ADMIN`
* **Email**: `admin@powershare.com`
* **Password**: `adminpassword`
* **Features**: Access User Verifications, Audits, Analytics.

### ☀️ Seller (Solar Max Energy)
* **Role**: `ROLE_SELLER`
* **Email**: `seller@powershare.com`
* **Password**: `sellerpassword`
* **Features**: List & sell solar-charged batteries, manage stock, withdraw funds.

### 🛒 Buyer (John Resident)
* **Role**: `ROLE_BUYER`
* **Email**: `buyer@powershare.com`
* **Password**: `buyerpassword`
* **Features**: Purchase solar packages, manage credits, deposit funds.

### 🚚 Courier Partner (Green Courier Service)
* **Role**: `ROLE_DELIVERY`
* **Email**: `delivery@powershare.com`
* **Password**: `deliverypassword`
* **Features**: Accept dispatches, deliver packs, track routes, earn payouts.

---

## ⚡ 2. Demo Mode Accounts (Bypasses Backend Connectivity)

Click the corresponding action buttons on the Login page to authenticate immediately using client-side mock configurations (no network calls required).

| Role Button | Mock ID | Name | Email Prefix | Role Code |
| :--- | :--- | :--- | :--- | :--- |
| **🚀 Demo Buyer** | `1` | Demo Buyer | `buyer@powershare.demo` | `ROLE_BUYER` |
| **🚀 Demo Seller** | `2` | Demo Seller | `seller@powershare.demo` | `ROLE_SELLER` |
| **🚀 Demo Delivery** | `3` | Demo Delivery | `delivery@powershare.demo` | `ROLE_DELIVERY` |
| **🚀 Demo Admin** | `4` | Demo Admin | `admin@powershare.demo` | `ROLE_ADMIN` |
