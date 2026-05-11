FROM node:20-alpine

WORKDIR /app

# install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# copy source
COPY . .

EXPOSE 5173

# vite must bind to 0.0.0.0 to be reachable outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]