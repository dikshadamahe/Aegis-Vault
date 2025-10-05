# Passweird

Password Manager built with Next.js and shadcn/ui.

## Tech Stack

- Next.js (App Router)
- Prisma ORM (MongoDB provider)
- Tailwind CSS
- shadcn/ui
- MongoDB (Atlas or local)

## Resources

[UI resource](https://dribbble.com/shots/22572958-Password-Manager-App-Dashboard-Page-Light)

## Demo

[demo](https://passweird.vercel.app/)

- username: "susan"
- email: "susan@example.com"
- password: "susan123"

## Getting Started

### Environment

Create a `.env` file with:

```
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/vaultmvp?retryWrites=true&w=majority"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-a-secret>
```

Note: Prisma with MongoDB requires a database name in the URI path (e.g. `/vaultmvp`). If your environment has DNS/egress restrictions with SRV, use the "Standard connection string" (non-SRV) from Atlas or a local MongoDB instance.

### Prisma (MongoDB)

Prisma migrations are not supported for MongoDB. Use `generate` and (optionally) `db push`:

```
npm run prisma:generate
# optionally sync schema metadata for tooling
npm run prisma:sync
```

### Run the app

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
