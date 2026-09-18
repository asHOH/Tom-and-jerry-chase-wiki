/** @jest-environment node */

import { fetchJson } from './fetchJson';

describe('fetchJson', () => {
  it('returns successful JSON without changing the request or response shape', async () => {
    const data = { categories: [{ id: 'category-1' }] };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(Response.json(data));

    await expect(fetchJson('/api/categories')).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith('/api/categories');
  });

  it.each([401, 403, 404, 429, 500])(
    'rejects HTTP %i with parsed error details',
    async (status) => {
      const info = { error: 'Request failed' };
      jest.spyOn(global, 'fetch').mockResolvedValue(Response.json(info, { status }));

      await expect(fetchJson('/api/articles/article-1/history')).rejects.toMatchObject({
        message: 'An error occurred while fetching the data.',
        status,
        info,
      });
    }
  );

  it('preserves HTTP status when an error response is not JSON', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('Bad gateway', { status: 502 }));

    await expect(fetchJson('/api/articles/pending')).rejects.toMatchObject({
      status: 502,
      info: { status: 502 },
    });
  });

  it('propagates network errors', async () => {
    const error = new TypeError('Failed to fetch');
    jest.spyOn(global, 'fetch').mockRejectedValue(error);

    await expect(fetchJson('/api/categories')).rejects.toBe(error);
  });

  it('rejects malformed JSON in successful responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('not JSON'));

    await expect(fetchJson('/api/categories')).rejects.toThrow();
  });
});
