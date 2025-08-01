'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  commitSha: string;
  buildTime: string;
  environment: string;
  packageVersion: string;
}

export const VersionDisplay: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const response = await fetch('/api/version', { cache: 'no-cache' });
        if (response.ok) {
          const info: VersionInfo = await response.json();
          setVersionInfo(info);
        }
      } catch {
        // Silently fail - version display is not critical
      }
    };

    loadVersionInfo();
  }, []);

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
    <p className='text-sm text-gray-500 mt-2'>
      版本：{formatVersionTime(versionInfo.buildTime, versionInfo.environment)}
    </p>
  );
};
