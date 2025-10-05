# 🏗️ Aegis Vault - Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AEGIS VAULT ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENT SIDE                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   User's Browser         │
│   (Next.js 14 + React)   │
├──────────────────────────┤
│                          │
│  📱 UI LAYER             │
│  ├─ VaultPage            │◄── Main dashboard with search/filter
│  ├─ AddPasswordModal     │◄── Form with encryption
│  ├─ ManageCategoriesModal│◄── Category CRUD
│  ├─ VaultCard            │◄── Password display card
│  ├─ PassphraseModal      │◄── Master passphrase prompt
│  └─ AegisLayout/Sidebar  │◄── Navigation wrapper
│                          │
│  🔐 ENCRYPTION LAYER     │
│  ├─ PassphraseProvider   │◄── Context for passphrase
│  ├─ deriveKeyFromPass... │◄── Argon2id KDF
│  ├─ encryptSecret()      │◄── libsodium encryption
│  └─ decryptSecret()      │◄── libsodium decryption
│                          │
│  📊 STATE LAYER          │
│  ├─ React Query          │◄── API caching
│  ├─ React Context        │◄── Passphrase state
│  └─ useState/useReducer  │◄── Local UI state
│                          │
└──────────────────────────┘
           │
           │ HTTPS (encrypted in transit)
           │
           ▼

┌─────────────────────────────────────────────────────────────────────┐
│                              SERVER SIDE                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   Next.js API Routes     │
├──────────────────────────┤
│                          │
│  🔒 AUTH ENDPOINTS       │
│  ├─ POST /api/auth/...   │◄── NextAuth handlers
│  └─ GET /api/auth/...    │◄── Session management
│                          │
│  🗄️  VAULT ENDPOINTS     │
│  ├─ GET  /api/vault/items│◄── List (encrypted)
│  ├─ POST /api/vault/items│◄── Create (encrypted)
│  ├─ GET  /api/vault/it...│◄── Read one
│  ├─ PATCH /api/vault/...  │◄── Update (encrypted)
│  └─ DELETE /api/vault/... │◄── Delete
│                          │
│  📁 CATEGORY ENDPOINTS   │
│  ├─ GET  /api/vault/cat..│◄── List categories
│  ├─ POST /api/vault/cat..│◄── Create category
│  ├─ PATCH /api/vault/c...│◄── Update category
│  ├─ DELETE /api/vault/...│◄── Delete category
│  └─ POST /api/vault/ca...│◄── Seed defaults
│                          │
│  ⚡ MIDDLEWARE           │
│  ├─ getServerSession()   │◄── Verify auth
│  ├─ Rate limiting        │◄── Prevent abuse
│  └─ Zod validation       │◄── Input validation
│                          │
└──────────────────────────┘
           │
           │ Prisma ORM
           │
           ▼

┌──────────────────────────┐
│   MongoDB Atlas          │
├──────────────────────────┤
│                          │
│  📊 COLLECTIONS          │
│                          │
│  User                    │
│  ├─ id (ObjectId)        │
│  ├─ email                │
│  ├─ hashedPassword       │
│  └─ encryptionSalt       │
│                          │
│  Category                │
│  ├─ id (ObjectId)        │
│  ├─ userId               │
│  ├─ name                 │
│  └─ slug                 │
│                          │
│  Password                │
│  ├─ id (ObjectId)        │
│  ├─ userId               │
│  ├─ categoryId           │
│  ├─ websiteName          │
│  ├─ username             │
│  ├─ email                │
│  ├─ url                  │
│  ├─ passwordCiphertext   │◄── ENCRYPTED
│  ├─ passwordNonce        │◄── ENCRYPTED
│  ├─ passwordSalt         │◄── ENCRYPTED
│  ├─ notesCiphertext      │◄── ENCRYPTED
│  └─ notesNonce           │◄── ENCRYPTED
│                          │
└──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW EXAMPLE                           │
└─────────────────────────────────────────────────────────────────────┘

📝 USER CREATES PASSWORD:

1. User fills form in AddPasswordModal
   └─ Title: "GitHub"
   └─ Category: "Development"
   └─ Password: "MySecurePassword123!"

2. Client-side encryption:
   └─ Generate salt: random 16 bytes
   └─ Get passphrase from PassphraseProvider
   └─ Derive key: Argon2id(passphrase, salt)
   └─ Encrypt: libsodium.secretbox(password, key, nonce)
   └─ Result: ciphertext + nonce + salt (base64)

3. API Request:
   POST /api/vault/items
   {
     "websiteName": "github",
     "categoryId": "67abc...",
     "passwordCiphertext": "xK9mP...",  ◄── ENCRYPTED
     "passwordNonce": "2bY8...",        ◄── ENCRYPTED
     "passwordSalt": "7pQ3..."          ◄── ENCRYPTED
   }

4. Server validation:
   └─ Check session (NextAuth)
   └─ Validate with Zod schema
   └─ Assert no plaintext fields
   └─ Verify category ownership

5. Database storage:
   └─ Save to MongoDB (ENCRYPTED)
   └─ Server never sees plaintext

6. Response:
   └─ Return created item (still encrypted)
   └─ React Query invalidates cache
   └─ UI refreshes with new card

🔓 USER VIEWS PASSWORD:

1. User clicks "Show Password" on VaultCard

2. Check passphrase:
   └─ If not in memory → prompt PassphraseModal
   └─ If in memory → use cached

3. Decrypt client-side:
   └─ Get salt from stored data
   └─ Derive key: Argon2id(passphrase, salt)
   └─ Decrypt: libsodium.secretbox_open(ciphertext, key, nonce)
   └─ Result: plaintext password

4. Display or copy:
   └─ Show in UI (temporary)
   └─ Or copy to clipboard
   └─ Plaintext never sent to server

┌─────────────────────────────────────────────────────────────────────┐
│                         SECURITY GUARANTEES                          │
└─────────────────────────────────────────────────────────────────────┘

✅ Zero-knowledge architecture
   └─ Server stores only ciphertext
   └─ Decryption keys never leave client

✅ Master passphrase never transmitted
   └─ Used only in browser
   └─ Derives encryption keys locally

✅ Unique salt per password
   └─ Each password has its own salt
   └─ Prevents rainbow table attacks

✅ Strong KDF (Argon2id)
   └─ Memory-hard
   └─ GPU-resistant
   └─ OWASP recommended

✅ Authenticated encryption (libsodium)
   └─ AES-256-GCM equivalent
   └─ Authenticated (prevents tampering)
   └─ Nonce prevents replay attacks

✅ Session security
   └─ HTTPS only
   └─ NextAuth JWT tokens
   └─ Rate limiting

✅ Database security
   └─ MongoDB Atlas (encrypted at rest)
   └─ Network isolation
   └─ Access controls

┌─────────────────────────────────────────────────────────────────────┐
│                       FRONTEND COMPONENT TREE                        │
└─────────────────────────────────────────────────────────────────────┘

app/
├─ layout.tsx (Root)
│  └─ Providers (SessionProvider)
│     └─ ThemeProvider (Dark mode)
│        └─ ReactQueryProvider
│           └─ PassphraseProvider (Encryption context)
│
├─ (authentication)/
│  ├─ sign-in/page.tsx
│  └─ sign-up/page.tsx
│
└─ (main)/
   ├─ vault/page.tsx ◄── MAIN DASHBOARD
   │  ├─ AegisLayout
   │  │  ├─ AegisSidebar
   │  │  │  ├─ Logo
   │  │  │  ├─ Navigation (Vault, Generator)
   │  │  │  └─ Logout
   │  │  └─ Content Area
   │  │     ├─ Header (title + description)
   │  │     ├─ Search & Filter Bar
   │  │     │  ├─ Search Input
   │  │     │  ├─ Category Dropdown ◄── FILTER
   │  │     │  ├─ Add New Button ◄── OPENS MODAL
   │  │     │  └─ Manage Categories Button ◄── OPENS MODAL
   │  │     └─ Vault Grid
   │  │        └─ VaultCard (per password)
   │  │           ├─ Category Badge
   │  │           ├─ Title + Username
   │  │           ├─ Show/Copy Password
   │  │           ├─ Edit Button
   │  │           └─ Delete Button
   │  │
   │  ├─ AddPasswordModal ◄── NEW
   │  │  ├─ Title Input
   │  │  ├─ Category Dropdown ◄── POPULATED
   │  │  ├─ Username Input
   │  │  ├─ Email Input
   │  │  ├─ Password Input ◄── ENCRYPTED ON SUBMIT
   │  │  ├─ URL Input
   │  │  ├─ Notes Textarea
   │  │  └─ Submit Button
   │  │
   │  └─ ManageCategoriesModal ◄── NEW
   │     ├─ Add Category Form
   │     ├─ Categories List
   │     │  └─ Category Item (+ Delete button)
   │     └─ Seed Default Button
   │
   └─ generator/page.tsx
      └─ Password Generator UI

┌─────────────────────────────────────────────────────────────────────┐
│                            API ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────────┘

Authentication:
├─ POST   /api/auth/register          ◄── Sign up
├─ POST   /api/auth/callback/...      ◄── Sign in (NextAuth)
└─ GET    /api/auth/session            ◄── Get session

Vault Items:
├─ GET    /api/vault/items              ◄── List (with ?category=&search=)
├─ POST   /api/vault/items              ◄── Create (encrypted)
├─ GET    /api/vault/items/[id]         ◄── Read one
├─ PATCH  /api/vault/items/[id]         ◄── Update
└─ DELETE /api/vault/items/[id]         ◄── Delete

Categories:
├─ GET    /api/vault/categories         ◄── List user's categories
├─ POST   /api/vault/categories         ◄── Create category
├─ PATCH  /api/vault/categories/[id]    ◄── Update category
├─ DELETE /api/vault/categories/[id]    ◄── Delete category
└─ POST   /api/vault/categories/seed    ◄── Seed defaults ◄── NEW

Utilities:
└─ POST   /api/generate-password        ◄── Generate strong password

┌─────────────────────────────────────────────────────────────────────┐
│                          FILE STRUCTURE                              │
└─────────────────────────────────────────────────────────────────────┘

Key Files:
├─ components/
│  ├─ add-password-modal.tsx           ◄── NEW ✨
│  ├─ manage-categories-modal.tsx      ◄── NEW ✨
│  ├─ vault-card.tsx                   ◄── Password card
│  ├─ passphrase-modal.tsx             ◄── Passphrase prompt
│  ├─ aegis-sidebar.tsx                ◄── Navigation
│  └─ aegis-layout.tsx                 ◄── Layout wrapper
│
├─ app/
│  ├─ (main)/vault/page.tsx            ◄── UPDATED ✨
│  ├─ (authentication)/sign-in/...     ◄── Auth pages
│  └─ api/
│     └─ vault/
│        ├─ items/route.ts             ◄── Password CRUD
│        └─ categories/
│           ├─ route.ts                ◄── Category CRUD
│           ├─ [id]/route.ts           ◄── Update/Delete
│           └─ seed/route.ts           ◄── NEW ✨
│
├─ lib/
│  ├─ crypto.ts                        ◄── Encryption utils
│  ├─ auth-options.ts                  ◄── NextAuth config
│  └─ validators/
│     └─ vault-encrypted-schema.ts     ◄── Zod schemas
│
├─ providers/
│  └─ passphrase-provider.tsx          ◄── Encryption context
│
└─ prisma/
   └─ schema.prisma                    ◄── Database models

┌─────────────────────────────────────────────────────────────────────┐
│                            SUMMARY                                   │
└─────────────────────────────────────────────────────────────────────┘

✅ Complete end-to-end encryption flow
✅ Full category management system
✅ Category filtering in vault
✅ Default categories seeding
✅ Secure API with validation
✅ Beautiful glassmorphic UI
✅ Smooth Framer Motion animations
✅ React Query for caching
✅ NextAuth for authentication
✅ MongoDB for storage
✅ TypeScript throughout
✅ Zero plaintext exposure

🎉 Production-ready password manager with portfolio-grade UI!
