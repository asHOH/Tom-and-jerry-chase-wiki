import {
  sceneMapOptions,
  submitSceneMap,
  type SceneMapRouteContext,
} from '@/lib/gameData/sceneMapApi';

export const dynamic = 'force-dynamic';
export const OPTIONS = sceneMapOptions;
export async function POST(request: Request, context: SceneMapRouteContext) {
  return submitSceneMap(request, context);
}
