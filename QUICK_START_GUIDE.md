# 🚀 Aegis Vault - Quick Start Guide

## What's New in Version 2.0

Your password manager has been completely overhauled with portfolio-grade UI/UX. Here's what changed:

---

## 🎯 New Features at a Glance

### 1. **Collapsible Sidebar** 
- Click the chevron button at the bottom to expand/collapse
- **Collapsed:** See icons only (80px width)
- **Expanded:** See icons + labels (240px width)
- All your categories are now in the sidebar!

### 2. **Category Filtering**
- Click any category in the sidebar to filter passwords
- Selected category gets a teal highlight
- Click again to show all passwords

### 3. **Interactive Accordion Cards**
- Click any password card to expand/collapse
- See all details: username, email, URL, notes
- Password is masked by default (••••••••••••)

### 4. **Secure Password Viewing**
- Click the **eye icon** to decrypt and view password
- PassphraseModal will ask for your master passphrase
- Toggle between masked and plaintext views
- Copy password with one click

### 5. **Category Grouping**
- Passwords automatically grouped by category
- Beautiful section headers with gradient dividers
- Smooth animations when loading

---

## 📱 How to Use Aegis Vault

### Starting Up

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

Navigate to: `http://localhost:3000`

---

### First Time Setup

1. **Sign Up**
   - Create your account at `/sign-up`
   - Choose a strong password
   - Accept terms and conditions

2. **Seed Categories**
   - Go to Vault page
   - Click the **folder icon** (Manage Categories)
   - Click "Add Default Categories" button
   - You'll get 9 categories: Web Logins, Bank Accounts, Credit Cards, etc.

3. **Add Your First Password**
   - Click the green **"+ Add New"** button
   - Fill in the form:
     - Website Name (required)
     - Username or Email (at least one required)
     - Password (required)
     - Category (required)
     - URL (optional)
     - Notes (optional)
   - Click "Add Password"
   - Your password is encrypted with your master passphrase

---

### Daily Usage

#### **Viewing Passwords**

1. Open Vault (`/vault`)
2. See all passwords grouped by category
3. Click any card to expand and see details
4. Password is masked: `••••••••••••`

#### **Decrypting a Password**

1. Click the **eye icon** next to masked password
2. PassphraseModal opens
3. Enter your master passphrase
4. Password reveals in plaintext
5. Click eye icon again to hide

#### **Copying a Password**

1. Expand the card (click header)
2. Click **"Copy Password"** button
3. Password decrypts automatically (asks for passphrase if needed)
4. Success toast confirms copy
5. Paste wherever you need it

#### **Filtering by Category**

1. Expand sidebar (click chevron at bottom)
2. Click any category name (e.g., "Bank Accounts")
3. Only passwords in that category show
4. Click category again to clear filter

#### **Searching Passwords**

1. Use the search bar at top
2. Type website name, username, or email
3. Results update in real-time
4. Search works across all fields

---

### Generating Strong Passwords

1. Click **"Generator"** in sidebar
2. Adjust length slider (6-50 characters)
3. Toggle character types:
   - Lowercase (a-z)
   - Uppercase (A-Z)
   - Digits (0-9)
   - Special characters (!@#$%)
4. Click **"Generate Password"**
5. Click copy icon to copy to clipboard
6. Use in Add Password form

---

### Managing Categories

1. Click **folder icon** in Vault toolbar
2. See all your categories
3. **Add New:** Enter name, click "Add Category"
4. **Delete:** Click trash icon (only if no passwords use it)
5. **Seed Defaults:** Click button to add 9 standard categories

---

## 🎨 UI/UX Features

### Sidebar States

- **Collapsed (Default):** 80px wide, icons only
- **Expanded:** 240px wide, icons + labels
- **Toggle:** Click chevron button at bottom
- **Categories:** Scroll list in expanded mode

### Card Interactions

- **Hover:** Slight background highlight
- **Click Header:** Expand/collapse accordion
- **Chevron:** Rotates 180° when expanded
- **Eye Icon:** Decrypt password (triggers passphrase modal)
- **Copy Button:** One-click secure copy
- **Edit Button:** Modify password details
- **Delete Button:** Remove password (with confirmation)

### Animations

- **Card Entrance:** Staggered fade-up (60ms delay each)
- **Category Sections:** Staggered by group
- **Sidebar:** Smooth width transition (400ms)
- **Accordion:** Height + opacity animation (400ms)
- **Buttons:** Scale on hover/tap

### Color Scheme

- **Teal Accent:** `#00BFA5` - Primary actions, highlights
- **Blue Accent:** `#58A6FF` - Secondary elements
- **White Text:** Headings, labels, buttons
- **Light Gray:** Body text (`#E0E0E0`)
- **Muted Gray:** Placeholder, secondary text (`#8B949E`)
- **Dark Background:** Deep space black (`#0D1117`)

---

## 🔐 Security Features

### Encryption

- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 (600,000 iterations)
- **Salt:** Unique per password
- **Nonce:** Unique per encryption

### Passphrase

- **Stored:** Never! Only in memory during session
- **Auto-clear:** After 5 minutes of inactivity
- **Re-prompt:** When needed for decryption
- **Zero-knowledge:** Server never sees plaintext

### Session

- **Auto-login:** NextAuth handles session
- **Logout:** Click logout button in sidebar
- **Session expiry:** Configurable in auth settings

---

## 🛠️ Troubleshooting

### "Cannot decrypt password"

- **Cause:** Passphrase not set or expired
- **Solution:** Click eye icon, enter master passphrase

### "Categories not showing"

- **Cause:** No categories seeded
- **Solution:** Click folder icon → "Add Default Categories"

### "Sidebar not expanding"

- **Cause:** Browser window too narrow
- **Solution:** Widen window or use desktop

### "Search not working"

- **Cause:** API route issue
- **Solution:** Check console for errors, restart dev server

### "Animations choppy"

- **Cause:** Hardware acceleration disabled
- **Solution:** Enable in browser settings

---

## 🎯 Best Practices

### Password Management

1. **Use categories** - Organize by type (Banking, Email, Social, etc.)
2. **Add URLs** - Makes finding passwords faster
3. **Use notes** - Store security questions, recovery codes
4. **Strong passwords** - Use generator for all new passwords
5. **Regular updates** - Change passwords periodically

### Security

1. **Strong master passphrase** - 15+ characters, mix types
2. **Never share** - Master passphrase is your vault key
3. **Logout when done** - Especially on shared devices
4. **Backup strategy** - Export data periodically (future feature)
5. **HTTPS only** - Always use secure connection

### Performance

1. **Limit vault size** - Archive old/unused passwords
2. **Use categories** - Easier to filter and find
3. **Clear search** - Reset filters when done
4. **Close modals** - Free up memory
5. **Restart browser** - If animations slow down

---

## 📊 Keyboard Shortcuts (Future)

Coming soon:
- `Cmd/Ctrl + K` - Quick search
- `Cmd/Ctrl + N` - New password
- `Cmd/Ctrl + G` - Generator
- `Escape` - Close modal/collapse card
- `Tab` - Navigate between fields

---

## 🔮 Roadmap

Planned features:
- [ ] Password strength indicator
- [ ] Breach detection
- [ ] Export/import functionality
- [ ] Browser extension
- [ ] Mobile app
- [ ] 2FA support
- [ ] Team sharing (future)

---

## 📞 Support

### Documentation
- `FRONTEND_OVERHAUL_COMPLETE.md` - Technical details
- `ADD_PASSWORD_MODAL_UPDATE.md` - Modal documentation
- `TESTING_GUIDE.md` - Testing scenarios

### Issues
- Check console for errors
- Review Network tab for API failures
- Clear browser cache if styles broken

### Development
```bash
# Run tests
npm test

# Build production
npm run build

# Start production
npm start

# Lint code
npm run lint
```

---

## ✨ Credits

**Version:** 2.0.0  
**Release Date:** October 6, 2025  
**Design System:** Aegis Dark Glassmorphism  
**Framework:** Next.js 14 + React 18  
**Animations:** Framer Motion  
**State:** React Query  
**Auth:** NextAuth.js  

Built with ❤️ by the Aegis team.

---

**Enjoy your portfolio-grade password manager!** 🎉
