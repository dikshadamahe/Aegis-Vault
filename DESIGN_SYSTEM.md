# Aegis Vault - Hyper-Modern UI/UX Design System

## 🎨 Design Philosophy

**Keywords:** Hyper-Minimalism • Dark Glassmorphism • Cinematic Feel • Intentional Motion

This UI was crafted from scratch following world-class portfolio and premium dashboard standards. Every pixel, every animation, every interaction has been intentionally designed to create a **premium, human-crafted experience** that does NOT look AI-generated.

---

## 🎭 Core Aesthetic

### Color Palette

```css
/* Background */
--aegis-bg-deep: #0A0F19           /* Deep navy/charcoal base */
--aegis-bg-card: rgba(22,27,34,0.7) /* Glass card surface */
--aegis-bg-elevated: rgba(30,35,42,0.85) /* Elevated surfaces */

/* Accents */
--aegis-accent-primary: #00AEEF    /* Electric blue (primary CTA) */
--aegis-accent-teal: #00BFA5       /* Teal accent (secondary) */
--aegis-accent-blue: #58A6FF       /* Link blue */

/* Typography */
--aegis-text-heading: #FFFFFF      /* Bright white for headings */
--aegis-text-body: #C3CAD3         /* Soft, legible body text */
--aegis-text-muted: #8B949E        /* Muted text for labels */

/* Borders & Effects */
--aegis-border: rgba(56,97,142,0.3) /* Subtle glowing borders */
--aegis-border-hover: rgba(0,174,239,0.5)
--aegis-glow: rgba(0,174,239,0.2)  /* Ambient glow effect */
```

### Typography Scale

**Font Family:** Inter (Google Fonts)
- Weight range: 300, 400, 500, 600, 700, 800
- Tight tracking on headings (`tracking-tight`)
- Clean letter spacing for body text

**Scale:**
- `h1`: 4xl/5xl - Page titles with gradient text
- `h2`: 3xl/4xl - Section headers
- `h3`: 2xl/3xl - Card titles
- Body: Base size with `text-[var(--aegis-text-body)]`
- Labels: `text-xs uppercase tracking-wider font-semibold`

### 8-Point Grid System

All spacing follows an **8-point grid** for professional organization:

```css
--space-1: 8px   /* 1 unit */
--space-2: 16px  /* 2 units */
--space-3: 24px  /* 3 units */
--space-4: 32px  /* 4 units */
--space-5: 40px  /* 5 units */
--space-6: 48px  /* 6 units */
```

Use `style={{ padding: "var(--space-4)" }}` for consistent spacing.

---

## 🧩 Component Architecture

### 1. **Sidebar.tsx**
**Purpose:** Fixed, collapsible navigation sidebar with category filtering.

**Features:**
- Expandable/collapsible with smooth width animation
- Gradient logo with glow effect
- Active tab indicator with `layoutId` animation
- Category icons with hover effects
- Bottom-aligned logout button

**Animations:**
- Slide in from left on mount (`x: -80 → 0`)
- Staggered fade-in for nav items
- Smooth expand/collapse with custom easing `[0.16, 1, 0.3, 1]`

### 2. **PasswordCard.tsx**
**Purpose:** Interactive accordion card for password entries.

**Features:**
- Fetched favicon using `Favicon` component
- Click to expand/collapse with smooth height animation
- Masked password with eye icon toggle
- Per-card decryption (opens `PassphraseModal`)
- Copy-to-clipboard buttons with toast feedback
- External link button for URLs

**Animations:**
- Fade-up on mount (`y: 20 → 0`)
- Smooth accordion expand/collapse
- Icon rotations and scale effects on hover
- Staggered reveal of form fields on expand

### 3. **AddPasswordModal.tsx**
**Purpose:** Premium modal for adding new password entries.

**Features:**
- Two-column grid layout (Username & Email side-by-side)
- Backdrop blur with fade animation
- Modal scale animation (`95% → 100%`)
- Form validation with Zod
- Category dropdown integration
- Passphrase modal integration for encryption

**Animations:**
- Backdrop fade-in
- Modal scale + fade + slide-up
- Rotate on close button hover
- Button scale effects

### 4. **ManageCategoriesModal.tsx**
**Purpose:** Clean modal for managing password categories.

**Features:**
- Inline add category form
- Category list with icons from `categoryIcon` mapping
- Delete category with confirmation (hover to reveal)
- Staggered list animations

**Animations:**
- Same backdrop/modal entry as AddPasswordModal
- Staggered category item fade-in
- Exit animation with slide-out + height collapse

### 5. **DashboardLayout.tsx**
**Purpose:** Main layout wrapper with sidebar and content area.

**Features:**
- Staggered page load animations (`staggerChildren`)
- Ambient background glows (top-left & bottom-right)
- Content area with proper spacing
- Category filter callback support

**Animations:**
- Container uses `staggerChildren: 0.1`
- Items fade-up with delay
- Background glows with slow fade-in

### 6. **Favicon.tsx**
**Purpose:** Fetch and display website logos using Google Favicon API.

**Features:**
- Domain extraction from URLs
- Fallback to globe icon on error
- Lazy loading and error handling
- Rounded corners for polish

---

## 🎬 Motion System (Framer Motion)

### Global Principles

1. **Custom Easing:** All animations use `ease: [0.16, 1, 0.3, 1]` for a **premium, bouncy feel**.
2. **Stagger Delays:** Page load uses `staggerChildren: 0.1` with `delayChildren: 0.2`.
3. **Duration:** Most animations are `0.4s` to `0.6s` for cinematic quality.

### Animation Patterns

#### Page Transitions
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};
```

#### Modal Entry/Exit
```tsx
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Modal
initial={{ scale: 0.95, opacity: 0, y: 20 }}
animate={{ scale: 1, opacity: 1, y: 0 }}
exit={{ scale: 0.95, opacity: 0, y: 20 }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
```

#### Micro-interactions
```tsx
// Buttons
whileHover={{ scale: 1.02, y: -2 }}
whileTap={{ scale: 0.98 }}

// Icons
whileHover={{ scale: 1.1, rotate: 5 }}
```

#### Accordion Expansion
```tsx
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    />
  )}
</AnimatePresence>
```

---

## 🛠️ Utility Classes

### Glass Card
```tsx
className="glass-card"
// → background, backdrop-blur, border, shadow
```

### Glass Card Elevated
```tsx
className="glass-card-elevated"
// → Enhanced blur + glow for modals
```

### Buttons
```tsx
className="btn-accent"   // Primary CTA with gradient
className="btn-ghost"    // Secondary button
```

### Inputs
```tsx
className="input-glass"  // All form inputs
```

### Scrollbar
```tsx
className="scrollbar-thin"  // For overflow containers
```

---

## 🎯 Integration Points

### Crypto Functions
- **Decrypt:** `decryptWithEnvelope(payload, mek)` or `decryptSecret(payload, mek)`
- **Encrypt:** `encryptWithEnvelope(plaintext, mek)`
- **Key Derivation:** `deriveKeyFromPassphrase(passphrase, salt)`

### API Endpoints
- `GET /api/vault/items` - Fetch all password items
- `POST /api/vault/items` - Create new password
- `GET /api/vault/categories` - Fetch categories
- `POST /api/vault/categories` - Create category
- `DELETE /api/vault/categories/:id` - Delete category

---

## 📦 File Structure

```
components/
├── Sidebar.tsx                 ← Fixed sidebar with categories
├── PasswordCard.tsx            ← Accordion card with decryption
├── AddPasswordModal.tsx        ← Two-column add password form
├── ManageCategoriesModal.tsx   ← Category management
├── DashboardLayout.tsx         ← Main layout wrapper
├── Favicon.tsx                 ← Website logo fetcher
├── passphrase-modal.tsx        ← Full-screen passphrase prompt
└── index.ts                    ← Export index

app/(main)/vault/
└── page.tsx                    ← Premium vault page with search & filters
```

---

## 🚀 Usage Example

```tsx
import { DashboardLayout, PasswordCard, AddPasswordModal } from "@/components";

export default function VaultPage() {
  return (
    <DashboardLayout>
      <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[var(--aegis-text-heading)] to-[var(--aegis-accent-primary)] bg-clip-text text-transparent">
        Aegis Vault
      </h1>
      {/* Cards, modals, etc. */}
    </DashboardLayout>
  );
}
```

---

## ✅ Quality Checklist

- [x] Hyper-minimalist aesthetic with intentional use of whitespace
- [x] Dark glassmorphism with backdrop blur effects
- [x] Electric blue (#00AEEF) accent for CTAs
- [x] Inter font with proper weight hierarchy
- [x] 8-point grid system for all spacing
- [x] Staggered page load animations
- [x] Modal backdrop fade + scale animations
- [x] Micro-interactions on all interactive elements
- [x] Premium custom easing curves
- [x] Ambient background glows
- [x] No AI-generated feel - looks human-crafted

---

## 🎨 Design Tokens Reference

Copy-paste ready CSS variables:

```css
/* Use in Tailwind classes */
bg-[var(--aegis-bg-deep)]
text-[var(--aegis-text-heading)]
border-[var(--aegis-border)]
hover:border-[var(--aegis-border-hover)]

/* Use in inline styles */
style={{ 
  background: "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
  boxShadow: "var(--shadow-glow)"
}}
```

---

**Built with:** Next.js 14 • React • TypeScript • Tailwind CSS • Framer Motion • libsodium

**Design Standard:** World-Class Portfolio / Premium SaaS Dashboard

**Status:** Production-Ready ✨
