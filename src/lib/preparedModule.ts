/** Share background and interactive imports, without caching failed attempts. */
export function preparedModule<T>(importModule: () => Promise<{ default: T }>) {
  let pending: Promise<{ default: T }> | undefined;
  let component: T | undefined;

  return {
    get: () => component,
    load: () => {
      pending ??= importModule().then(
        (module) => {
          component = module.default;
          return module;
        },
        (error: unknown) => {
          pending = undefined;
          throw error;
        }
      );
      return pending;
    },
  };
}
