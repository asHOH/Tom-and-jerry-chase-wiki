import { preparedModule } from '@/lib/preparedModule';

export const searchDialogModule = preparedModule(() => import('./ui/SearchDialog'));
export const editToolbarModule = preparedModule(() => import('./ui/EditModeToolbar'));
export const editRuntimeModule = preparedModule(() => import('./EditRuntime'));

export function prepareEditingOnIntent() {
  void Promise.all([editToolbarModule.load(), editRuntimeModule.load()]).catch((error: unknown) =>
    console.warn('Unable to prepare editing controls:', error)
  );
}
