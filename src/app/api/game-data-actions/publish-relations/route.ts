import { handleGameDataSubmission } from '@/lib/gameData/submission';

export async function POST(request: Request) {
  return handleGameDataSubmission(request, 'relations');
}
