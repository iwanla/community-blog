.PHONY: build dev deploy typecheck migrate-local migrate-remote

build:
	npm run build

dev:
	npm run dev

deploy:
	npm run deploy

typecheck:
	npm run typecheck

migrate-local:
	npm run db:migrate:local

migrate-remote:
	npm run db:migrate:remote
