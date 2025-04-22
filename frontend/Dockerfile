FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start Vite development server with host binding to allow external access
CMD ["yarn", "dev", "--host", "0.0.0.0"] 