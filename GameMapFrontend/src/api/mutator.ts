import axios from 'axios';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export const customInstance = async <T>(
  url: string,
  options?: RequestOptions,
): Promise<T> => {
  const response = await axios({
    baseURL: import.meta.env.VITE_API_URL,
    url,
    method: options?.method,
    params: options?.params,
    data: options?.body,
    headers: options?.headers
      ? Object.fromEntries(
          new Headers(options.headers).entries(),
        )
      : undefined,
    signal: options?.signal,
  });

  return {
    data: response.data,
    status: response.status,
    headers: new Headers(
      Object.entries(response.headers).flatMap(([key, value]) =>
        value == null ? [] : [[key, String(value)]],
      ),
    ),
  } as T;
};