FROM node:24-alpine AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine
WORKDIR /app
# System Chromium + fonts for Puppeteer PDF rendering
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont font-noto
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY templates ./templates
# Uploaded photos; owned by the runtime user so it can write to the mounted volume.
RUN mkdir -p uploads && chown node:node uploads
EXPOSE 5000
USER node
CMD ["node", "dist/index.js"]
