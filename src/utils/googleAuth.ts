/**
 * BillionBiz Google Identity Services (GIS) Helper
 *
 * Implements Google One Tap & OAuth 2.0 Credential flow with zero external secret exposure.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
            }
          ) => void;
        };
      };
    };
  }
}

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '176816617327-338f5b96d37nc5sk6oafeck405sfu9qc.apps.googleusercontent.com';

let scriptLoadingPromise: Promise<void> | null = null;

export function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById('google-gsi-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  return scriptLoadingPromise;
}

export async function initiateGoogleSignIn(
  onSuccess: (credential: string) => void,
  onError: (errorMessage: string) => void
): Promise<void> {
  try {
    await loadGoogleScript();

    if (!window.google?.accounts?.id) {
      onError('Google Identity Services SDK could not be initialized.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res) => {
        if (res.credential) {
          onSuccess(res.credential);
        } else {
          onError('Google Sign-In was cancelled or did not return credentials.');
        }
      },
      cancel_on_tap_outside: true
    });

    // Prompt user with Google One-Tap / Account Chooser
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: If One Tap is suppressed (e.g. in test or cookies disabled),
        // we provide a popup fallback or notify user
        console.warn('[Google Auth] Prompt not displayed:', notification.getNotDisplayedReason());
      }
    });
  } catch (err: any) {
    console.error('[Google Auth Error]', err);
    onError(err.message || 'Google authentication encountered an unexpected error.');
  }
}

