# devops/docker/frontend.Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend code
COPY frontend/ .

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:stable-alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
RUN echo 'server { \n\
    listen 80; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html; \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    location /api { \n\
        proxy_pass http://backend:5000; \n\
        proxy_http_version 1.1; \n\
        proxy_set_header Upgrade $http_upgrade; \n\
        proxy_set_header Connection "upgrade"; \n\
        proxy_set_header Host $host; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]