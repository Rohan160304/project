import { Router } from 'express';
import { z } from 'zod';
import { validate } from '@/middlewares/validate';
import { requireAuth, requirePermission, requireSuperAdmin } from '@/middlewares/auth';
import {
  registerJainMemberSchema,
  registerNonJainMemberSchema,
  updateMemberProfileSchema,
  bulkImportSchema,
} from './members.dto';
import multer from 'multer';
import * as membersController from './members.controller';
import { locationPing } from './memberLocation.controller';
import { bulkImportFromExcel } from './bulkImportExcel.controller';
import { myMemberQr } from './memberQr.controller';

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const locationPingSchema = z.object({
  body: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
});

const communitySwitchSchema = z.object({
  body: z.object({
    communityId: z.string().optional(),
    subCommunityId: z.string().optional(),
    gacchaId: z.string().optional(),
  }),
});

export const memberRoutes = Router();

// Geofence ping (§4.3): updates current GPS + fires "temple within 5km" notifications
memberRoutes.post('/me/location', requireAuth, validate(locationPingSchema), locationPing);

// Member ID QR — digital membership card (§4.5)
memberRoutes.get('/me/qr', requireAuth, myMemberQr);

// Community switch — Jain member changes active community feed context (§5.13)
memberRoutes.patch('/me/community-switch', requireAuth, validate(communitySwitchSchema), membersController.switchActiveCommunity);

// Admin member register list (must precede /:publicId)
memberRoutes.get('/', requireAuth, requirePermission('MEMBERS', 'VIEW'), membersController.listMembers);
memberRoutes.post('/admin-create', requireAuth, requirePermission('MEMBERS', 'CREATE'), membersController.adminCreateMember);
memberRoutes.post('/register/jain', validate(registerJainMemberSchema), membersController.registerJainMember);
memberRoutes.post('/register/non-jain', validate(registerNonJainMemberSchema), membersController.registerNonJainMember);
memberRoutes.post('/init', requireAuth, membersController.initMemberProfile);
memberRoutes.get('/me', requireAuth, membersController.getMyProfile);
memberRoutes.get('/me/follows', requireAuth, membersController.getMyFollows);
memberRoutes.patch('/me', requireAuth, validate(updateMemberProfileSchema), membersController.updateMyProfile);

// ─── Export all members as Excel (must be before /:publicId) ─────────────────
// Export member roster — Super-Admin only (matches frontend Export button visibility).
memberRoutes.get('/export', requireAuth, requireSuperAdmin, membersController.exportMembersExcel);

// ─── Blank import template download ──────────────────────────────────────────
memberRoutes.get('/import-template', requireAuth, membersController.downloadImportTemplate);

memberRoutes.get('/admin-details/:publicId', requireAuth, requirePermission('MEMBERS', 'VIEW'), membersController.getAdminMemberDetails);

memberRoutes.get('/:publicId', requireAuth, membersController.getMemberByPublicId);

// ─── Admin: update any member profile (MEMBERS:EDIT) ────────────────────────
// B1 Fix: Removed hard Super Admin gate — org-admins with MEMBERS:EDIT can edit.
// Super Admin can still edit any member; org-admins edit within their org scope.
memberRoutes.patch(
  '/:publicId',
  requireAuth,
  requirePermission('MEMBERS', 'EDIT'),
  validate(updateMemberProfileSchema),
  membersController.adminUpdateMember,
);

// ─── Admin: toggle Active / Inactive / Suspended status ─────────────────────
memberRoutes.patch(
  '/:publicId/status',
  requireAuth,
  requirePermission('MEMBERS', 'EDIT'),
  membersController.adminUpdateMemberStatus,
);

// ─── Super Admin: permanently delete a member profile (§5.2 Rule 2) ─────────
memberRoutes.delete(
  '/:publicId',
  requireAuth,
  membersController.hardDeleteMember,
);

// ─── Photo upload (multipart) ─────────────────────────────────────────────────
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
memberRoutes.post(
  '/:publicId/photo',
  requireAuth,
  requirePermission('MEMBERS', 'EDIT'),
  photoUpload.single('photo'),
  membersController.uploadMemberPhoto,
);

memberRoutes.post(
  '/bulk-import',
  requireAuth,
  requirePermission('MEMBERS', 'CREATE'),
  validate(bulkImportSchema),
  membersController.bulkImportMembers,
);
// Excel (.xlsx) upload variant of bulk import (§5.2)
memberRoutes.post(
  '/bulk-import/excel',
  requireAuth,
  requirePermission('MEMBERS', 'CREATE'),
  excelUpload.single('file'),
  bulkImportFromExcel,
);
