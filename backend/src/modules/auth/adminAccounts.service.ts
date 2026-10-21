import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma, PermissionAction, RoleKey } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { enqueueNotification } from '@/engines/notification/notification.service';
import { MODULES } from '@/config/constants';

const ADMIN_ROLES: RoleKey[] = ['ORG_ADMIN', 'TEMPLE_ADMIN', 'DHARAMSHALA_ADMIN', 'JAIN_CENTER_ADMIN', 'MONK_ADMIN', 'BHOJANSHALA_ADMIN', 'STAFF', 'SECURITY_GUARD', 'EVENT_SCANNER'];

// DELETE stays Super-Admin-only everywhere regardless of stored permissions
// (see assertNotDeleteUnlessSuperAdmin) — no point granting it to an Admin.
const GRANTABLE_ACTIONS: PermissionAction[] = ['VIEW', 'CREATE', 'EDIT', 'APPROVE', 'REJECT'];

/**
 * §5.1: "Admin/staff accounts are NEVER self-registered — created only by Super
 * Admin (admins) ... credentials delivered via notification."
 * §3: "Super Admin dynamically allocates modules/features to every admin ...
 * Create/Delete Admin: Yes (Super Admin) / No (Temple Admin — edit own only)."
 */
export async function createAdminAccount(input: {
  mobile: string;
  password?: string;
  firstName: string;
  lastName?: string;
  role: RoleKey;
  organizationIds: string[];
  createdById: string;
  grantedModules?: string[];
  permissionLevel?: 'READ' | 'READ_WRITE';
}) {
  if (!ADMIN_ROLES.includes(input.role)) throw ApiError.validation({ role: ['Must be one of ' + ADMIN_ROLES.join(', ')] });

  const creator = await prisma.user.findUnique({ where: { id: input.createdById }, select: { primaryRoleKey: true } });
  if (creator?.primaryRoleKey !== 'SUPER_ADMIN') {
    if (!['STAFF', 'SECURITY_GUARD', 'EVENT_SCANNER'].includes(input.role)) {
      throw ApiError.forbidden('You can only delegate specific operational roles like STAFF.');
    }
  }

  const existing = await prisma.user.findUnique({ where: { mobile: input.mobile } });
  if (existing) throw ApiError.conflict('This mobile number is already registered');

  const isCustomPassword = !!input.password;
  const tempPassword = input.password || crypto.randomBytes(6).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        mobile: input.mobile,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        primaryRoleKey: input.role,
        status: 'ACTIVE',
        createdByAdmin: true,
        createdById: input.createdById,
      },
    });

    for (const organizationId of input.organizationIds) {
      await tx.userOrganization.create({
        data: { userId: created.id, organizationId, roleKey: input.role, assignedById: input.createdById },
      });
    }

    return created;
  });

  let modulesToGrant = input.grantedModules;
  if (modulesToGrant === undefined) {
    if (['ORG_ADMIN', 'TEMPLE_ADMIN', 'DHARAMSHALA_ADMIN', 'JAIN_CENTER_ADMIN', 'MONK_ADMIN', 'BHOJANSHALA_ADMIN'].includes(input.role)) {
      modulesToGrant = Object.values(MODULES);
    } else {
      modulesToGrant = ['EVENTS', 'STAFF', 'ANNOUNCEMENTS', 'POLLS', 'SETTINGS'];
    }
  }

  if (modulesToGrant) {
    if (input.permissionLevel && input.organizationIds.length > 0) {
      for (const orgId of input.organizationIds) {
        await setOrgScopedAdminModuleGrants(user.id, orgId, modulesToGrant, input.permissionLevel, input.createdById);
      }
    } else {
      await setAdminModuleGrants(user.id, modulesToGrant, input.createdById);
    }
  }

  await enqueueNotification({
    userId: user.id,
    templateKey: 'ADMIN_ACCOUNT_CREATED',
    category: 'SERVICE',
    to: { WHATSAPP: input.mobile, SMS: input.mobile },
    body: isCustomPassword 
      ? `Your JiNANAM ${input.role.replace('_', ' ')} account has been created. Mobile: ${input.mobile}. Please log in using the password you set.` 
      : `Your JiNANAM ${input.role.replace('_', ' ')} account has been created. Mobile: ${input.mobile}, temporary password: ${tempPassword}. Please log in and change it immediately.`,
  });

  return { user, tempPassword: process.env.NODE_ENV === 'production' || isCustomPassword ? undefined : tempPassword };
}

export async function linkAdminAccount(input: {
  userId: string;
  password?: string;
  role: RoleKey;
  organizationIds: string[];
  createdById: string;
  grantedModules?: string[];
  permissionLevel?: 'READ' | 'READ_WRITE';
}) {
  if (!ADMIN_ROLES.includes(input.role)) throw ApiError.validation({ role: ['Must be one of ' + ADMIN_ROLES.join(', ')] });

  const creator = await prisma.user.findUnique({ where: { id: input.createdById }, select: { primaryRoleKey: true } });
  if (creator?.primaryRoleKey !== 'SUPER_ADMIN') {
    if (!['STAFF', 'SECURITY_GUARD', 'EVENT_SCANNER'].includes(input.role)) {
      throw ApiError.forbidden('You can only delegate specific operational roles like STAFF.');
    }
  }

  const existingUser = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!existingUser) throw ApiError.notFound('User not found');

  const isCustomPassword = !!input.password;
  const tempPassword = input.password || crypto.randomBytes(6).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: {
        passwordHash,
        primaryRoleKey: input.role,
        createdByAdmin: true,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    // Clear old associations
    await tx.userOrganization.deleteMany({
      where: { userId: updated.id }
    });
    await tx.userPermissionOverride.deleteMany({
      where: { userId: updated.id, organizationId: { not: null } }
    });

    for (const organizationId of input.organizationIds) {
      await tx.userOrganization.create({
        data: { userId: updated.id, organizationId, roleKey: input.role, assignedById: input.createdById },
      });
    }

    return updated;
  });

  let modulesToGrant = input.grantedModules;
  if (modulesToGrant === undefined) {
    if (['ORG_ADMIN', 'TEMPLE_ADMIN', 'DHARAMSHALA_ADMIN', 'JAIN_CENTER_ADMIN', 'MONK_ADMIN', 'BHOJANSHALA_ADMIN'].includes(input.role)) {
      modulesToGrant = Object.values(MODULES);
    } else {
      modulesToGrant = ['EVENTS', 'STAFF', 'ANNOUNCEMENTS', 'POLLS', 'SETTINGS'];
    }
  }

  if (modulesToGrant) {
    if (input.permissionLevel && input.organizationIds.length > 0) {
      for (const orgId of input.organizationIds) {
        await setOrgScopedAdminModuleGrants(user.id, orgId, modulesToGrant, input.permissionLevel, input.createdById);
      }
    } else {
      await setAdminModuleGrants(user.id, modulesToGrant, input.createdById);
    }
  }

  await enqueueNotification({
    userId: user.id,
    templateKey: 'ADMIN_ACCOUNT_CREATED',
    category: 'SERVICE',
    to: { WHATSAPP: user.mobile, SMS: user.mobile },
    body: isCustomPassword 
      ? `Your JiNANAM ${input.role.replace('_', ' ')} account access has been granted. Mobile: ${user.mobile}. Please log in using the password you set.` 
      : `Your JiNANAM ${input.role.replace('_', ' ')} account access has been granted. Mobile: ${user.mobile}, temporary password: ${tempPassword}. Please log in and change it immediately.`,
  });

  return { user, tempPassword: process.env.NODE_ENV === 'production' || isCustomPassword ? undefined : tempPassword };
}

/** Temple/Dharamshala/JC admins may edit their own account only — never create/delete other admins (§3). */
export async function updateOwnAdminProfile(userId: string, input: { firstName?: string; lastName?: string; photoUrl?: string }) {
  return prisma.user.update({ where: { id: userId }, data: input });
}

export async function updateAdminAccount(targetUserId: string, input: { firstName?: string; lastName?: string; mobile?: string; password?: string }, actingSuperAdminId: string) {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });
  if (!ADMIN_ROLES.includes(target.primaryRoleKey)) {
    throw ApiError.validation({ userId: ['Target user is not an admin account'] });
  }

  const data: any = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.mobile !== undefined && input.mobile !== target.mobile) {
    const existing = await prisma.user.findUnique({ where: { mobile: input.mobile } });
    if (existing && existing.id !== targetUserId) throw ApiError.conflict('This mobile number is already registered to another user');
    data.mobile = input.mobile;
  }
  let tempPassword;
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10);
    tempPassword = input.password;
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data,
  });

  return { user: updated, tempPassword: process.env.NODE_ENV === 'production' ? undefined : tempPassword };
}

/**
 * §4.1: Super Admin dynamically restricts which sidebar tabs/modules a
 * specific Admin can see and use. Implemented as a full-replace over the
 * existing UserPermissionOverride model (global scope, organizationId=null)
 * — every module gets an explicit allow/deny row so this Admin's access no
 * longer silently inherits the shared role-wide default matrix, letting two
 * Admins with the same RoleKey have different tab sets.
 */
export async function setAdminModuleGrants(targetUserId: string, grantedModules: string[], actingSuperAdminId: string) {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });
  if (!ADMIN_ROLES.includes(target.primaryRoleKey)) {
    throw ApiError.validation({ userId: ['Target user is not an admin account'] });
  }

  const actingAdmin = await prisma.user.findUnique({ where: { id: actingSuperAdminId }, select: { primaryRoleKey: true } });
  if (actingAdmin?.primaryRoleKey !== 'SUPER_ADMIN') {
    const actingAdminOverrides = await prisma.userPermissionOverride.findMany({
      where: { userId: actingSuperAdminId, action: 'VIEW', allowed: true }
    });
    const actingAdminModules = new Set(actingAdminOverrides.map(o => o.module));
    for (const m of grantedModules) {
      if (!actingAdminModules.has(m)) throw ApiError.forbidden(`Cannot grant module ${m} which you do not possess.`);
    }
  }

  const grantedSet = new Set(grantedModules);
  const allModuleKeys = Object.values(MODULES);

  await prisma.$transaction(async (tx) => {
    await tx.userPermissionOverride.deleteMany({ where: { userId: targetUserId, organizationId: null } });

    const rows: Prisma.UserPermissionOverrideCreateManyInput[] = [];
    const allModulesToProcess = new Set<string>([...allModuleKeys, ...grantedModules]);
    for (const module of allModulesToProcess) {
      const allowed = grantedSet.has(module);
      for (const action of GRANTABLE_ACTIONS) {
        rows.push({ userId: targetUserId, organizationId: null, module, action, allowed, createdById: actingSuperAdminId });
      }
    }
    await tx.userPermissionOverride.createMany({ data: rows });
  });

  return prisma.userPermissionOverride.findMany({ where: { userId: targetUserId, organizationId: null } });
}

export async function setOrgScopedAdminModuleGrants(targetUserId: string, organizationId: string, grantedModules: string[], permissionLevel: 'READ' | 'READ_WRITE', actingSuperAdminId: string) {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });
  if (!ADMIN_ROLES.includes(target.primaryRoleKey)) {
    throw ApiError.validation({ userId: ['Target user is not an admin account'] });
  }

  const allowedActionsForRead = ['VIEW'];
  const allowedActionsForReadWrite = ['VIEW', 'CREATE', 'EDIT', 'APPROVE', 'REJECT'];
  const grantActions = permissionLevel === 'READ' ? allowedActionsForRead : allowedActionsForReadWrite;

  await prisma.$transaction(async (tx) => {
    await tx.userPermissionOverride.deleteMany({ where: { userId: targetUserId, organizationId, module: { in: grantedModules } } });

    const rows: Prisma.UserPermissionOverrideCreateManyInput[] = [];
    for (const module of grantedModules) {
      for (const action of GRANTABLE_ACTIONS) {
        const allowed = grantActions.includes(action);
        rows.push({ userId: targetUserId, organizationId, module, action, allowed, createdById: actingSuperAdminId });
      }
    }
    await tx.userPermissionOverride.createMany({ data: rows });
  });

  return prisma.userPermissionOverride.findMany({ where: { userId: targetUserId, organizationId } });
}

/**
 * §A8/A9: Super Admin can deactivate/reactivate an Admin without deleting the
 * account. INACTIVE blocks both future logins (auth.service login checks) and
 * every already-authenticated request (loadEffectivePermissions), so toggling
 * this instantly revokes whatever tab/module access that Admin currently holds.
 */
export async function setAdminActiveStatus(targetUserId: string, active: boolean, actingSuperAdminId: string) {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });
  if (!ADMIN_ROLES.includes(target.primaryRoleKey)) {
    throw ApiError.validation({ userId: ['Target user is not an admin account'] });
  }
  if (targetUserId === actingSuperAdminId) {
    throw ApiError.forbidden('You cannot deactivate your own admin account');
  }
  if (['DELETED', 'SUSPENDED', 'BLOCKED'].includes(target.status)) {
    throw ApiError.validation({ status: ['This account is deleted/suspended/blocked and cannot be toggled here'] });
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { status: active ? 'ACTIVE' : 'INACTIVE' },
  });
}

export async function assignAdminToOrganizations(userId: string, organizationIds: string[], assignedById: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!ADMIN_ROLES.includes(user.primaryRoleKey)) throw ApiError.validation({ userId: ['Target user is not an admin account'] });

  for (const organizationId of organizationIds) {
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId, organizationId } },
      update: {},
      create: { userId, organizationId, roleKey: user.primaryRoleKey, assignedById },
    });
  }
  return prisma.userOrganization.findMany({ where: { userId } });
}

export async function listOrgAdmins(organizationId: string) {
  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      primaryRoleKey: { in: ADMIN_ROLES },
      userOrganizations: {
        some: { organizationId }
      }
    },
    select: {
      id: true,
      publicId: true,
      mobile: true,
      firstName: true,
      lastName: true,
      primaryRoleKey: true,
      status: true,
      permissionOverrides: {
        where: { organizationId }
      }
    }
  });

  return admins.map(admin => {
    const modules: Record<string, 'READ' | 'READ_WRITE'> = {};
    const moduleActions: Record<string, Set<string>> = {};

    for (const po of admin.permissionOverrides) {
      if (!moduleActions[po.module]) moduleActions[po.module] = new Set();
      if (po.allowed) moduleActions[po.module]?.add(po.action);
    }

    for (const [module, actions] of Object.entries(moduleActions)) {
      if (actions.has('CREATE') || actions.has('EDIT')) {
        modules[module] = 'READ_WRITE';
      } else if (actions.has('VIEW')) {
        modules[module] = 'READ';
      }
    }

    return {
      id: admin.id,
      publicId: admin.publicId,
      mobile: admin.mobile,
      firstName: admin.firstName,
      lastName: admin.lastName,
      primaryRoleKey: admin.primaryRoleKey,
      status: admin.status,
      modules
    };
  });
}
