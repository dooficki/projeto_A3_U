# Catálogo de Produtos Interativo (A3)

Aplicação com **HTML**, **Bootstrap** e **JavaScript vanilla**: listagem (API [DummyJSON](https://dummyjson.com/products) + opcionalmente cadastro **local** no PostgreSQL), busca por título, favoritos com **localStorage** e **área de administração** para criar/editar/excluir produtos locais.

## Executar sem Docker

Abra `index.html` no navegador ou use um servidor estático. A DummyJSON exige internet; **cadastro local** só funciona com Docker (perfil **admin**) ou se você rodar a API manualmente e configurar proxy/CORS.

## Docker — só o site (catálogo DummyJSON)

Imagens base podem vir do espelho **[AWS Public ECR](https://gallery.ecr.aws/docker/library/nginx)** (`public.ecr.aws/docker/library/...`), útil se o Docker Hub der timeout.

```bash
docker compose build
docker compose up -d
```

Acesse **http://localhost:8080** (ou `WEB_PORT` no `.env`).

### Se ainda der timeout ao baixar imagens

1. `docker pull public.ecr.aws/docker/library/nginx:alpine`
2. Docker Desktop → *Settings → Docker Engine* → DNS (`8.8.8.8`, `1.1.1.1`) ou rede/VPN.
3. Volte ao Hub trocando `Dockerfile` para `FROM nginx:alpine` e a imagem do Postgres para `postgres:16-alpine`, se necessário.

## Docker — perfil **admin** (API + PostgreSQL + gestão de produtos)

Sobe **postgres**, **api** (Node com HTTP nativo + driver `pg`) e o **web** com proxy `/api` no Nginx.

1. Copie `.env.example` para `.env` (use senha simples para evitar caracteres que quebrem a URL do Postgres).
2. Build e subida:

```bash
docker compose build
docker compose --profile admin up -d
```

- Catálogo: **http://localhost:8080** — produtos locais aparecem com selo **Local** (IDs negativos, sem colidir com a DummyJSON).
- Admin: **http://localhost:8080/admin.html** — listagem, novo, editar e excluir no banco.

API também exposta em **http://localhost:3000** (`API_PORT`) para testes diretos (`GET /api/health`).

Encerrar mantendo dados:

```bash
docker compose --profile admin down
```

### Build da API demora ou trava no `npm install`

O erro **`ECONNRESET`** / **TLS** ao baixar `pg` indica queda de rede ou bloqueio até `registry.npmjs.org`.

1. **Tente de novo** — o `Dockerfile` da API já faz várias tentativas com `npm` (`fetch-retries` altos e até 3 rodadas com pausa).
2. **Espelho npm** — no `.env` (ou só na sessão do terminal), por exemplo:
   - `NPM_REGISTRY=https://registry.npmmirror.com/`
   Depois: `docker compose build api`
3. **Proxy** — empresa/universidade costuma exigir `HTTP_PROXY` / `HTTPS_PROXY`; defina no `.env` conforme [.env.example](.env.example) e rode o build de novo.
4. **Outra rede ou VPN** — às vezes só troca de Wi‑Fi/VPN estabiliza o TLS.

A imagem só depende do pacote **`pg`**. Em rede estável o primeiro build costuma levar poucos minutos.

Remover volume do banco (apaga cadastros):

```bash
docker compose --profile admin down -v
```

## Docker — perfil **db** (só PostgreSQL)

Para usar apenas o banco (sem API):

```bash
docker compose --profile db up -d
```

## Segurança

O painel **admin** não possui login — adequado para ambiente de estudo. Para produção, adicione autenticação na API e HTTPS.

## API (referência rápida)

| Método | Caminho | Uso |
|--------|---------|-----|
| GET | `/api/produtos/public` | Lista para o catálogo (IDs negativos) |
| GET | `/api/produtos` | Lista para admin (IDs reais) |
| GET | `/api/produtos/:id` | Um produto |
| POST | `/api/produtos` | Criar |
| PUT | `/api/produtos/:id` | Atualizar |
| DELETE | `/api/produtos/:id` | Remover |

## Estrutura

| Caminho | Função |
|--------|--------|
| `index.html` | Catálogo |
| `admin.html` | CRUD produtos locais |
| `css/styles.css` | Estilos |
| `js/api.js` | DummyJSON + `/api/produtos/public` |
| `js/storage.js` | Favoritos |
| `js/app.js` | Catálogo e favoritos |
| `js/admin.js` | Painel admin |
| `api/` | Servidor Node (HTTP nativo) + `pg` |
| `Dockerfile` | Imagem Nginx |
| `docker/nginx.conf` | Estático + proxy `/api/` |
| `docker-compose.yml` | `web`; `postgres` + `api` com perfis |

## Makefile (opcional)

- `make up` — só `web`
- `make down` — encerra stack padrão
- `make up-admin` — perfil admin (build implícito ao subir)
- `make up-db` — só Postgres
- `make rebuild` — rebuild do `web`

## GitHub Pages

Dá para publicar só os estáticos; **admin** e `/api` não funcionam no Pages sem backend hospedado à parte.
