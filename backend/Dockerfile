FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

ENV PORT=5000
EXPOSE ${PORT}

CMD ["npm", "run", "dev"]