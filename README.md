# Full-Stack Delivery Preference Application

A production-ready full-stack application for managing delivery preferences with JWT authentication, conditional form validation, and AI-enhanced order summaries using Google Gemini.

## 🚀 Quick Start

**One-command setup with Docker:**

```bash
git clone <your-repo-url>
cd fullstack-delivery-app
docker-compose up --build
```

**Access:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

**Demo Credentials:**

- Email: `test@example.com`
- Password: `password123`

**Note:** The Docker setup includes all necessary configuration. No additional setup required!

## 📋 Instructions

### Running with Docker (Recommended)

1. **Prerequisites:** Docker and Docker Compose installed
2. **Clone repository:** `git clone <repo-url> && cd fullstack-delivery-app`
3. **Start services:** `docker-compose up --build`
4. **Access application:** Navigate to http://localhost:3000
5. **Stop services:** `docker-compose down` (or Ctrl+C)

### Running Locally (Without Docker)

**Prerequisites:**

- Node.js 18+
- PostgreSQL 16+

**Backend Setup:**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials and Gemini API key
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

**Frontend Setup:**

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if backend is not on default port
npm run dev
```

**Database Setup:**

- Ensure PostgreSQL is running
- Create database: `createdb delivery_db`
- Run migrations: `npx prisma migrate dev`
- Seed test user: `npm run prisma:seed`

## ✨ Features Implemented

**Core Requirements:**

- ✅ JWT-based authentication with secure password hashing
- ✅ Protected routes with auth guards
- ✅ Three delivery types: In-Store Pickup, Home Delivery, Curbside Pickup
- ✅ Dynamic conditional form fields based on delivery type
- ✅ Comprehensive inline validation (email, password, dates, required fields)
- ✅ Future datetime validation (blocks past dates)
- ✅ Order management (create, view, update)
- ✅ State persistence using localStorage
- ✅ Professional UI with Lucide React icons
- ✅ Complete error handling (backend + frontend)

**Bonus Feature:**

- ⭐ AI-Enhanced Order Summaries using Google Gemini
  - Generates personalized, friendly order confirmations
  - Provides delivery-type-specific tips and guidance
  - Professional natural language summaries

## 🛠️ Technology Stack

**Frontend:**

- React 18 + Vite
- React Router v6 (routing + navigation)
- Context API (authentication state management)
- Lucide React (professional icon library)
- Native Fetch API (HTTP client)

**Backend:**

- Node.js 22 + Express
- Prisma ORM (type-safe database access + migrations)
- PostgreSQL 16
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Google Generative AI (Gemini Pro)

## 🔧 API Endpoints

**Authentication:**

- `POST /api/auth/login` - User login (returns JWT token + user data)
- `GET /api/me` - Get authenticated user profile

**Orders (Delivery Preferences):**

- `POST /api/orders` - Create new delivery preference
- `GET /api/orders/:id` - Retrieve specific order
- `PUT /api/orders/:id` - Update existing order

**AI Summaries:**

- `POST /api/ai/summary/:id` - Generate AI-enhanced order summary

All order and AI endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## 🎨 Design Choices

### Architecture Decisions

**Why Node.js instead of Go?**

- **Expertise:** Leveraged existing MERN stack experience for rapid development
- **Ecosystem:** Rich library support (Prisma, Express middleware, AI SDKs)
- **Development Speed:** Critical for 3-4 hour timeframe
- **Production-Ready:** Node.js powers major production systems (Netflix, PayPal)
- **Trade-off:** Slightly slower than Go but significantly faster development

**Why Prisma ORM?**

- **Type Safety:** Auto-generated types prevent runtime errors
- **Migrations:** Declarative schema with automatic migration generation
- **Developer Experience:** Prisma Studio for visual database inspection
- **Modern Approach:** Cleaner than raw SQL, more maintainable than traditional ORMs

**Why Monorepo Structure?**

- **Simplicity:** Single repository simplifies deployment and version control
- **Docker-Friendly:** One docker-compose.yml for entire stack
- **Code Sharing:** Potential to share types/utilities (future enhancement)
- **Challenge Compliance:** "Must run entirely using Docker Compose"

**Service Layer Pattern:**

- **Separation of Concerns:** Controllers handle HTTP, services handle business logic
- **Testability:** Services can be unit tested independently
- **Reusability:** Service methods can be called from multiple controllers
- **Clean Architecture:** Follows industry best practices

**Context API for State Management:**

- **Lightweight:** No external dependencies (Redux, Zustand)
- **Sufficient:** Authentication state is simple
- **React Native:** Built-in solution, easy to understand
- **Performance:** Adequate for this application's scale

**AI Integration Strategy:**

- **Backend-Proxied:** API key never exposed to frontend
- **User Experience:** Enhances summaries without disrupting core functionality
- **Backend-Controlled:** Easy to disable, monitor, or swap AI providers

## 🏗️ Application Flow

**User Journey:**

1. **Login Page (`/login`)**

   - User enters email and password
   - Frontend validates input format
   - Backend verifies credentials and returns JWT
   - Token stored in localStorage
   - Redirect to delivery preference page

2. **Delivery Preference Page (`/delivery-preference`)**

   - Three delivery type options (radio buttons)
   - Date/time picker (enforces future dates only)
   - Conditional fields:
     - **IN_STORE:** No additional fields
     - **DELIVERY:** Address field (required)
     - **CURBSIDE:** Vehicle/pickup details (required)
   - Real-time validation
   - On submit: Create order, save ID, redirect to summary

3. **Summary Page (`/summary`)**
   - Loads order by ID from localStorage
   - Sends to Gemini AI for enhanced summary generation
   - Displays friendly, personalized confirmation
   - Shows all order details (type, date, conditional fields)
   - Edit button: Navigates back to form with pre-filled data
   - Sign Out button: Clears token, redirects to login

## 🧪 Tests

### Backend Tests (Node Test Runner)

**Coverage:**

- ✅ **Login:** Valid credentials, invalid credentials, missing fields
- ✅ **Auth Guard:** JWT validation, missing token, invalid token, expired token
- ✅ **Order Validation:**
  - Delivery type validation (valid types, invalid types)
  - Date validation (future dates allowed, past dates blocked)
  - Conditional field validation (DELIVERY needs address, CURBSIDE needs details)
  - Field sanitization (removes unnecessary fields per type)

**Run tests:**

```bash
cd backend
npm test
```

**Test files:**

- `tests/auth.test.js` - Authentication endpoints
- `tests/order.test.js` - Order CRUD and validation
- `tests/ai.test.js` - AI summary endpoint (mocked)

### Frontend Tests

**Note:** Frontend tests were not implemented in this submission due to limited prior experience with frontend testing frameworks. This is identified as a future improvement (see below).

## 🔮 Future Improvements

**High Priority:**

- [ ] **Frontend Tests:** Implement comprehensive Vitest/React Testing Library tests
  - Login navigation and validation
  - Protected route guards
  - Conditional field rendering
  - Past date blocking
  - Summary data consistency
  - _Note: Not included in current submission due to limited frontend testing experience and time constraints. This would be the first enhancement to add._

**Feature Enhancements:**

- [ ] Order History: List all past orders with filtering
- [ ] Email Notifications: Confirmation emails on order creation
- [ ] Admin Dashboard: Manage all orders, user management
- [ ] Order Status Tracking: Pending → Confirmed → Completed workflow
- [ ] Multi-language Support: i18n for Portuguese, Spanish, etc.

**AI Enhancements:**

- [ ] Smart Time Suggestions: AI recommends optimal delivery times
- [ ] Address Autocomplete: AI-powered address validation
- [ ] Natural Language Order Creation: "Deliver to my home next Tuesday"
- [ ] Delivery Preference Learning: AI learns user patterns

**Technical Improvements:**

- [ ] Rate Limiting: Protect API endpoints from abuse
- [ ] Request Logging: Structured logs for debugging
- [ ] Performance Monitoring: APM integration (Datadog, New Relic)
- [ ] CI/CD Pipeline: Automated testing and deployment
- [ ] End-to-End Tests: Playwright or Cypress

## 🐛 Troubleshooting

**"Port already in use"**

- Symptom: Docker fails to start, port conflict error
- Solution: Change ports in `docker-compose.yml` or stop conflicting services

**"Prisma Client not initialized"**

- Symptom: Backend crashes with Prisma initialization error
- Solution: Regenerate Prisma Client
- Command: `docker exec -it delivery-backend npx prisma generate`
- Restart: `docker-compose restart backend`

**"AI summaries not working"**

- Symptom: Summary page shows plain data instead of AI-generated text
- Solution: Check Gemini API key is set correctly

## 📄 License

MIT

## 👤 Author

[Abdullah Malik]
