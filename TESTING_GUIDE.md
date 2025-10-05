# 🧪 Testing Guide - Add Password Modal Redesign

## 🚀 Quick Start

1. **Start the dev server:**
   ```powershell
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:3000/vault
   ```

---

## 📝 Test Scenarios

### ✅ **Test 1: Category Dropdown Functionality**

**Steps:**
1. Click the **"+ Add New"** button on the vault dashboard
2. Modal should open with scale-up animation
3. Click the **"Category"** dropdown

**Expected Results:**
- ✅ Dropdown shows "Loading categories..." briefly (if categories not cached)
- ✅ Dropdown populates with categories
- ✅ Each category name is clearly visible
- ✅ Selecting a category updates the form state

**If Dropdown is Empty:**
1. Close the modal
2. Click the **folder icon (⚙️)** next to "+ Add New"
3. In the Category Manager, click **"Add Default Categories"**
4. Wait for success toast
5. Close modal and try again

**Debug Checklist:**
- [ ] Categories API endpoint is accessible
- [ ] React Query is fetching data
- [ ] Modal's `open` prop is true
- [ ] Categories array is not undefined

---

### ✅ **Test 2: Seed Default Categories**

**Steps:**
1. Click the **folder icon (⚙️)** to open "Manage Categories"
2. If categories list is empty, click **"Add Default Categories"**
3. Wait for the operation to complete

**Expected Results:**
- ✅ 9 categories are created
- ✅ Success toast appears
- ✅ Each category displays with an icon
- ✅ Icons match category types:
  - 🌐 **Web Logins** (Globe)
  - 🏛️ **Bank Accounts** (Building)
  - 💳 **Credit Cards** (Credit Card)
  - 📧 **Email Accounts** (Mail)
  - 📱 **Social Media Accounts** (At Sign)
  - 🛡️ **Identity Documents** (Shield)
  - 📶 **Wifi Passwords** (Wifi)
  - 📄 **Notes** (File Text)
  - 📂 **Others** (Folder)

**If Seed Fails:**
- ✅ Check if user already has categories (409 conflict error)
- ✅ Delete existing categories first, then seed
- ✅ Check MongoDB connection

---

### ✅ **Test 3: New Two-Column Layout**

**Steps:**
1. Open the Add Password modal
2. Resize browser window from mobile → tablet → desktop

**Expected Results (Desktop - md breakpoint+):**
```
Row 1: [Title Field    ] [Category Dropdown]
Row 2: [Username Field ] [Email Field      ]
Row 3: [Password Field ] [URL Field        ]
Row 4: [Notes Textarea (full width)        ]
```

**Expected Results (Mobile - below md breakpoint):**
```
[Title Field        ]
[Category Dropdown  ]
[Username Field     ]
[Email Field        ]
[Password Field     ]
[URL Field          ]
[Notes Textarea     ]
```

**Visual Checks:**
- [ ] Fields are not overlapping
- [ ] Spacing is consistent
- [ ] Labels are aligned
- [ ] Icons are visible

---

### ✅ **Test 4: Password Show/Hide Toggle**

**Steps:**
1. Open Add Password modal
2. Type a password in the **Password** field
3. Click the **eye icon** on the right side of the password field

**Expected Results:**
- ✅ Password text becomes visible
- ✅ Eye icon changes to **EyeOff** icon
- ✅ Clicking again hides the password
- ✅ Icon color changes on hover (teal accent)

**Edge Cases:**
- [ ] Toggle works with empty field
- [ ] Toggle works with long passwords
- [ ] Icon is not overlapping with input text

---

### ✅ **Test 5: Focus States & Animations**

**Steps:**
1. Open Add Password modal
2. Tab through all form fields (or click each one)
3. Observe icon color changes

**Expected Results:**
- ✅ Icons change from muted gray to **teal** on focus
- ✅ Smooth color transition (no flicker)
- ✅ Focus outline visible on inputs
- ✅ Cursor changes to pointer on select dropdown

**Animation Checks:**
- [ ] Modal scales up smoothly (0.9 → 1.0)
- [ ] Backdrop fades in
- [ ] Buttons have hover lift effect
- [ ] Close button rotates 90° on hover

---

### ✅ **Test 6: Form Validation**

**Test 6.1: Submit Empty Form**
1. Open modal
2. Click **"Add Password"** without filling anything

**Expected:**
- ✅ Error toast: "Please enter a title"

**Test 6.2: Missing Password**
1. Fill **Title**: "Test"
2. Select **Category**
3. Leave **Password** empty
4. Click submit

**Expected:**
- ✅ Error toast: "Please enter a password"

**Test 6.3: Missing Category**
1. Fill **Title**: "Test"
2. Fill **Password**: "test123"
3. Leave **Category** unselected
4. Click submit

**Expected:**
- ✅ Error toast: "Please select a category"

**Test 6.4: Valid Submission**
1. Fill **Title**: "GitHub"
2. Select **Category**: "Web Logins"
3. Fill **Username**: "myusername"
4. Fill **Password**: "SecurePass123!"
5. Click submit

**Expected:**
- ✅ Passphrase modal appears (if first time)
- ✅ Submit button shows "Encrypting..." with spinning sparkles
- ✅ Success toast appears
- ✅ Modal closes
- ✅ New password card appears in vault grid

---

### ✅ **Test 7: Loading States**

**Steps:**
1. Open Add Password modal while **not connected to API**
2. Observe category dropdown

**Expected Results:**
- ✅ Dropdown shows "Loading categories..."
- ✅ Dropdown is disabled while loading
- ✅ No error if loading takes time

**Steps (Submit Loading):**
1. Fill form completely
2. Click **"Add Password"**
3. Observe submit button

**Expected Results:**
- ✅ Button text changes to "Encrypting..."
- ✅ Sparkles icon spins continuously
- ✅ Button is disabled (opacity 50%, cursor not-allowed)
- ✅ Can't click button again

---

### ✅ **Test 8: Category Icons in Manage Modal**

**Steps:**
1. Click folder icon (⚙️) to open "Manage Categories"
2. Ensure you have categories (seed if needed)
3. Observe each category in the list

**Expected Results:**
- ✅ Each category shows an icon on the left
- ✅ Icon is inside a gradient background (teal/blue)
- ✅ Icon matches the category type
- ✅ Icons are colorful and visible

**Icon Mapping:**
```
web-logins           → 🌐 Globe
bank-accounts        → 🏛️ Building2
credit-cards         → 💳 CreditCard
email-accounts       → 📧 Mail
social-media-accounts→ 📱 AtSign
identity-documents   → 🛡️ Shield
wifi-passwords       → 📶 Wifi
notes                → 📄 FileText
others               → 📂 FolderOpen
```

---

### ✅ **Test 9: End-to-End Password Flow**

**Complete Flow:**
1. **Seed categories** (if first time)
2. Click **"+ Add New"**
3. Fill form:
   - Title: "Netflix"
   - Category: "Web Logins"
   - Username: "user@email.com"
   - Email: "user@email.com"
   - Password: "MyNetflixPass123!"
   - URL: "https://netflix.com"
   - Notes: "Premium account"
4. Click **"Add Password"**
5. Enter **master passphrase** (if prompted)
6. Wait for success

**Expected Results:**
- ✅ Success toast appears
- ✅ Modal closes
- ✅ New "Netflix" card appears in vault
- ✅ Card shows:
  - Title: "Netflix"
  - Username: "user@email.com"
  - Category badge: "Web Logins"
  - Globe icon for category
- ✅ Can click "Show Password" to decrypt
- ✅ Can copy password to clipboard

---

### ✅ **Test 10: Responsive Design**

**Breakpoint Tests:**

**Mobile (< 768px):**
- [ ] Single column layout
- [ ] Fields stack vertically
- [ ] Modal padding adjusts
- [ ] Buttons are full width

**Tablet (768px - 1024px):**
- [ ] Two-column grid active
- [ ] Fields side-by-side
- [ ] Modal fits comfortably
- [ ] No horizontal scrolling

**Desktop (> 1024px):**
- [ ] Two-column grid active
- [ ] Modal max-width enforced (2xl = 672px)
- [ ] Centered on screen
- [ ] Backdrop visible on all sides

---

## 🐛 Known Issues & Solutions

### Issue 1: Dropdown Still Empty
**Cause:** Categories not created yet
**Solution:** Use "Add Default Categories" button

### Issue 2: "Loading categories..." Forever
**Cause:** API endpoint not responding
**Solution:** Check MongoDB connection and Next.js server

### Issue 3: Icons Not Showing
**Cause:** Slug mismatch or icon not imported
**Solution:** Verify `categoryIcon` mapping in `constants/category-icon.ts`

### Issue 4: Form Won't Submit
**Cause:** Validation failing or mutation error
**Solution:** Check browser console for errors, verify all required fields filled

### Issue 5: Passphrase Modal Not Appearing
**Cause:** PassphraseProvider not wrapping app
**Solution:** Verify `app/layout.tsx` has `<PassphraseProvider>` wrapper

---

## ✅ Success Checklist

After testing, verify:

- [ ] Category dropdown populates correctly
- [ ] All 9 categories appear with proper names
- [ ] Category icons display in manage modal
- [ ] Two-column layout works on desktop
- [ ] Single-column layout works on mobile
- [ ] Password show/hide toggle functions
- [ ] Form validation catches empty fields
- [ ] Encryption happens client-side (check Network tab)
- [ ] Success toast appears on submit
- [ ] Modal closes after success
- [ ] New password appears in vault
- [ ] Focus states change icon colors
- [ ] Loading states display correctly
- [ ] Animations are smooth (60fps)
- [ ] No console errors
- [ ] No visual glitches

---

## 📊 Performance Metrics

**Target Performance:**
- Modal open animation: < 300ms
- Category fetch: < 500ms
- Form submission: < 2s (including encryption)
- Icon rendering: < 100ms

**Check in DevTools:**
1. Open React DevTools → Profiler
2. Record interaction
3. Verify no unnecessary re-renders
4. Check React Query cache hits

---

## 🎯 Acceptance Criteria

✅ **Functional:**
- Dropdown works and populates
- Form submits successfully
- Encryption happens client-side
- Categories are created correctly

✅ **Visual:**
- Layout matches design spec
- Icons are visible and correct
- Colors match Aegis theme
- Spacing is consistent

✅ **UX:**
- Smooth animations
- Clear feedback (toasts, loading states)
- Responsive across devices
- Accessible (keyboard navigation works)

✅ **Technical:**
- No TypeScript errors
- No runtime errors
- React Query caching works
- Data syncs across modals

---

**All tests passing? 🎉 The modal is ready for production!**
