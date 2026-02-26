FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/public/uploads /app/public/reviews /app/logs /app/attached_assets

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/index.js"]
