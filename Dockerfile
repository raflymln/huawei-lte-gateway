# syntax=docker/dockerfile:1.22

FROM docker.io/oven/bun:1.3.10 AS base-dev

# Set working directory
WORKDIR /tmp/build

# Install required packages for JS native dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  python3 python-is-python3 \
  tini \
  && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
  && apt-get autoremove -y \
  && apt-get autoclean -y \
  && rm -rf /var/lib/apt/lists/*

# Install static Git
COPY --from=ghcr.io/hazmi35/git-static:2.53.0 /usr/local/bin/git /usr/local/bin/git

FROM docker.io/library/debian:13.4-slim AS base-prod

# Set working directory
WORKDIR /usr/local/lib/huawei-lte-gateway

# Install runtime packages
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  iputils-ping \
  procps \
  tini \
  tzdata \
  libmimalloc3 \
  unzip \
  && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
  && apt-get autoremove -y \
  && apt-get autoclean -y \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /usr/lib/alias \
  && ln -sf $(dpkg -L libmimalloc3 | grep libmimalloc.so | head -n 1) /usr/lib/alias/libmimalloc.so

# Create a new group and user with UID 1000, without home directory
RUN groupadd -g 1000 app && \
  useradd -u 1000 -g app -M app

# Use a better malloc(3) implementation
ENV LD_PRELOAD=/usr/lib/alias/libmimalloc.so

# Set tini as entrypoint
ENTRYPOINT ["tini", "--"]

# Build stage
FROM base-dev AS app-build

# Copy package files first for better layer caching
COPY package.json bun.lock ./

# Install dependencies (with git initialized to avoid errors)
RUN git init && bun install --frozen-lockfile

# Copy source code after dependencies are installed
COPY . .

# Determine the target based on the architecture, then build the application
RUN ARCH=$(uname -m) && \
  if [ "$ARCH" = "x86_64" ]; then \
  TARGET="bun-linux-x64-modern"; \
  elif [ "$ARCH" = "aarch64" ]; then \
  TARGET="bun-linux-arm64"; \
  else \
  echo "Unsupported architecture: $ARCH" && exit 1; \
  fi && \
  bun build \
  --compile \
  --sourcemap \
  --target $TARGET \
  --outfile huawei-lte-gateway \
  src/app.ts

FROM base-prod AS runtime

# Copy the built application
COPY LICENSE ./LICENSE
COPY --from=app-build /tmp/build/huawei-lte-gateway /usr/local/bin/huawei-lte-gateway
COPY --from=app-build /tmp/build/package.json ./package.json

# Change back to non-root user
USER app

ENV NODE_ENV=production
ENV PORT=3000
ENV MODEM_URL=http://192.168.8.1/api
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["/usr/local/bin/huawei-lte-gateway"]
