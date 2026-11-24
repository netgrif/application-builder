FROM node:18.20.8 AS build
MAINTAINER NETGRIF <devops@netgrif.com>
WORKDIR /app
COPY . .
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx/nginx-unprivileged:1.31.8-alpine-slim

LABEL org.opencontainers.image.title="Application Builder" \
      org.opencontainers.image.authors="devops@netgrif.com" \
      org.opencontainers.image.url="https://builder.netgrif.cloud" \
      org.opencontainers.image.vendor="NETGRIF, s.r.o."

USER root

RUN apk add --no-cache su-exec gettext-envsubst curl \
    && nginx -V 2>&1 | grep -q -- '--with-http_dav_module'

COPY default.nginx.conf /etc/nginx/conf.d/default.conf
COPY process-files.nginx.conf /etc/nginx/process-files-enabled.conf
COPY --from=build /app/dist/application-builder/ /usr/share/nginx/html/
COPY entrypoint.sh /usr/local/bin/application-builder-entrypoint

RUN chmod 755 /usr/local/bin/application-builder-entrypoint

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/application-builder-entrypoint"]
