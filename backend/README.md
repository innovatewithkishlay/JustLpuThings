# 🧠 JustLpuThings | Backend Core

The backend is a high-density REST API built with Node.js and TypeScript, designed for secure academic resource management and real-time analytics tracking.

## 🏗 Modular Architecture

The codebase is organized into domain-driven modules:

- **`auth`**: Handles JWT issuance, silent token refresh, and Google OAuth integration.
- **`admin`**: Exclusive endpoints for platform telemetry, content deployment, and user moderation.
- **`materials`**: Manages the academic resource graph (Notes, PYQs, Units).
- **`storage`**: Interface for Cloudflare R2 object storage operations.
- **`analytics`**: Privacy-first visitor tracking and platform health monitoring.
- **`leaderboard`**: Real-time ranking engine based on student engagement metrics.

## 🛠 Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **Caching/Sessions**: Upstash Redis
- **Storage**: Cloudflare R2 (S3 API)
- **Validation**: Zod
- **Logging**: Pino

## 🔐 Security Features

- **Universal Auth Middleware**: Supports both secure cookies and Bearer token fallbacks for privacy-focused browsers (Brave/Safari).
- **Refresh Token Rotation**: Secure session management with family-based token tracking.
- **Rate Limiting**: Custom limiters for Auth, Public, and Admin namespaces.
- **Audit Logging**: Every administrative action is recorded in the `audit_logs` table for accountability.

## 🚀 Deployment

The backend is configured to run on a Linux VPS using **PM2** and **Nginx**.

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name "justlpu-backend"
```

## 📋 API Documentation (Summary)

- `POST /api/v1/auth/login`: Authenticate scholar.
- `GET /api/v1/materials`: List academic resources with advanced filtering.
- `POST /api/v1/admin/materials`: [ADMIN] Deploy new material to R2.
- `GET /api/v1/admin/telemetry`: [ADMIN] Real-time platform stats.
