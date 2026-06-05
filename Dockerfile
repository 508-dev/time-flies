# syntax=docker/dockerfile:1

# time-flies builds to static files; deploy = build them, then serve with nginx.
# We build with Node (compiled for baseline x86-64) rather than Bun to avoid the
# AVX2/SIGILL (exit 132) crash Bun hits on build hosts without AVX2.

# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app

# Install deps first for better layer caching. (We use npm here so the build
# doesn't depend on Bun; bun.lock is still the source of truth for local dev.)
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- serve stage ----
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
