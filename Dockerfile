# Build stage
FROM node:14-alpine as build

WORKDIR /app

# Build raid hub API dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Build raid hub API dist
COPY . .
RUN npm run build

# Runtime stage
FROM node:14-alpine

WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

CMD [ "npm", "start" ]
