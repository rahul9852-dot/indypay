# PayBolt Backend

### Development

Install packages with pnpm

```bash
pnpm install
```

Create `.env` file according to `.env.example`

Start dev server

```bash
pnpm start:dev
```

it will start on http://localhost:4000

### Install PostgreSQL locally

```bash
brew install postgresql
```

```bash
brew services start postgresql
```

## To Deploy On EC2

- After connecting instance

1. For Staging

```bash
pnpm deploy:staging
```

2. For Prod

```bash
pnpm deploy:prod
```
