'use client';

import useSWR from 'swr';

interface VersionInfo {
  version: string;
  commitSha: string;
  buildTime: string;
  environment: string;
  packageVersion: string;
}

async function fetcher(url: string): Promise<VersionInfo> {
  return await (await fetch(url, { cache: 'no-cache' })).json();
}

export const VersionDisplay: React.FC = () => {
  const { data: versionInfo } = useSWR('/api/version', fetcher);

  if (!versionInfo) return null;

  const formatVersionTime = (buildTime: string, environment: string) => {
    try {
      const date = new Date(buildTime);
      const month = date.getMonth() + 1;
      const day = date.getDate();

      if (environment === 'development' || environment === 'preview') {
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${month}月${day}日 ${hour}:${minute}`;
      } else {
        return `${month}月${day}日`;
      }
    } catch {
      // Fallback to showing the version string
      return versionInfo.version;
    }
  };

  return (
    <p className='mt-2 text-sm text-gray-500'>
      版本：{formatVersionTime(versionInfo.buildTime, versionInfo.environment)}
    </p>
  );
};
