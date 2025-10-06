# Aegis Vault

## Live Demo

Watch the product walk-through on Google Drive: https://drive.google.com/file/d/1zzN-rsPRuaSYOBKjab9VLvu33b_dk8Px/view?usp=sharing

## Description

Aegis Vault is a modern password manager built to keep sensitive credentials safe through client-side encryption, thoughtful UX, and a frictionless management dashboard. It combines a secure authentication flow, responsive UI animations, and productivity-focused tooling so storing, organising, and decrypting passwords stays under the owner’s control.

## Features

- Secure email/password auth via NextAuth with session hardening and rate-limited API routes
- Client-side envelope encryption for passwords and notes, unlocked through an account-password modal
- Dynamic favicons and category icons, plus responsive glassmorphic cards that expand on demand
- Vault dashboard with search, category filters, infinite scroll, and refresh-on-mutation caching
- Built-in password generator that wipes results after 15 seconds, with secure copy-to-clipboard actions and edit/delete confirmation flows
- View/hide toggles for passwords and passphrases across authentication, add/edit, and encryption dialogs
- Category management and demo seeding utilities for quick onboarding and testing
- Theme switcher with motion-enhanced modals and dark-first experience

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
	git clone https://github.com/dikshadamahe/Aegis-Vault.git aegis-vault
	cd aegis-vault
	```
2. **Install dependencies** (project uses pnpm by default)
	```bash
	npm install
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
	npm prisma generate
	# optional: sync schema metadata (MongoDB)
	npm prisma db push
	```
5. **Start the development server**
	```bash
	npm run dev
	```
6. Visit `http://localhost:3000` in your browser. Sign up or seed data via the included API utilities to explore the dashboard.

> Tip: If you switch package managers, delete the existing lockfile and regenerate it to avoid dependency drift.

## Demo

- username: `diksha`
- email: `diksha@google.com`
- password: `diksha123`

## License

This project is shared for educational purposes. Please review and adapt before using it in production.
