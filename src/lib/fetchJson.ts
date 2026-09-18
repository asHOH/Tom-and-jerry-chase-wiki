export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (response.ok) return response.json();

  const info: unknown = await response.json().catch(() => ({ status: response.status }));
  throw Object.assign(new Error('An error occurred while fetching the data.'), {
    info,
    status: response.status,
  });
}
