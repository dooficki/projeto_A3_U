FROM public.ecr.aws/docker/library/node:20-alpine

WORKDIR /app

# Opcional: espelho npm ou proxy corporativo (veja README e .env.example)
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=$HTTP_PROXY HTTPS_PROXY=$HTTPS_PROXY NO_PROXY=$NO_PROXY

COPY package.json ./
RUN npm config set registry "${NPM_REGISTRY}" \
  && npm install --omit=dev --no-audit --no-fund \
      --fetch-retries=25 \
      --fetch-retry-factor=3 \
      --fetch-retry-mintimeout=20000 \
      --fetch-retry-maxtimeout=240000 \
  || (echo "Primeira tentativa falhou; nova rodada em 30s..." && sleep 30 \
      && npm install --omit=dev --no-audit --no-fund \
          --fetch-retries=25 \
          --fetch-retry-factor=3 \
          --fetch-retry-mintimeout=20000 \
          --fetch-retry-maxtimeout=240000) \
  || (echo "Segunda tentativa falhou; última rodada em 60s..." && sleep 60 \
      && npm install --omit=dev --no-audit --no-fund \
          --fetch-retries=25 \
          --fetch-retry-factor=3 \
          --fetch-retry-mintimeout=20000 \
          --fetch-retry-maxtimeout=240000)

COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
