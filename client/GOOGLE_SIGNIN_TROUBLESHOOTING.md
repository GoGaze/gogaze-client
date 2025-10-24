# Google Sign-In Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Failed to sign in with Google"

This error can occur for several reasons. Follow these steps to resolve it:

---

## ✅ **Step 1: Enable Google Sign-In in Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **gogaze-813e0**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Google** in the list of providers
5. Click on **Google** and toggle it to **Enable**
6. Add a **Project support email** (required)
7. Click **Save**

---

## ✅ **Step 2: Add Authorized Domains**

In Firebase Console → Authentication → Settings → Authorized domains:

Add these domains:
- `localhost` (for development)
- `gogaze-813e0.firebaseapp.com` (your Firebase domain)
- Any custom domain you're using

**For localhost specifically:**
- Make sure you're accessing via `http://localhost:3000` (not 127.0.0.1)
- Some browsers block popups - check your browser settings

---

## ✅ **Step 3: Check Browser Settings**

### Pop-up Blockers
- Ensure pop-ups are allowed for `localhost:3000`
- Chrome: Click the icon in the address bar (🚫) → "Always allow pop-ups"
- Firefox: Preferences → Privacy & Security → Permissions → Pop-ups
- Safari: Preferences → Websites → Pop-up Windows

### Cookies & Third-Party Data
- Make sure cookies are enabled
- Allow third-party cookies (required for Google OAuth)

---

## ✅ **Step 4: Verify Firebase Configuration**

Check your `.env.local` file has correct values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyABZ0voaJe44Bc6RuChsE7Gof_bB7mwV-Y
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gogaze-813e0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gogaze-813e0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gogaze-813e0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=334220011299
NEXT_PUBLIC_FIREBASE_APP_ID=1:334220011299:web:43d3cd87d178b36b00ce96
```

**After changing .env.local:**
- Stop the dev server (Ctrl+C)
- Restart with `npm run dev`

---

## ✅ **Step 5: Check Network/Firewall**

- Make sure you're not behind a restrictive firewall
- VPNs can sometimes interfere with Google OAuth
- Corporate networks may block Google sign-in

---

## 🔍 **Debug Information**

I've updated the login page to show more detailed error messages. Now when you try to sign in with Google, you'll see specific error codes like:

- `auth/popup-blocked` - Pop-up was blocked
- `auth/operation-not-allowed` - Google sign-in not enabled in Firebase
- `auth/unauthorized-domain` - Domain not authorized in Firebase
- `auth/cancelled-popup-request` - Multiple popups attempted

Check your browser's **Developer Console** (F12) for more details:
1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Try Google sign-in again
4. Look for error messages starting with "Google Sign-in Error:"

---

## 🎯 **Most Common Solutions**

### For Development (localhost):
1. **Enable Google Provider in Firebase Console** ⭐ (Most common issue)
2. **Allow pop-ups in your browser**
3. **Use `http://localhost:3000` not `http://127.0.0.1:3000`**
4. **Restart dev server after changing .env.local**

### For Production:
1. **Add your production domain to Firebase authorized domains**
2. **Ensure HTTPS is enabled** (required for production)
3. **Configure OAuth consent screen in Google Cloud Console**

---

## 📱 **Alternative: Use Email/Password Instead**

While debugging Google sign-in, you can use the email/password authentication which should work immediately:

1. Enter your email and password
2. Click "Sign Up" to create an account
3. Or click "Sign In" if you already have an account

This method doesn't require any additional Firebase configuration.

---

## 🆘 **Still Having Issues?**

If you're still seeing errors, please share:
1. The exact error message from the UI
2. Browser console errors (F12 → Console tab)
3. Which browser you're using
4. Whether you're on localhost or production

I'll help you resolve it! 🚀
