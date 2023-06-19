# Auth logic demo

Implemented logic:

- CRUD operations for customers (get, update, delete) by id or email;
- login and signup operations for customers;
- roles USER and ADMIN;
- access token (with passport);
- refresh token;
- restrict access to get customers operation from unauthenticated users;
- restrict access to delete customer and update customer operations from unauthenticated users and customers with USER role;
- ability to verify customer's account after signup with activation code;

## Architecture

In its current state, the application introduces a very simple architecture to satisfy the essential requirements of the task. Therefore, the focus is on **Authentication** and **Authorization** processes.

For a production-ready application, the separation of layers with delegated responsibilities should be considered. The current solution is very dependent on tools like `Prisma`, `Postgres` and `NestJS` in its business logic (services).

Ideally business logic should be pure and independent and all details (like db, frameworks) should be injected using Dependency Injection (IOC practice). In our case that will require moving logic with `Prisma` to a database layer (repository) and reducing dependency on NestJS.

Eventually, we might achieve the following:

- presentation layer (http, graphql, dto)
- business layer (domain logic)
- database layer (postgres, prisma, redis)

## Installation

```bash
# install packages
yarn
npx prisma generate
```

## Local setup

1. create .env file using .env.example as reference
2. setup environment locally

```bash
make setup # in case of using Windows run commands from `Makefile.setup` one by one
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
# run integration tests
$ yarn test
```

### Should be improved:

- documentation (Swagger)
- enhance error handling (consider returning domain errors from the business layer)
- dockerize app, add docker-compose better testing and deployingØ
- validation of env vars before running the server
- improve logic for storing tokens/codes in the `keyValue` storage
- reinforce the business layer as described in the architecture section
