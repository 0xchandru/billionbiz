const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('billionbiz_token');
  const orgId = localStorage.getItem('billionbiz_org_id') || 'org-billionbiz-default';
  const storeId = localStorage.getItem('billionbiz_store_id') || 'store-shoum-default';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-organization-id': orgId,
    'x-store-id': storeId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

