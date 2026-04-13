# syntax=docker/dockerfile:1.7

# ══════════════════════════════════════════════════════════════
# Stage 1: deps — pnpm 의존성 설치 (캐시 레이어)
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm 활성화 (Node 20은 corepack 내장)
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ══════════════════════════════════════════════════════════════
# Stage 2: builder — Next 빌드
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ══════════════════════════════════════════════════════════════
# Stage 3: runner — 최소 런타임
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# non-root 사용자
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone 산출물만 복사 (이미지 크기 최소화)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]