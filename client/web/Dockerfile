# Stage 1: Build React with Vite
# Build context is the workspace root (client/), not client/web,
# so npm ci can resolve the workspace lockfile and @freshr/shared.
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first (cheap layer, cached unless deps change)
COPY package*.json ./
COPY shared/package.json ./shared/package.json
COPY web/package.json ./web/package.json
COPY mobile/package.json ./mobile/package.json

RUN npm ci

# Now copy the source needed to build the web app
COPY shared ./shared
COPY web ./web

# These are injected at build time by GitHub Actions and permanently baked into the JS bundle.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_AUTH_CLIENT_ID
ARG VITE_WEB3FORMS_ACCESS_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_AUTH_CLIENT_ID=$VITE_GOOGLE_AUTH_CLIENT_ID
ENV VITE_WEB3FORMS_ACCESS_KEY=$VITE_WEB3FORMS_ACCESS_KEY

RUN npm run build --workspace=@freshr/web

# Stage 2: Serve the dist with Nginx
FROM nginx:alpine
COPY --from=builder /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
