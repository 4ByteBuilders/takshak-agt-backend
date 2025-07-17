# 🎟️ Takshak AGT Backend

This is the backend REST API built for **Takshak AGT**, an event management platform. It handles user authentication, event bookings, payments, ticket generation, and secure role-based access for on-site ticket verification.

## 🚀 Features

- 🔐 **OAuth 2.0 Authentication**  
  Login and registration via Supabase with Google OAuth integration.

- 📅 **Event Booking System**  
  Users can view and book events through a simple and secure API.

- 💳 **Payments with Cashfree**  
  Seamless payment integration using Cashfree APIs.

- 📄 **QR Code Ticketing**  
  After booking, users receive QR-based tickets that can be downloaded as PDFs.

- ✅ **Ticket Verification System**  
  Role-based access allows authorized personnel to scan and verify tickets at event venues.

---

## 🛠 Tech Stack

- **Node.js** + **Express.js**
- **Supabase Auth** (Google OAuth 2.0)
- **PostgreSQL with Prisma ORM** for DBMS
- **Cashfree** for payment integration
