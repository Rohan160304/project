import { PermissionAction, RoleKey } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';

export type PermissionMap = Record<string, PermissionAction[]>;

export interface EffectivePermissions {
  role: RoleKey;
  isSuperAdmin: boolean;
  organizationIds: string[];
  permissions: PermissionMap; // module -> allowed actions, global (role defaults)
  organizationOverrides: Record<string, PermissionMap>; // organizationId -> module -> actions
}

/**
 * Configurable Permission Engine (§3).
 *
 * Effective permission for (user, organization, module, action) =
 *   role default (RolePermission)
 *   overridden by any UserPermissionOverride scoped to that organization
 *   overridden by any UserPermissionOverride with organizationId = null (global override for that user)
 *
 * Super Admin bypasses all checks (module/action always allowed, and is not
 * scoped to any single organization — full cross-tenant access).
 */
export async function loadEffectivePermissions(userId: string): Promise<EffectivePermissions> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Deactivating an account (e.g. Super Admin toggling an Admin to INACTIVE)
  // must revoke access on the very next request, not just block future logins
  // — otherwise an already-issued access token keeps working until it expires.
  if (['INACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'].includes(user.status)) {
    throw ApiError.forbidden(`Account is ${user.status.toLowerCase()}. Contact support.`);
  }

  const isSuperAdmin = user.primaryRoleKey === 'SUPER_ADMIN';

  const [rolePerms, overrides, userOrgs, staff] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { role: { key: user.primaryRoleKey }, allowed: true },
    }),
    prisma.userPermissionOverride.findMany({ where: { userId } }),
    prisma.userOrganization.findMany({ where: { userId } }),
    prisma.staff.findUnique({ where: { userId }, include: { permissions: true } }),
  ]);

  const permissions: PermissionMap = {};

  // Cascading tab-access: once an Admin/Staff has explicitly assigned this
  // staff member module grants (via PATCH /staff/:staffId/permissions or at
  // creation), those per-staff grants become authoritative and REPLACE the
  // shared 'STAFF'-role defaults entirely — this is what lets an Admin give
  // different staff members access to different tabs. Staff with no explicit
  // grants configured yet keep falling back to the role defaults below so
  // existing accounts aren't silently locked out the moment this ships.
  if (staff && staff.permissions.length > 0) {
    for (const p of staff.permissions) {
      permissions[p.module] = (p.actions as unknown as PermissionAction[]) ?? [];
    }
  } else {
    for (const rp of rolePerms) {
      const list = permissions[rp.module] ?? [];
      if (!list.includes(rp.action)) list.push(rp.action);
      permissions[rp.module] = list;
    }
  }

  const organizationOverrides: Record<string, PermissionMap> = {};
  for (const ov of overrides) {
    const bucket = ov.organizationId ?? '__global__';
    const bucketMap: PermissionMap = organizationOverrides[bucket] ?? {};
    const list = bucketMap[ov.module] ?? [];
    const has = list.includes(ov.action);
    const updatedList = ov.allowed && !has ? [...list, ov.action] : !ov.allowed && has ? list.filter((a) => a !== ov.action) : list;
    bucketMap[ov.module] = updatedList;
    organizationOverrides[bucket] = bucketMap;
  }

  return {
    role: user.primaryRoleKey,
    isSuperAdmin,
    organizationIds: userOrgs.map((o) => o.organizationId),
    permissions,
    organizationOverrides,
  };
}

export function isActionAllowed(
  effective: EffectivePermissions,
  module: string,
  action: PermissionAction,
  organizationId?: string,
): boolean {
  if (effective.isSuperAdmin) return true;

  const globalOverride = effective.organizationOverrides.__global__?.[module];
  if (globalOverride) return globalOverride.includes(action);

  if (organizationId) {
    const orgOverride = effective.organizationOverrides[organizationId]?.[module];
    if (orgOverride) return orgOverride.includes(action);
  }

  return effective.permissions[module]?.includes(action) ?? false;
}

/** DELETE is Super Admin only, everywhere (§3) — enforced independent of stored permission rows. */
export function assertNotDeleteUnlessSuperAdmin(effective: EffectivePermissions, action: PermissionAction) {
  if (action === 'DELETE' && !effective.isSuperAdmin) {
    return false;
  }
  return true;
}

/** Merges the raw role/staff permission matrix with the __global__ override
 *  bucket so `effectivePermissionsMap()[module]` = the ACTUAL actions this
 *  user may perform, not just the ones role defaults imply. Called by
 *  /me/modules so client-side `canDo(module, action)` matches the server's
 *  `isActionAllowed(...)` decision. */
export function effectivePermissionsMap(effective: EffectivePermissions): Record<string, PermissionAction[]> {
  if (effective.isSuperAdmin) {
    // SA holds every module × every action.
    const out: Record<string, PermissionAction[]> = {};
    for (const module of Object.keys(effective.permissions)) {
      out[module] = [...(effective.permissions[module] || [])];
    }
    return out;
  }

  const out: Record<string, PermissionAction[]> = {};
  // Start from role/staff defaults, then apply the global override bucket.
  for (const [module, actions] of Object.entries(effective.permissions)) {
    out[module] = [...(actions || [])];
  }
  const globalBucket = effective.organizationOverrides.__global__ || {};
  for (const [module, overrideActions] of Object.entries(globalBucket)) {
    // An override with an empty action list is an explicit revoke.
    if (!overrideActions || overrideActions.length === 0) {
      delete out[module];
    } else {
      out[module] = [...overrideActions];
    }
  }
  return out;
}

/** Returns the module keys a user currently has any permission on — powers GET /me/modules.
 *  Respects both directions of overrides:
 *   - adds modules that only exist via override
 *   - REMOVES modules that role defaults granted but override has denied
 *     (empty action list means "revoked at this scope")
 *  Without the subtract half, an SA who unticks Volunteers in an admin's
 *  Tab Access dialog wrote allowed=false rows but the sidebar still saw
 *  Volunteers from the role default. */
export function listAssignedModules(effective: EffectivePermissions): string[] {
  if (effective.isSuperAdmin) return ['*'];
  const modules = new Set<string>(Object.keys(effective.permissions));

  // Union role-default modules with any override buckets that grant actions.
  for (const bucket of Object.values(effective.organizationOverrides)) {
    for (const [module, actions] of Object.entries(bucket)) {
      if (actions.length > 0) modules.add(module);
    }
  }

  // Global overrides (bucket = __global__) with an empty action list mean the
  // module was explicitly revoked. Remove those from the returned set so the
  // sidebar hides the tab. Per-org denies are left alone; scoping still lets
  // an admin view the tab elsewhere.
  const globalBucket = effective.organizationOverrides.__global__ || {};
  for (const [module, actions] of Object.entries(globalBucket)) {
    if (actions.length === 0) modules.delete(module);
  }

  return Array.from(modules);
}

/**
 * Cascading tab-access enforcement (§4.1/4.2): an Admin or Staff member may
 * only grant another user (a Staff account they create, or a sub-staff a
 * Staff account creates) access to a module/action they themselves currently
 * hold. Super Admin is unrestricted. Throws ApiError.forbidden listing the
 * first violation if the actor tries to grant something outside their own
 * effective permissions.
 */
export function assertGrantWithinActorPermissions(
  actorEffective: EffectivePermissions,
  requestedGrants: { module: string; actions: string[] }[],
  organizationId?: string,
): void {
  if (actorEffective.isSuperAdmin) return;

  for (const { module, actions } of requestedGrants) {
    const disallowed = actions.filter(
      (action) => !isActionAllowed(actorEffective, module, action as PermissionAction, organizationId),
    );
    if (disallowed.length > 0) {
      throw ApiError.forbidden(
        `You cannot grant "${module}" action(s) [${disallowed.join(', ')}] — you do not have that access yourself`,
      );
    }
  }
}
