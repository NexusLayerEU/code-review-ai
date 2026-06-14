FROM node:20-alpine AS builder
WORKDIR /app

# Optional: pass the API URL at build time
# docker build --build-arg VITE_API_URL=https://api.example.com .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# Copy built assets and nginx config
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Drop nginx to a non-root user.
# nginx:alpine ships with the 'nginx' user (uid 101) — use it.
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80
