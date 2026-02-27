// lib/cookies.ts
// Cookie utility functions for client-side cookie management

const AUTH_TOKEN_COOKIE = 'auth_token';
const AUTH_TOKEN_EXPIRY_DAYS = 7; // Token expires in 7 days

/**
 * Set authentication token in cookie
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + AUTH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  // Build cookie string
  let cookieString = `${AUTH_TOKEN_COOKIE}=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  
  // Only add Secure flag in HTTPS
  if (window.location.protocol === 'https:') {
    cookieString += '; Secure';
  }
  
  document.cookie = cookieString;
}

/**
 * Get authentication token from cookie
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const name = AUTH_TOKEN_COOKIE + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  
  return null;
}

/**
 * Remove authentication token from cookie
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${AUTH_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

