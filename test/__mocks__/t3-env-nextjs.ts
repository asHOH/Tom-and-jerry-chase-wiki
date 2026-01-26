export const createEnv = (config: {
  server?: Record<string, unknown>;
  client?: Record<string, unknown>;
  experimental__runtimeEnv?: Record<string, string | undefined>;
}) => {
  const runtime = config.experimental__runtimeEnv || {};
  const keys = [
    ...(config.server ? Object.keys(config.server) : []),
    ...(config.client ? Object.keys(config.client) : []),
  ];

  const result: Record<string, string | undefined> = {};

  for (const key of keys) {
    if (key in runtime) {
      result[key] = runtime[key];
    } else if (process.env[key] !== undefined) {
      result[key] = process.env[key];
    } else {
      result[key] = undefined;
    }
  }

  return result;
};
