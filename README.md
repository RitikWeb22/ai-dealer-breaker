# DealBreaker AI

DealBreaker AI is an AI-powered shopping negotiation platform where users can browse products, start a live voice negotiation, and compete for the best deal on the leaderboard.

## What It Does

- Lets users register, log in, and keep sessions with secure cookie-based JWT auth.
- Loads a product catalog and lets users select items before starting a negotiation.
- Starts a Vapi-powered voice call with dynamic session context.
- Saves negotiation outcomes, calculates efficiency scores, and ranks top results on a leaderboard.
- Ships with a modern React UI and an Express API with MongoDB persistence.

## Tech Stack

| Layer    | Tools                                                                           |
| -------- | ------------------------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, Framer Motion, Vapi Web SDK      |
| Backend  | Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs, Helmet, CORS, compression |

## Project Structure

```text
dealbreaker-ai/
├── backend/   # Express API, MongoDB models, auth, negotiation, and Vapi webhooks
└── frontend/  # React application, routing, UI, and Vapi client integration
```

## Features

- Public landing page with entry points to login, register, products, and leaderboard.
- Protected product and leaderboard routes.
- Product selection flow that prepares the AI negotiation payload.
- Voice negotiation session setup through Vapi.
- Webhook handling for deal confirmation and leaderboard persistence.
- Health check endpoint for deployment monitoring.

## Requirements

- Node.js 18 or newer
- MongoDB connection string
- Vapi account and credentials
- A frontend environment configured to reach the deployed or local backend

## Environment Variables

### Backend

Create a `backend/.env` file:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

### Frontend

Create a `frontend/.env` file:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-vapi-assistant-id
```

## Local Development

Install dependencies in both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend:

```bash
cd frontend
npm run dev
```

## Available Scripts

### Backend

- `npm start` starts the API in production mode.
- `npm run dev` starts the API with Nodemon.

### Frontend

- `npm run dev` starts the Vite development server.
- `npm run build` creates a production build.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.

## API Overview

Base URL examples assume the backend is running on `http://localhost:3000`.

| Method | Endpoint                         | Purpose                                     |
| ------ | -------------------------------- | ------------------------------------------- |
| GET    | `/api/health`                    | Health check                                |
| POST   | `/api/auth/register`             | Create a user account                       |
| POST   | `/api/auth/login`                | Log in and set auth cookie                  |
| GET    | `/api/auth/profile`              | Fetch the authenticated user profile        |
| POST   | `/api/product/add-product`       | Add a product                               |
| GET    | `/api/product/all`               | Fetch all products                          |
| POST   | `/api/negotiation/negotiations`  | Save negotiation events and webhook results |
| POST   | `/api/negotiation/start-session` | Build the Vapi negotiation session payload  |
| POST   | `/api/vapi/session-config`       | Return assistant session variables          |
| POST   | `/api/vapi/webhook`              | Receive Vapi webhook events                 |
| GET    | `/api/vapi/leaderboard`          | Fetch the top negotiation results           |

## Deployment Notes

- Update `CORS_ORIGINS` with every frontend origin you deploy.
- Point `VITE_BACKEND_URL` at the deployed backend API.
- Configure the Vapi webhook URL to `/api/vapi/webhook` on the backend domain.
- The backend serves static files from `backend/public/` for production-style deployments.

## License

No license has been specified yet.
