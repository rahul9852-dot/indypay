# First Stage : Install and build dependencies

# Use the latest Node.js Alpine image
FROM node:20.12.2-alpine AS builder
WORKDIR /app

# Copy only the package.json and pnpm lockfile first to leverage Docker caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
# Use the cache mount to /root/.pnpm-store to cache dependencies between builds
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm build

# Second Stage: Setup to run your app using a lightweight node image

FROM node:20.12.2-alpine
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/dist dist

# Set a default port if not provided
ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT

# Install curl for health checks
RUN apk add --no-cache curl

# Health check endpoint
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD curl --fail "http://localhost:$PORT/api/health-check" || exit 1

# Command to run your app in production mode
CMD ["pnpm", "start:prod"]
