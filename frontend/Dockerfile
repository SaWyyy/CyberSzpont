# Etap 1: Budowanie aplikacji (Builder)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etap 2: Serwowanie aplikacji (Production)
FROM nginx:alpine
# Kopiujemy ZBUDOWANĄ aplikację (Vite tworzy folder 'dist') z etapu 1
COPY --from=builder /app/dist /usr/share/nginx/html
# Wystawiamy port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]