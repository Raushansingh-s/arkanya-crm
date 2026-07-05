FROM node:18-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
