FROM mcr.microsoft.com/playwright:v1.45.1-jammy

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["node", "src/index.js"]
