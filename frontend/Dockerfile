# ============================================================
# React Frontend Dockerfile (Development)
# ============================================================

FROM node:20-alpine

WORKDIR /app

# Dependencies install
COPY package*.json ./
RUN npm install

# App code copy karo
COPY . .

# Port expose karo
EXPOSE 5173

# Dev server start karo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
