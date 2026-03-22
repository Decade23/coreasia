# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.9
FROM oven/bun:${BUN_VERSION} AS base

WORKDIR /app

ENV NUXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    PORT=3000

FROM base AS deps

COPY package.json bun.lock ./
RUN bun install

FROM deps AS development

ENV NODE_ENV=development
COPY . .
RUN mkdir -p /app/.nuxt /app/.output

EXPOSE 3000
CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "3000"]

FROM deps AS build

COPY . .
ENV NODE_ENV=production \
    NUXT_DISABLE_TYPECHECK=true
RUN bun run build

FROM base AS production

ENV NODE_ENV=production \
    BUN_JSC_forceRAMSize=536870912
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app/package.json
COPY --from=build /app/.output /app/.output
RUN rm -rf /app/.output/server/node_modules && ln -s /app/node_modules /app/.output/server/node_modules

USER bun
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
