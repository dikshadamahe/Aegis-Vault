# Copilot Instructions

## Project Overview
VaultMVP - A password generator + secure vault.
Stack: Next.js (TypeScript), MongoDB Atlas, NextAuth, libsodium-wrappers, TailwindCSS, Framer Motion.

## Coding Standards
- Use TypeScript everywhere.
- Use functional React components with hooks.
- Follow Next.js App Router conventions.
- State management: Zustand if needed, otherwise Context.
- Styling: Tailwind with glassmorphism & dark theme.
- Animations: Framer Motion with subtle transitions.

## Security
- Client-side encryption with libsodium before sending to DB.
- Never store plaintext passwords in Mongo.
- Copy-to-clipboard must clear after 10–20s.
- No secrets in console.logs.

## UI/UX
- Dark minimal glassmorphic UI.
- Smooth transitions and animations.
- Mobile-first responsive design.
- Dashboard with search, add/edit/delete vault entries.

## Deliverables
- Working Next.js app (local + deployable to Vercel).
- README with setup steps.
- Encrypted blobs only in DB.
- Screen-record demo ready.

