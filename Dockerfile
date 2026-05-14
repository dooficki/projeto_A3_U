# Espelho oficial da Docker Library na AWS Public ECR — evita timeouts frequentes ao Docker Hub (IPv6/DNS/rede).
FROM public.ecr.aws/docker/library/nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html admin.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js

EXPOSE 80
