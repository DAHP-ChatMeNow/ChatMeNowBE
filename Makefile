# Variables
IMAGE_NAME = chatmenow-backend
CONTAINER_NAME = chatmenow-be
PORT ?= $(shell grep PORT .env | cut -d '=' -f2)

build: 
	docker build -t $(IMAGE_NAME):latest .

run:
	docker rm -f $(CONTAINER_NAME) 2>/dev/null || true
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):$(PORT) \
		--env-file .env \
		--restart unless-stopped \
		$(IMAGE_NAME):latest

dev: 
	docker rm -f $(CONTAINER_NAME)-dev 2>/dev/null || true
	docker run -d \
		--name $(CONTAINER_NAME)-dev \
		-p $(PORT):$(PORT) \
		-v $(PWD)/src:/app/src \
		--env-file .env \
		$(IMAGE_NAME):latest \
		npm run dev

stop:
	docker stop $(CONTAINER_NAME) 2>/dev/null || true
	docker stop $(CONTAINER_NAME)-dev 2>/dev/null || true

restart: stop run 

logs: 
	docker logs -f $(CONTAINER_NAME)

logs-dev: 
	docker logs -f $(CONTAINER_NAME)-dev

shell: 
	docker exec -it $(CONTAINER_NAME) sh

status: 
	@docker ps -a | grep $(CONTAINER_NAME) || echo "❌ Container chưa chạy"

clean:
	docker rm -f $(CONTAINER_NAME) 2>/dev/null || true
	docker rm -f $(CONTAINER_NAME)-dev 2>/dev/null || true
	docker rmi $(IMAGE_NAME):latest 2>/dev/null || true

rebuild: clean build run 

quick: 
	@make build
	@make run
