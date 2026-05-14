.PHONY: up down up-db up-admin rebuild logs

up:
	docker compose up -d

down:
	docker compose down

up-db:
	docker compose --profile db up -d

up-admin:
	docker compose build
	docker compose --profile admin up -d

rebuild:
	docker compose build --no-cache web
	docker compose up -d

logs:
	docker compose logs -f web
