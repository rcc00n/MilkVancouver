# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Tools for native npm modules (safe even if you don't need them)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests from the monorepo root (context is repo root)
COPY frontend/package*.json ./

# Install deps
RUN npm install

# Copy the rest of the frontend source
COPY frontend/ .

# Build Vite app
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built assets from the build stage
COPY --from=build /app/dist ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
