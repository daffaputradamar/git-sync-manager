# Simple single-stage Dockerfile that mirrors local flow
FROM node:22-alpine
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lockfile and package manifest first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies (production + dev for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the app
RUN pnpm run build

# Set production environment and expose port
ENV NODE_ENV=production
EXPOSE 3000

# Use pnpm to start the app
CMD ["pnpm", "start"]