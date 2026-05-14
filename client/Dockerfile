# Stage 1: Build React with Vite
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .

# VITE_API_BASE_URL is injected at build time by GitHub Actions.
# It gets permanently baked into the JS bundle — there is no runtime env for this.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Serve the dist with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]