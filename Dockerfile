FROM node:18 as build
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:alpine
MAINTAINER Netgrif <devops@netgrif.com>
COPY default.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/application-builder/ /usr/share/nginx/html/
EXPOSE 80
ENTRYPOINT ["nginx","-g","daemon off;"]
