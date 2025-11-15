export function isVercelDeployment(): boolean {
  return process.env.VERCEL === '1';
}
