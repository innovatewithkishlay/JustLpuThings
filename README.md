# 🎓 JustLpuThings | Advanced Academic Intelligence Platform

**JustLpuThings** is a high-performance, premium academic resource ecosystem designed to streamline the distribution and management of educational materials. It features a state-of-the-art administrative engine, real-time platform telemetry, and a secure Cloudflare R2-backed document pipeline.

---

## 🚀 Core Technology Stack

### Backend (The Intelligence Engine)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon Serverless)
- **Storage**: Cloudflare R2 (S3-Compatible Object Storage)
- **Security**: JWT-based Universal Auth (with Silent Refresh & Cross-Browser Fixes)
- **Validation**: Type-safe schema validation via Zod
- **Infrastructure**: Nginx Reverse Proxy on VPS with SSL (Let's Encrypt)

### Frontend (The Experience Layer)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS with Premium Glassmorphic Design
- **Animations**: Framer Motion (High-density micro-interactions)
- **Data Fetching**: TanStack Query (React Query v5)
- **Icons**: Lucide React
- **UI Components**: Radix UI + Custom Premium Design System

---

## ✨ Key Features

### 🛠 Administrative Command Center
- **Real-time Telemetry**: High-density analytics dashboard showing System Hits, Unique Scholars, and Acquisition Events.
- **R2 Encapsulation Pipeline**: Secure document deployment system for uploading PDF binaries directly to Cloudflare R2.
- **Subject Registry**: Dynamic mapping system for semesters, subject nodes, and academic units.
- **Access Control**: Comprehensive user management, session revocation, and audit logging.

### 📚 Scholar Experience
- **Architecture Tree**: Interactive academic graph for navigating semesters and subjects.
- **Material Index**: Fast, indexed access to Notes, PYQs, Mid-term, and CA materials.
- **Leaderboard Intelligence**: Competitive ranking system based on academic engagement and streaks.
- **Universal Search**: Real-time indexed search across the entire academic graph.

---

## 🛠 VPS Deployment & Configuration (Nginx)

The project is optimized for deployment on a Linux VPS behind an Nginx reverse proxy. 

### Critical Nginx Configuration
To handle large PDF uploads (CORS + Payload size), ensure your `/etc/nginx/sites-available/default` is configured:

```nginx
server {
    listen 443 ssl;
    server_name api.justlputhings.com;

    # Crucial for large PDF uploads
    client_max_body_size 100M; 

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Header pass-through for Auth & IP Tracking
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📦 Local Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd JUSTLPUTHINGS
```

### 2. Backend Environment Variables (`/backend/.env`)
```env
PORT=8000
FRONTEND_URL=https://justlputhings.com
DATABASE_URL=your_postgres_url
REDIS_URL=your_redis_url
JWT_ACCESS_SECRET=your_secret
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=your_bucket
```

### 3. Frontend Environment Variables (`/frontend/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=https://api.justlputhings.com/api/v1
```

### 4. Start Development
```bash
# Terminal 1 (Backend)
cd backend && npm install && npm run dev

# Terminal 2 (Frontend)
cd frontend && npm install && npm run dev
```

---

## 🛡 Security & Compliance
- **CORS Policy**: Strictly enforced origin matching with credential support.
- **Rate Limiting**: Tiered protection for Public, Auth, and Admin routes.
- **HSTS**: Mandatory HTTPS with sub-domain inclusion.
- **Privacy**: GDPR-compliant IP hashing for analytics telemetry.

---

Designed with ❤️ for the scholar community.
