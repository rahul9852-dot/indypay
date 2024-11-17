FROM node:20.12.2-alpine AS base

# Install pnpm globally
RUN npm i -g pnpm

FROM base AS dependencies

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

FROM base AS build

WORKDIR /app
# Copy source files
COPY /.env.production ./.env
COPY src/ ./src/
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY package.json pnpm-lock.yaml ./
COPY --from=dependencies /app/node_modules ./node_modules

# Show contents before build
RUN ls -la
RUN pnpm build
# Show contents after build
RUN ls -la dist/

FROM base AS deploy

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.env ./.env

ARG PORT=4000
ENV PORT=$PORT
EXPOSE $PORT

RUN apk add --no-cache curl

# Verify the contents in the final stage
RUN ls -la
RUN ls -la dist/

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD curl --fail "http://localhost:$PORT/api/health-check" || exit 1

# Try alternative start command
CMD ["node", "./dist/src/main.js"]