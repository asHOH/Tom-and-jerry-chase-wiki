# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm i --include=dev

FROM deps AS builder
COPY . .
ENV NEXT_PUBLIC_DISABLE_ARTICLES=1 \
    NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN node scripts/run-image-optimization.cjs && npm run build --webpack
RUN npm prune --omit=dev

FROM base AS runner
ENV NEXT_PUBLIC_DISABLE_ARTICLES=1 \
    NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/csp.config.mjs ./csp.config.mjs
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["npm", "run", "start"]
