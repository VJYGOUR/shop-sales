FROM node:20

WORKDIR /app

# 1️⃣ Copy package.json files for caching
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 2️⃣ Install frontend dependencies and build
COPY frontend ./frontend
RUN cd frontend && npm install && npm run build

# 3️⃣ Install backend dependencies
COPY backend ./backend
RUN cd backend && npm install

# 4️⃣ Set backend as working directory
WORKDIR /app/backend
EXPOSE 5000

# 5️⃣ Start backend
CMD ["node", "app.js"]
