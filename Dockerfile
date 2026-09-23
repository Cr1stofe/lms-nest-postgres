FROM node:24-alpine AS base
WORKDIR /app
RUN apk --no-cache add vips-tools && mkdir -p /files/public /files/private
COPY seed/files /files/

FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npm ci && npx prisma generate
COPY src ./src/
RUN npm run build

FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npm ci --omit=dev && npx prisma generate
COPY src ./src/
COPY --from=builder /app/dist ./dist/

CMD ["node", "dist/main.js"]
