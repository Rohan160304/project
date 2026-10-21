import { Router, Request, Response } from 'express';
import { requireAuth, requireRole, requirePermission } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { asyncHandler } from '@/utils/asyncHandler';
import { ok } from '@/utils/apiResponse';
import { prisma } from '@/config/prisma';
import { addFamilyMemberSchema, linkFamilyMembersSchema } from '@/modules/members/members.dto';
import { addFamilyMember, linkFamilyMembers, listAllFamilyGroups } from '@/modules/members/members.controller';

/**
 * Family Members Management (§5.2). Kept as its own routed module per the
 * spec's module list, but implemented on top of members.service.ts since a
 * family member IS a Member record (auto-linked or auto-created).
 */
export const familyRoutes = Router();

familyRoutes.post('/', requireAuth, validate(addFamilyMemberSchema), addFamilyMember);

/** Admin-wide family group directory (all members, not just the caller's own). */
familyRoutes.get('/', requireAuth, requirePermission('FAMILY', 'VIEW'), listAllFamilyGroups);

/** Admin/Super Admin links two already-existing members as family, by public ID. Or normal member linking their own. */
familyRoutes.post('/link', requireAuth, validate(linkFamilyMembersSchema), linkFamilyMembers);

/** My family links (both directions). Members without a profile (e.g. Super Admin) get an empty list. */
familyRoutes.get(
  '/my',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) return ok(res, []);

    const [asPrimary, asRelated] = await Promise.all([
      prisma.familyMember.findMany({
        where: { primaryMemberId: member.id },
        include: {
          relatedMember: { select: { publicId: true, fullName: true, mobile: true, photoUrl: true, status: true } },
          relationshipType: { select: { name: true } },
        },
      }),
      prisma.familyMember.findMany({
        where: { relatedMemberId: member.id },
        include: {
          primaryMember: { select: { publicId: true, fullName: true, mobile: true, photoUrl: true, status: true } },
          relationshipType: { select: { name: true } },
        },
      }),
    ]);

    const rows = [
      ...asPrimary.map((l) => ({ id: l.id, relation: l.relationshipType.name, direction: 'ADDED_BY_ME' as const, member: l.relatedMember, createdAt: l.createdAt })),
      ...asRelated.map((l) => ({ id: l.id, relation: l.relationshipType.name, direction: 'ADDED_ME' as const, member: l.primaryMember, createdAt: l.createdAt })),
    ];
    return ok(res, rows);
  }),
);

/**
 * Family links of a specific member by public ID — used by the Family
 * Management page when an admin wants to inspect any member's family group
 * (not just their own). Same response shape as /family/my.
 */
familyRoutes.get(
  '/member/:publicId',
  requireAuth,
  requirePermission('FAMILY', 'VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const publicId = req.params.publicId as string;
    const member = await prisma.member.findUnique({ where: { publicId } });
    if (!member) return ok(res, []);

    const [asPrimary, asRelated] = await Promise.all([
      prisma.familyMember.findMany({
        where: { primaryMemberId: member.id },
        include: {
          relatedMember: { select: { publicId: true, fullName: true, surname: true, mobile: true, photoUrl: true, status: true } },
          relationshipType: { select: { name: true } },
        },
      }),
      prisma.familyMember.findMany({
        where: { relatedMemberId: member.id },
        include: {
          primaryMember: { select: { publicId: true, fullName: true, surname: true, mobile: true, photoUrl: true, status: true } },
          relationshipType: { select: { name: true } },
        },
      }),
    ]);

    // Include a synthetic "anchor" entry so the family card lists the anchor
    // themselves too, not just their relatives. Without this, a family of 3
    // (anchor + 2 relatives) would render as only 2 cards.
    const anchorEntry = {
      id: `anchor-${member.id}`,
      relation: 'Head of Family',
      direction: 'ANCHOR' as const,
      member: {
        publicId: member.publicId,
        fullName: member.fullName,
        surname: (member as any).surname ?? null,
        mobile: (member as any).mobile ?? null,
        photoUrl: (member as any).photoUrl ?? null,
        status: (member as any).status ?? null,
      },
      createdAt: member.createdAt,
    };

    const rows = [
      anchorEntry,
      ...asPrimary.map((l) => ({ id: l.id, relation: l.relationshipType.name, direction: 'ADDED_BY_ME' as const, member: l.relatedMember, createdAt: l.createdAt })),
      ...asRelated.map((l) => ({ id: l.id, relation: l.relationshipType.name, direction: 'ADDED_ME' as const, member: l.primaryMember, createdAt: l.createdAt })),
    ];
    return ok(res, rows);
  }),
);

/** Remove a family link (§5.2: family links are permanent for members; Super Admin only). */
familyRoutes.delete(
  '/:linkId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.familyMember.delete({ where: { id: req.params.linkId as string } });
    return ok(res, { deleted: true });
  }),
);
