type PublishErrorBody = {
  error?: string;
  message?: string;
  requestId?: string;
};

export function getPublishErrorMessage(body: PublishErrorBody | null, fallback: string): string {
  if (!body?.message) return body?.error || fallback;
  return body.requestId ? `${body.message}（请求编号：${body.requestId}）` : body.message;
}
