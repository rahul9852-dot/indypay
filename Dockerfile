# First Stage : To install and build dependencies

# Use the latest Node.js Alpine image
FROM node:20.12.2-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g yarn

# Install dependencies
# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.yarn to speed up subsequent builds.
# Leverage a bind mounts to package.json and yarn.lock to avoid having to copy them into
# into this layer.
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Second Stage : Setup command to run your app using lightweight node image

FROM node:20.12.2-alpine
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/dist dist

# Set a default port if not provided
ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT

RUN apk add --no-cache curl

# Health check endpoint
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD curl --fail "http://localhost:$PORT/api/health-check" || exit 1

# Command to run your app using Nest CLI
CMD ["yarn", "start:migration:prod"]
