# Node.js 

Implemented functionality: 

- CRUD operations for customers (get, update, delete) by id or email;

- login and signup operations for customers;

- roles USER and ADMIN;

- access token;

- refresh token;

- restrict access to get customers operation from unauthenticated users;

- restrict access to delete customer and update customer operations from unauthenticated users and customers with USER role;

- ability to verify customer's account after signup with activation code;

## Installation

```bash
# Install packages
npm install

npx prisma generate
```

## Local database

```bash
# Setup local postgres
docker run --name recruitment-task -e POSTGRES_PASSWORD=docker -p 5432:5432 -d postgres:11.16

# Setup local redis

docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest

#create .env file with your local database credentials

# Run migration
npx prisma migrate dev

# Run db seed
npx prisma db seed
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

```

## Testing

```bash
#
$ yarn test
```

// TODO:

- documentation
- enhance error handling
- finalize tests
- dockerize app and docker-compose
- validation of env vars
- improve keys storage logic in key value storage (redis)
- implement different environment with different configs

### Architecture

In the current state, the application introduces a very simple architecture to satisfy the essential requirements of the task which is the authentication and authorization process. To make introduce a production-ready solution better separation of layers should be considered. The current solution is very dependent on tools like Prisma and NestJs in its business logic layer (services). Ideally business logic should be pure and independent and all of the details (tools like db) should be injected using IOC (namely DI). In our case that will require moving logic with Prisma interaction to the database layer (repository).
