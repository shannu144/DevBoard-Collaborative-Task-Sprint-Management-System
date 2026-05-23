# Use lightweight official Node Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency catalogs
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose API port
EXPOSE 5000

# Run API
CMD ["node", "src/app.js"]
