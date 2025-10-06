# 🧪 Salt Lifecycle - Comprehensive Test Plan

## 🎯 Test Objectives

1. ✅ Verify new users can register and decrypt passwords
2. ✅ Verify existing users can still decrypt (if they have salt)
3. ✅ Verify error handling for edge cases
4. ✅ Verify session persistence and auto-lock

---

## 🚀 Pre-Test Setup

### **Environment Check:**
```powershell
# 1. Start dev server
pnpm dev

# 2. Open browser
# Navigate to: http://localhost:3000

# 3. Open DevTools
# F12 → Console tab
```

### **Database Check:**
```javascript
// In MongoDB client or shell
db.users.findOne() // Should have encryptionSalt field
```

---

## 📋 Test Suite

### **TEST 1: New User Registration & Decryption** ⭐ CRITICAL

**Priority:** 🔥 Highest  
**Duration:** 3 minutes  
**Why:** This was the broken flow

#### Steps:

1. **Navigate to Sign Up:**
   - Go to `/sign-up`

2. **Create New Account:**
   ```
   Email: test-$(date)@example.com
   Username: testuser-$(random)
   Password: SecurePass123!
   ```
   - Click "Sign Up"

3. **Verify Registration Success:**
   - ✅ Should redirect to `/dashboard`
   - ✅ No errors in console

4. **Check Database:**
   ```javascript
   db.users.findOne({ email: "test-...@example.com" })
   ```
   - ✅ Should have: `encryptionSalt: "base64string..."`
   - ✅ Salt should be ~24 characters (16 bytes base64)

5. **Add a Test Password:**
   - Navigate to `/vault`
   - Click "Add Password"
   - Fill form:
     ```
     Website: GitHub
     Username: testuser
     Password: MySecret123
     URL: github.com
     ```
   - Click "Save"
   - ✅ Should show passphrase modal
   - ✅ Enter: `SecurePass123!` (same as signup password)
   - ✅ Should save successfully

6. **Decrypt Password:**
   - Click eye icon on the password card
   - ✅ Should show passphrase modal
   - ✅ Enter: `SecurePass123!`
   - ✅ Should show: "Vault unlocked successfully" ✅
   - ✅ Password should decrypt: "MySecret123" ✅

7. **Verify Session Unlock:**
   - Click eye on another password (or same one)
   - ✅ Should decrypt **immediately** (no modal)
   - ✅ Should not ask for passphrase again

**Expected Result:** ✅ All steps pass  
**If Fails:** 🚨 CRITICAL BUG - Check console for salt errors

---

### **TEST 2: Existing User Login & Decryption**

**Priority:** 🔥 High  
**Duration:** 2 minutes

#### Steps:

1. **Log out** (if logged in)

2. **Log in with existing account:**
   - Email/Username: (your existing account)
   - Password: (your actual password)

3. **Navigate to `/vault`**

4. **Click eye icon on existing password:**
   - ✅ Should show passphrase modal
   - Enter your master passphrase
   - ✅ Should unlock vault
   - ✅ Password should decrypt

5. **Check Session Storage:**
   - DevTools → Application → Session Storage
   - Find NextAuth session token
   - ✅ Should contain: `session.user.encryptionSalt`

**Expected Result:** ✅ Existing users work normally  
**If Fails:** 🚨 Check if user has encryptionSalt in DB

---

### **TEST 3: Guard Clause - Missing Salt**

**Priority:** 🟡 Medium  
**Duration:** 2 minutes  
**Why:** Tests error handling

#### Steps:

1. **Simulate missing salt:**
   - Log in normally
   - Open DevTools Console
   - Run:
     ```javascript
     // Get current session
     const session = JSON.parse(sessionStorage.getItem('next-auth.session-token'));
     // Remove salt
     delete session.user.encryptionSalt;
     // Save back
     sessionStorage.setItem('next-auth.session-token', JSON.stringify(session));
     ```

2. **Try to unlock vault:**
   - Navigate to `/vault`
   - Click eye icon
   - Enter passphrase

3. **Verify error handling:**
   - ✅ Should show toast: "Encryption salt missing. Please log out and log back in."
   - ✅ Should show console error: `[VaultProvider] encryptionSalt not found`
   - ✅ Should NOT crash the app

**Expected Result:** ✅ Graceful error with user guidance  
**If Fails:** 🚨 Guard clause not working

---

### **TEST 4: Guard Clause - Invalid Salt Format**

**Priority:** 🟡 Medium  
**Duration:** 2 minutes

#### Steps:

1. **Simulate corrupted salt:**
   - Log in normally
   - Open DevTools Console
   - Run:
     ```javascript
     const session = JSON.parse(sessionStorage.getItem('next-auth.session-token'));
     session.user.encryptionSalt = "invalid!!!not-base64";
     sessionStorage.setItem('next-auth.session-token', JSON.stringify(session));
     ```

2. **Try to unlock vault:**
   - Click eye icon
   - Enter passphrase

3. **Verify error handling:**
   - ✅ Should show toast: "Invalid encryption salt format. Please contact support."
   - ✅ Should show console error: `[VaultProvider] Failed to decode encryptionSalt`
   - ✅ Should NOT crash the app

**Expected Result:** ✅ Graceful error with support guidance  
**If Fails:** 🚨 Base64 validation not working

---

### **TEST 5: Session Persistence**

**Priority:** 🟢 Low  
**Duration:** 2 minutes

#### Steps:

1. **Log in and unlock vault:**
   - Navigate to `/vault`
   - Unlock vault with passphrase

2. **Navigate away:**
   - Go to `/dashboard`
   - Wait 5 seconds
   - Go back to `/vault`

3. **Try to view password:**
   - Click eye icon
   - ✅ Should decrypt **immediately** (no modal)
   - ✅ Vault should still be unlocked

**Expected Result:** ✅ Session key persists across navigation  
**If Fails:** 🚨 VaultProvider state not persisting

---

### **TEST 6: Auto-Lock Timer**

**Priority:** 🟢 Low  
**Duration:** 16 minutes (or reduce timer for testing)

#### Steps:

**Option A: Full Test (15 min)**
1. Unlock vault
2. Don't interact with page for 15 minutes
3. Try to view password
4. ✅ Should show modal (vault auto-locked)

**Option B: Fast Test (1 min)**
1. Edit `VaultProvider.tsx`:
   ```typescript
   const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 1 minute
   ```
2. Unlock vault
3. Wait 1 minute without interaction
4. Try to view password
5. ✅ Should show modal (vault auto-locked)
6. ✅ Should show toast: "Vault locked for security"

**Expected Result:** ✅ Auto-lock works correctly  
**If Fails:** 🚨 Timer not working

---

### **TEST 7: Activity Reset**

**Priority:** 🟢 Low  
**Duration:** 2 minutes

#### Steps:

1. **Unlock vault**

2. **Interact with page periodically:**
   - Click anywhere
   - Type something
   - Scroll
   - Every 30 seconds for 2 minutes

3. **Try to view password:**
   - ✅ Should still be unlocked (timer reset by activity)

**Expected Result:** ✅ Timer resets on user activity  
**If Fails:** 🚨 Activity detection not working

---

### **TEST 8: Manual Lock Button**

**Priority:** 🟢 Low  
**Duration:** 1 minute

#### Steps:

1. **Unlock vault:**
   - Navigate to `/vault`
   - Unlock with passphrase

2. **Verify lock button visible:**
   - Look at sidebar
   - ✅ Should see "Lock Vault" button with lock icon

3. **Click lock button:**
   - ✅ Should show toast: "Vault locked for security"
   - ✅ Lock button should disappear

4. **Try to view password:**
   - Click eye icon
   - ✅ Should show passphrase modal (vault locked)

**Expected Result:** ✅ Manual lock works correctly  
**If Fails:** 🚨 Lock button not working

---

### **TEST 9: Incorrect Passphrase**

**Priority:** 🟡 Medium  
**Duration:** 1 minute

#### Steps:

1. **Lock vault** (or start fresh)

2. **Try to unlock with wrong passphrase:**
   - Click eye icon
   - Enter: `WrongPassword123!`
   - ✅ Should show error: "Incorrect passphrase. Please try again."
   - ✅ Vault should remain locked

3. **Enter correct passphrase:**
   - Click eye icon again
   - Enter correct passphrase
   - ✅ Should unlock successfully

**Expected Result:** ✅ Wrong passphrase rejected, correct accepted  
**If Fails:** 🚨 Passphrase validation not working

---

### **TEST 10: Multiple Passwords**

**Priority:** 🟡 Medium  
**Duration:** 3 minutes

#### Steps:

1. **Add multiple passwords:**
   - Add 3-5 different passwords
   - Each one should trigger passphrase modal if locked

2. **Unlock vault once:**
   - Click eye on first password
   - Enter passphrase
   - ✅ First password decrypts

3. **Decrypt remaining passwords:**
   - Click eye on second password
   - ✅ Should decrypt **immediately** (no modal)
   - Click eye on third password
   - ✅ Should decrypt **immediately** (no modal)

**Expected Result:** ✅ Session key works for all passwords  
**If Fails:** 🚨 Session key not persisting between operations

---

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. New User Registration | ⏳ | CRITICAL - Must pass |
| 2. Existing User Login | ⏳ | High priority |
| 3. Missing Salt Guard | ⏳ | Error handling |
| 4. Invalid Salt Guard | ⏳ | Error handling |
| 5. Session Persistence | ⏳ | UX |
| 6. Auto-Lock Timer | ⏳ | Security |
| 7. Activity Reset | ⏳ | UX |
| 8. Manual Lock Button | ⏳ | Security |
| 9. Incorrect Passphrase | ⏳ | Security |
| 10. Multiple Passwords | ⏳ | Performance |

---

## 🐛 If Tests Fail

### **Test 1 Fails (New User Registration):**

**Check:**
1. Console for errors
2. Database for encryptionSalt field
3. Network tab for API responses

**Fix:**
- Verify `app/api/auth/register/route.ts` has salt generation
- Verify Prisma schema has encryptionSalt field
- Run `npx prisma generate` and restart server

---

### **Test 2 Fails (Existing User Login):**

**Check:**
1. User's encryptionSalt in database
2. Session storage for salt

**Fix:**
- Run migration to add salt to existing users:
  ```typescript
  const users = await prisma.user.findMany({ 
    where: { encryptionSalt: null } 
  });
  for (const user of users) {
    const salt = randomBytes(16).toString('base64');
    await prisma.user.update({
      where: { id: user.id },
      data: { encryptionSalt: salt }
    });
  }
  ```

---

### **Test 3-4 Fail (Guard Clauses):**

**Check:**
- VaultProvider.tsx has all guard clauses
- Console errors appear

**Fix:**
- Verify guard clauses in `unlockVault()` function
- Check toast notifications are displayed

---

### **Test 6-8 Fail (Auto-Lock/Timer):**

**Check:**
- Timer logic in VaultProvider
- Event listeners registered

**Fix:**
- Verify `useEffect` hooks in VaultProvider
- Check `INACTIVITY_TIMEOUT` constant

---

## ✅ Success Criteria

**Must Pass:**
- ✅ Test 1 (New User) - 100% required
- ✅ Test 2 (Existing User) - 100% required
- ✅ Test 9 (Wrong Passphrase) - Security critical

**Should Pass:**
- ✅ Test 3-4 (Guard Clauses) - Error handling
- ✅ Test 5 (Session Persistence) - UX
- ✅ Test 10 (Multiple Passwords) - Functionality

**Nice to Pass:**
- ✅ Test 6-8 (Timers/Lock) - Advanced features

---

## 📞 Support Escalation

If critical tests fail after fixes:

1. **Check Recent Changes:**
   - Review all modified files
   - Check git diff

2. **Database Integrity:**
   ```javascript
   db.users.find({ encryptionSalt: null }).count()
   // Should be 0 for new users
   ```

3. **Session Debug:**
   ```javascript
   // In browser console
   console.log(sessionStorage);
   console.log(document.cookie);
   ```

4. **Ask for Help:**
   - Provide console errors
   - Provide database state
   - Provide session storage dump

---

**Test Plan Status:** ✅ Complete  
**Total Tests:** 10  
**Estimated Time:** 30-45 minutes  
**Priority Tests:** 1, 2, 9 (Must pass before production)
