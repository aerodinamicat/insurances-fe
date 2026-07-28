FROM node:24-bookworm-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
