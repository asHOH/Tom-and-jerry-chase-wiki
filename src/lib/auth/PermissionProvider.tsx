'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  canAccess,
  canAccessAll,
  hasPermission,
  type PermissionGrant,
  type PermissionKey,
  type ResourceContext,
} from '@/lib/auth/permissions';
import { useUser } from '@/hooks/useUser';

type PermissionContextValue = {
  grants: PermissionGrant[];
  has: (permission: PermissionKey) => boolean;
  can: (permission: PermissionKey, context?: ResourceContext) => boolean;
  canAll: (permission: PermissionKey, contexts: readonly ResourceContext[]) => boolean;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { grants } = useUser();
  const value = useMemo<PermissionContextValue>(
    () => ({
      grants,
      has: (permission) => hasPermission(grants, permission),
      can: (permission, context) => canAccess(grants, permission, context),
      canAll: (permission, contexts) => canAccessAll(grants, permission, contexts),
    }),
    [grants]
  );
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermissions must be used inside PermissionProvider');
  return context;
}
