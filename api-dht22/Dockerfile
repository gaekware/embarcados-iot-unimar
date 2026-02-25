# Build stage
FROM node:22-alpine AS builder

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copy built app and generated prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/swagger.yaml ./swagger.yaml
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN npx prisma migrate deploy

EXPOSE 8080

CMD ["node", "dist/server.js"]

