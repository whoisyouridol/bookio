# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies — separate layer, cached unless package.json changes
COPY package.json package-lock.json ./
RUN npm ci --silent

COPY . .

# VITE_* vars must be available at build time — Vite bakes them into the bundle
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

ARG VITE_FACEBOOK_APP_ID
ENV VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID

RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS final

# Generate self-signed TLS certificate for local HTTPS
RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
       -keyout /etc/nginx/ssl/key.pem \
       -out /etc/nginx/ssl/cert.pem \
       -subj "/CN=localhost" \
    && apk del openssl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- --no-check-certificate https://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
