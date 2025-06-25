'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  commitSha: string;
  buildTime: string;
  timestamp: string;
  environment: 'vercel' | 'ci' | 'development';
  generatedAt: string;
}

export const VersionDisplay: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const response = await fetch('/version.json', { cache: 'no-cache' });
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
  // Format the version to show date and time in Chinese format
  const formatVersion = (version: string) => {
    // Extract timestamp from version (e.g., "dev-20250624174942" or "v20250625-abcd1234")
    const timestampMatch = version.match(/(\d{8,14})/);
    if (timestampMatch && timestampMatch[1]) {
      const timestamp = timestampMatch[1];

      // Parse timestamp: YYYYMMDDHHMMSS or YYYYMMDD
      const month = timestamp.slice(4, 6);
      const day = timestamp.slice(6, 8);
      const hour = timestamp.slice(8, 10) || '00';
      const minute = timestamp.slice(10, 12) || '00';

      return `${parseInt(month)}月${parseInt(day)}日 ${hour}:${minute}`;
    }

    // Fallback to showing the version as-is
    return version;
  };

  return <p className='text-sm text-gray-500 mt-2'>版本：{formatVersion(versionInfo.version)}</p>;
};
