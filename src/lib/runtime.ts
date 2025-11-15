type NextRuntime = 'edge' | 'nodejs';

const runtimeEnvCandidates = [
  process.env.NEXT_RUNTIME,
  process.env.NEXT_RUNTIME_API,
  process.env.NEXT_API_RUNTIME,
  process.env.RUNTIME,
];

const normalizeRuntime = (value?: string | null): NextRuntime | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'edge' || normalized === 'nodejs') {
    return normalized;
  }
  return undefined;
};

const explicitRuntime = runtimeEnvCandidates.map(normalizeRuntime).find(Boolean);

const defaultRuntime: NextRuntime = process.env.VERCEL === '1' ? 'edge' : 'nodejs';

export const apiRouteRuntime: NextRuntime = explicitRuntime ?? defaultRuntime;
