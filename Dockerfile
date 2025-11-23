# 1️⃣ Use official Node.js image
FROM node:20

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package.json files first (for caching)
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 4️⃣ Install frontend dependencies and build React
RUN cd frontend && npm install && npm run build

# 5️⃣ Install backend dependencies
RUN cd backend && npm install

# 6️⃣ Copy all source code
COPY backend ./backend
COPY frontend ./frontend

# 7️⃣ Set working directory to backend
WORKDIR /app/backend

# 8️⃣ Expose the port (Railway will override with process.env.PORT)
EXPOSE 5000

# 9️⃣ Start backend
CMD ["node", "app.js"]
