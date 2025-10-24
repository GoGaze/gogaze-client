# GoGaze Client - Authentication Setup

## 🎨 Beautiful Login Page with Firebase & shadcn/ui

A fully-functional, beautiful authentication system built with:
- **Next.js 15** with App Router
- **Firebase Authentication** (Email/Password & Google Sign-in)
- **shadcn/ui** components with Tailwind CSS
- **TypeScript** for type safety

## ✨ Features

### Login Page (`/login`)
- 🎨 **Beautiful gradient UI** with glassmorphism effects
- 📧 **Email/Password authentication** (Sign In & Sign Up)
- 🔐 **Google OAuth integration**
- ⚠️ **Comprehensive error handling** with user-friendly messages
- 🔄 **Loading states** and form validation
- 📱 **Fully responsive** design

### Protected Dashboard (`/`)
- 🔒 **Auto-redirect** to login for unauthenticated users
- 👤 **User profile display** with account information
- 🚪 **Sign out functionality**
- 💎 **Beautiful card layouts** using shadcn/ui components

## 🚀 Getting Started

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Your Firebase configuration is already set up in `.env.local`
   - Make sure your Firebase project has:
     - Email/Password authentication enabled
     - Google sign-in provider configured
     - Authorized domains added (localhost for development)

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Visit the login page**:
   - Open [http://localhost:3000/login](http://localhost:3000/login)
   - Or navigate to [http://localhost:3000](http://localhost:3000) (will auto-redirect to login)

## 📁 Project Structure

```
client/
├── src/app/
│   ├── login/
│   │   └── page.tsx          # Beautiful login page
│   ├── page.tsx               # Protected dashboard
│   └── layout.tsx             # Root layout with AuthProvider
├── components/ui/             # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── label.tsx
├── context/
│   └── AuthContext.tsx        # Firebase auth context
├── lib/
│   ├── firebase.ts            # Firebase initialization
│   └── auth.ts                # Authentication functions
└── .env.local                 # Firebase configuration
```

## 🔑 Authentication Functions

### `lib/auth.ts`
- `signInWithEmail(email, password)` - Email/password sign in
- `signUpWithEmail(email, password)` - Create new account
- `signInWithGoogle()` - Google OAuth sign in
- `signOut()` - Sign out current user

### `context/AuthContext.tsx`
- `useAuth()` hook - Access current user and loading state
- Automatic auth state persistence
- Real-time auth state updates

## 🎨 Design Features

- **Color Scheme**: Dark theme with purple/pink gradients
- **Glassmorphism**: Semi-transparent cards with backdrop blur
- **Smooth Transitions**: All interactions have smooth animations
- **Error Handling**: Beautiful error messages with context
- **Loading States**: Clear feedback during async operations
- **Responsive**: Works perfectly on mobile, tablet, and desktop

## 🔐 Firebase Configuration

The app uses environment variables for Firebase config. Your configuration is stored in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
# ... other config values
```

## 📝 Usage Example

```tsx
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    // User is not authenticated
    return <div>Please log in</div>;
  }
  
  // User is authenticated
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## 🛡️ Security Notes

- Firebase API keys in `.env.local` are safe to expose (they're public)
- Actual security is enforced by Firebase Security Rules
- Make sure to set up proper security rules in Firebase Console
- The `.env.local` file is gitignored by default

## 🎯 Next Steps

1. **Enable Email Verification**: Add email verification flow
2. **Password Reset**: Implement forgot password functionality
3. **User Profile**: Create a user profile page
4. **Social Providers**: Add more OAuth providers (GitHub, Twitter, etc.)
5. **Two-Factor Auth**: Add 2FA for extra security

## 📦 Installed Packages

- `firebase` - Firebase SDK
- `shadcn/ui` - UI components
- `tailwindcss` - Styling
- `next` - Framework
- `react` - UI library

Enjoy your beautiful authentication system! 🚀
