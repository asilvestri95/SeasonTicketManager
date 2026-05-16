# Stage 1: Build the React client
FROM node:20-alpine AS client-builder
WORKDIR /app

COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build


# Stage 2: Build the Express server
FROM node:20-alpine AS server-builder
WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm ci

COPY server/ ./server/
RUN cd server && npx prisma generate && npm run build


# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Only production deps for the server
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Prisma requires its generated client — copy it from the builder
COPY --from=server-builder /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=server-builder /app/server/node_modules/@prisma/client ./server/node_modules/@prisma/client

# Keep the prisma binary available for db push on startup
COPY --from=server-builder /app/server/node_modules/prisma ./server/node_modules/prisma
COPY --from=server-builder /app/server/node_modules/.bin/prisma ./server/node_modules/.bin/prisma

# Compiled server
COPY --from=server-builder /app/server/dist ./server/dist

# Prisma schema (needed for db push)
COPY server/prisma ./server/prisma

# Built React app served as static files
COPY --from=client-builder /app/client/dist ./client/dist

# SQLite data directory (mount a volume here to persist data)
RUN mkdir -p /app/server/data

EXPOSE 3001

# On startup: sync the schema to the DB, then start the server
CMD ["sh", "-c", "cd /app/server && node_modules/.bin/prisma db push --skip-generate && node dist/index.js"]
