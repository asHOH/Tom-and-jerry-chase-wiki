import { isChatGameDataResponse, type ChatGameDataResponse } from './chatGameData';

export async function fetchPublishedChatGameData(): Promise<ChatGameDataResponse> {
  const response = await fetch('/api/chat/game-data', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`加载聊天游戏数据失败 (${response.status})`);
  }

  const body: unknown = await response.json();
  if (!isChatGameDataResponse(body)) {
    throw new Error('聊天游戏数据响应格式无效');
  }
  return body;
}
