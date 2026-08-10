.PHONY: help install dev backend frontend build test lint typecheck clean

help:
	@echo "Available targets:"
	@echo "  install     Install backend (uv) and frontend (npm) dependencies"
	@echo "  dev         Run backend + frontend concurrently with prefixed output"
	@echo "  backend     Run only the FastAPI backend"
	@echo "  frontend    Run only the React frontend"
	@echo "  build       Build the frontend for production"
	@echo "  test        Run backend tests"
	@echo "  lint        Lint the frontend"
	@echo "  typecheck   TypeScript check the frontend"
	@echo "  clean       Remove build artifacts and caches"

install:
	cd backend && uv sync
	cd frontend && npm install

backend:
	cd backend && uv run uvicorn app.main:app --reload

frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build

test:
	cd backend && uv run pytest

lint:
	cd frontend && npm run lint

typecheck:
	cd frontend && npm run typecheck

clean:
	rm -rf backend/__pycache__ backend/**/__pycache__ backend/.pytest_cache backend/.ruff_cache
	rm -rf frontend/node_modules frontend/dist

dev:
	@bash -c '\
		trap "kill 0" SIGINT SIGTERM EXIT; \
		( cd backend && uv run uvicorn app.main:app --reload 2>&1 | sed -u "s/^/[backend]  /" ) & \
		( cd frontend && npm run dev 2>&1 | sed -u "s/^/[frontend] /" ) & \
		wait \
	'
