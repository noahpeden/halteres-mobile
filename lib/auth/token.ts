export type AuthTokenProvider = () => Promise<string | null>;

let providerRef: AuthTokenProvider | null = null;

export function setAuthTokenProvider(provider: AuthTokenProvider) {
  providerRef = provider;
}

export async function getAuthToken(): Promise<string | null> {
  if (!providerRef) return null;
  try {
    return await providerRef();
  } catch {
    return null;
  }
}

