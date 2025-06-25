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
  const formatVersion = (version: string, environment: string) => {
    // Extract timestamp from version (e.g., "dev-20250624174942" or "v20250625-abcd1234")
    const timestampMatch = version.match(/(\d{8,14})/);
    if (timestampMatch && timestampMatch[1]) {
      const timestamp = timestampMatch[1];

      // Parse timestamp: YYYYMMDDHHMMSS or YYYYMMDD
      const month = timestamp.slice(4, 6);
      const day = timestamp.slice(6, 8);

      // Only show time in development environment when full timestamp is available
      if (environment === 'development' && timestamp.length >= 12) {
        const hour = timestamp.slice(8, 10);
        const minute = timestamp.slice(10, 12);
        return `${parseInt(month)}月${parseInt(day)}日 ${hour}:${minute}`;
      } else {
        // Production environments or no time info - show date only
        return `${parseInt(month)}月${parseInt(day)}日`;
      }
    }

    // Fallback to showing the version as-is
    return version;
  };

  return (
    <p className='text-sm text-gray-500 mt-2'>
      版本：{formatVersion(versionInfo.version, versionInfo.environment)}
    </p>
  );
};
