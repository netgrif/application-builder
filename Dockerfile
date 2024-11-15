FROM node:18 as build
MAINTAINER NETGRIF <devops@netgrif.com>
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:alpine
MAINTAINER NETGRIF <devops@netgrif.com>
COPY default.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/application-builder/ /usr/share/nginx/html/
EXPOSE 80
ENTRYPOINT ["/bin/sh","-c","envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js && exec nginx -g 'daemon off;'"]
