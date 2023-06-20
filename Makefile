setup:
	docker run --name auth-task -e POSTGRES_PASSWORD=docker -p 5432:5432 -d postgres:11.16
	docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
	npx prisma migrate dev
	npx prisma db seed

clean:
	docker container stop auth-task 
	docker container stop redis-stack-server
	docker container rm auth-task 
	docker container rm redis-stack-server