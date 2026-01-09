# DFX Platform Backend

A unified backend API for DFX Limited, powering three business verticals:

- **IT Training Academy** - Course enrollment, payments, and PDF material delivery
- **Gadget Shop** - E-commerce with Paystack payments and guest checkout
- **Web Agency** - Portfolio showcase and contact form management

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Access + Refresh tokens)
- **Payments:** Paystack
- **File Storage:** Cloudinary
- **Email:** Nodemailer (Gmail SMTP)

## Features

### Authentication & Security
- JWT-based authentication with access tokens (15min) and refresh tokens (7 days)
- Password reset via 6-digit OTP (email)
- Role-based access control (USER / ADMIN)
- Rate limiting on auth and contact endpoints
- NoSQL injection protection (express-mongo-sanitize)
- XSS protection (custom sanitization middleware)
- Password hashing with bcrypt (12 rounds)

### IT Training Module
- Course CRUD with soft delete
- Course registration with Paystack payment integration
- PDF course materials stored on Cloudinary
- Signed URLs for secure material downloads (10-min TTL)
- Enrollment verification middleware
- Email notifications for registrations and new materials

### Gadget Shop Module
- Product CRUD with soft delete
- Guest checkout support
- Order management with status tracking
- Paystack payment integration with webhook handling
- Stock management (auto-decrement on payment)
- Order confirmation and dispatch emails

### Web Agency Module
- Portfolio project management with publish/unpublish
- Contact form with rate limiting (5/hour)
- Admin contact message management
- Email notifications for new inquiries

### Admin Dashboard
- Analytics and statistics
- Revenue tracking
- Activity logging for all actions
- User management
- Reconciliation endpoints (manual payment marking)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Paystack account
- Cloudinary account
- Gmail account (for SMTP)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dfx

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# CORS
CORS_ORIGIN=http://localhost:5173

# Admin Seeding
ADMIN_EMAIL=admin@dfx.com
ADMIN_PASSWORD=securepassword123

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=DFX Limited
EMAIL_FROM_ADDRESS=noreply@dfx.com
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete API reference.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Environment, database, Cloudinary config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, rate limiting, sanitization
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Route definitions
│   │   └── admin/       # Admin-only routes
│   ├── services/        # Business logic
│   ├── utils/           # Helpers (ApiError, catchAsync)
│   ├── validators/      # Joi validation schemas
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── .env.example
└── package.json
```

## Key Design Decisions

1. **Prices in Kobo** - All monetary values stored as integers (NGN × 100)
2. **Soft Deletes** - Products, courses, and materials use soft delete
3. **Guest Checkout** - Orders can be placed without authentication
4. **Course Access** - Materials require authentication + enrollment verification
5. **Activity Logging** - All significant actions logged for audit trail
6. **Reconciliation** - Admin can manually mark payments for offline transactions

## License

Proprietary - DFX Limited
