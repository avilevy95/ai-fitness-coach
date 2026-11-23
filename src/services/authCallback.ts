import { supabase } from './supabaseClient';

export const AUTH_CALLBACK_URL = 'aifitnesscoach://callback';

const pendingCallbacks = new Map<string, Promise<boolean>>();

async function completeCallback(url: string): Promise<boolean> {
  const callbackUrl = AUTH_CALLBACK_URL.replace(/\/$/, '');
  const incomingUrl = url.split(/[?#]/, 1)[0]?.replace(/\/$/, '');
  if (incomingUrl !== callbackUrl) return false;

  const [urlWithoutFragment, fragment] = url.split('#', 2);
  const query = urlWithoutFragment?.split('?')[1];
  const params = new URLSearchParams([query, fragment].filter(Boolean).join('&'));
  if (params.has('error')) {
    throw new Error(params.get('error_description') ?? 'האימות נכשל.');
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    throw new Error('לא התקבלו פרטי התחברות תקינים.');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  return true;
}

export function completeAuthCallback(url: string): Promise<boolean> {
  const pending = pendingCallbacks.get(url);
  if (pending) return pending;

  const completion = completeCallback(url);
  pendingCallbacks.set(url, completion);
  const clearPending = () => {
    pendingCallbacks.delete(url);
  };
  void completion.then(clearPending, clearPending);
  return completion;
}
