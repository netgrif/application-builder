FROM node:18.20.8 AS build
MAINTAINER NETGRIF <devops@netgrif.com>
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx/nginx-unprivileged:1.31.8-alpine-slim

MAINTAINER NETGRIF <devops@netgrif.com>

USER root

RUN apk add --no-cache su-exec gettext-envsubst libcap-utils \
    && setcap cap_net_bind_service=+ep /usr/sbin/nginx \
    && getcap /usr/sbin/nginx | grep -q cap_net_bind_service \
    && nginx -V 2>&1 | grep -q -- '--with-http_dav_module'

COPY default.nginx.conf /etc/nginx/conf.d/default.conf
COPY process-files.nginx.conf /etc/nginx/process-files-enabled.conf
COPY --from=build /app/dist/application-builder/ /usr/share/nginx/html/
COPY entrypoint.sh /usr/local/bin/application-builder-entrypoint

RUN chmod 755 /usr/local/bin/application-builder-entrypoint

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/application-builder-entrypoint"]
