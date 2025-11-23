FROM node:20

WORKDIR /app

# 1️⃣ Copy package.json files first for caching
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 2️⃣ Copy all frontend source files (needed for tsc -b)
COPY frontend ./frontend

# 3️⃣ Build frontend
RUN cd frontend && npm install && npm run build

# 4️⃣ Copy backend source files
COPY backend ./backend

# 5️⃣ Install backend dependencies
RUN cd backend && npm install

WORKDIR /app/backend
EXPOSE 5000

CMD ["node", "app.js"]
