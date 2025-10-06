# Aegis Vault

## Live Demo

Coming soon — the deployment URL will be added after launch.

## Description

Aegis Vault is a modern password manager built to keep sensitive credentials safe through client-side encryption, thoughtful UX, and a frictionless management dashboard. It combines a secure authentication flow, responsive UI animations, and productivity-focused tooling so storing, organising, and decrypting passwords stays under the owner’s control.

## Features

- Secure auth flow with NextAuth, session hardening, and rate-limited API endpoints
- Client-side envelope encryption for passwords and notes using libsodium
- Dynamic logos and favicons for saved sites, plus category icons for quick scanning
- Rich dashboard with search, filtering, infinite scroll, and responsive cards
- Password generator, strength analysis, and inline copy/share helpers
- Category management, bulk seeding utilities, and edit/delete confirmations
- Theming support with glassmorphic UI, motion-enhanced modals, and dark mode defaults

## Tech Stack

- Next.js (App Router)
- TypeScript
- MongoDB + Prisma
- NextAuth
- Tailwind CSS
- Framer Motion
- libsodium-wrappers

## How to Run Locally

1. **Clone the repository**
	```bash
	git clone https://github.com/dikshadamahe/password-authenticator.git aegis-vault
	cd aegis-vault
	```
2. **Install dependencies** (project uses pnpm by default)
	```bash
	pnpm install
	# or use npm install / yarn install if you prefer, but keep lockfiles consistent
	```
3. **Create `.env.local`** at the project root and populate the required values:
	```env
	MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/aegisvault?retryWrites=true&w=majority"
	NEXTAUTH_URL=http://localhost:3000
	NEXTAUTH_SECRET=<generate-a-random-secret>
	GOOGLE_CLIENT_ID=<optional-if-using-google-provider>
	GOOGLE_CLIENT_SECRET=<optional-if-using-google-provider>
	```
	- Ensure the MongoDB URI includes a database name (e.g. `/aegisvault`).
	- Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32` or a similar command.
4. **Generate the Prisma client**
	```bash
	pnpm prisma generate
	# optional: sync schema metadata (MongoDB)
	pnpm prisma db push
	```
5. **Start the development server**
	```bash
	pnpm dev
	```
6. Visit `http://localhost:3000` in your browser. Sign up or seed data via the included API utilities to explore the dashboard.

> Tip: If you switch package managers, delete the existing lockfile and regenerate it to avoid dependency drift.

## Crypto Note

For client-side encryption, this project uses libsodium-wrappers. A Master Encryption Key is derived from the user's password and a unique salt using crypto_pwhash (Argon2id). This key is then used for a robust envelope encryption scheme with crypto_secretbox (XChaCha20-Poly1305) to secure each password item individually.

## License

This project is shared for educational purposes. Please review and adapt before using it in production.
