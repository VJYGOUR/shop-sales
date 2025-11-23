# 1️⃣ Base image
FROM node:20

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package.json files for caching
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 4️⃣ Copy frontend source before building
COPY frontend ./frontend

# 5️⃣ Set environment variable for frontend build
# Replace with your Railway public URL
ENV VITE_API_URL=/api

# 6️⃣ Build frontend
RUN cd frontend && npm install && npm run build

# 7️⃣ Copy backend source
COPY backend ./backend

# 8️⃣ Install backend dependencies
RUN cd backend && npm install

# 9️⃣ Set backend as working directory
WORKDIR /app/backend

# 🔹 Expose port
EXPOSE 5000

# 🔹 Start backend
CMD ["node", "app.js"]
