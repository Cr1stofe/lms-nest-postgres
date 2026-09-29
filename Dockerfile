FROM node:24-alpine AS base
WORKDIR /app
RUN apk --no-cache add vips-tools && mkdir -p /files/public /files/private
COPY seed/files /files/

FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci \
    && npx prisma generate

FROM deps AS dev
WORKDIR /app
COPY src ./src/
CMD ["npm", "run", "start:dev"]

FROM deps AS builder
WORKDIR /app
COPY src ./src/
RUN npm run build

FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci --omit=dev \
    && npx prisma generate
COPY src ./src/
COPY --from=builder /app/dist ./dist/

CMD ["node", "dist/main.js"]


