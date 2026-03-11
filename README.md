# ChatMeNow Backend

RESTful API & real-time chat server for the ChatMeNow application.

## Tech Stack

- **Runtime:** Node.js 20 + Express
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.IO
- **Storage:** AWS S3
- **Auth:** JWT + bcryptjs
- **Container:** Docker

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB
- AWS S3 bucket

### Install & Run

```bash
# Install dependencies
npm install

# Development (with hot-reload)
npm run dev

# Production
npm start
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your_bucket
AWS_REGION=ap-southeast-1
```

### Run project

```bash
make build      # Build Docker image
make run        # Run container (production)
make dev        # Run container (development, hot-reload)
make stop       # Stop container
make restart    # Restart container
make logs       # Tail container logs
make status     # Check container status
make clean      # Remove container & image
```

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci-cd.yml`):

1. **CI** — Install, lint, test
2. **Docker** — Build & push image to GHCR
3. **Deploy** — SSH into server and run new container

### Required GitHub Secrets

| Secret            | Description                     |
| ----------------- | ------------------------------- |
| `SSH_HOST`        | Server IP                       |
| `SSH_USER`        | SSH username                    |
| `SSH_PRIVATE_KEY` | Private key content             |
| `SSH_PORT`        | SSH port (default: 22)          |
| `GHCR_TOKEN`      | GitHub PAT with `read:packages` |

## API Routes

| Prefix               | Description              |
| -------------------- | ------------------------ |
| `/api/auth`          | Register, login          |
| `/api/users`         | User profile             |
| `/api/posts`         | Posts & comments         |
| `/api/chat`          | Conversations & messages |
| `/api/notifications` | Notifications            |
| `/api/upload`        | File upload              |
