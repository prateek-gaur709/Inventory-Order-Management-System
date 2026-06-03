# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* env vars at build time.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

# The official nginx image runs envsubst on /etc/nginx/templates/*.template at
# startup. NGINX_ENVSUBST_FILTER=PORT ensures ONLY ${PORT} is substituted, so
# nginx runtime vars like $uri / $host are left intact. PORT defaults to 80 and
# is overridden by the hosting platform (e.g. Render).
ENV PORT=80
ENV NGINX_ENVSUBST_FILTER=PORT

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Default nginx entrypoint renders templates then runs nginx.
