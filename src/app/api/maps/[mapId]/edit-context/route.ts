import {
  readSceneMap,
  sceneMapOptions,
  type SceneMapRouteContext,
} from '@/lib/gameData/sceneMapApi';

export const dynamic = 'force-dynamic';
export const OPTIONS = sceneMapOptions;
export async function GET(request: Request, context: SceneMapRouteContext) {
  return readSceneMap(request, context, true);
}
