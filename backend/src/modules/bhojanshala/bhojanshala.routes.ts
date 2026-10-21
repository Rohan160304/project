import { Router } from 'express';
import { requireAuth, requireRole, requirePermission, scopeToOrganization } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { asyncHandler } from '@/utils/asyncHandler';
import { z } from 'zod';
import * as bhojanshalaController from './bhojanshala.controller';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addContactSchema,
  addGalleryImageSchema,
  addTrusteeSchema,
  addVolunteerSchema,
  addReviewSchema,
  replyReviewSchema,
  publishReviewSchema,
  addNoticeSchema,
  addDhajaRecordSchema,
  reportIncorrectInfoSchema,
  addTempleAnnouncementSchema,
} from '@/modules/temples/organizations.dto';
import { makeOrganizationController, orgExtras } from '@/modules/temples/organizations.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
// Passes (Specific routes first)
router.get(
  "/my-passes",
  requireAuth,
  asyncHandler(bhojanshalaController.getMyPasses)
);

const orgCtrl = makeOrganizationController('BHOJANSHALA');

// Organization Endpoints
router.post('/', requireAuth, requireRole('SUPER_ADMIN'), validate(createOrganizationSchema), orgCtrl.create);
router.get('/', requireAuth, orgCtrl.list);
router.get('/:organizationId', requireAuth, orgCtrl.get);
router.patch('/:organizationId/modules', requireAuth, requirePermission('SETTINGS.SE_MODULE_CONTROLLER', 'EDIT'), scopeToOrganization, orgCtrl.updateModules);
router.patch('/:organizationId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(updateOrganizationSchema), orgCtrl.update);

const extra = orgExtras('BHOJANSHALA');

// Logo upload
router.post('/:organizationId/logo', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, upload.single('logo'), extra.uploadLogo);

// Gallery
router.post('/:organizationId/gallery', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addGalleryImageSchema), orgCtrl.addGalleryImage);
router.post('/:organizationId/gallery/bulk', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, upload.array('images', 20), extra.bulkUploadGallery);
router.delete('/:organizationId/gallery/:imageId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, extra.deleteGalleryImage);

// Trustees
router.post('/:organizationId/trustees', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addTrusteeSchema), orgCtrl.addTrustee);
router.delete('/:organizationId/trustees/:trusteeId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, extra.deleteTrustee);

// Volunteers
router.post('/:organizationId/volunteers', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addVolunteerSchema), orgCtrl.addVolunteer);

// Contacts — add, delete
router.post('/:organizationId/contacts', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addContactSchema), orgCtrl.addContact);
router.delete('/:organizationId/contacts/:contactId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, extra.deleteContact);

// Dhaja
router.post('/:organizationId/dhaja', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addDhajaRecordSchema), orgCtrl.addDhajaRecord);
router.patch('/:organizationId/dhaja/:dhajaRecordId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addDhajaRecordSchema), orgCtrl.updateDhajaRecord);
router.delete('/:organizationId/dhaja/:dhajaId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, extra.deleteDhaja);

// Reviews
router.post('/:organizationId/reviews', requireAuth, validate(addReviewSchema), orgCtrl.addReview);
router.patch('/reviews/:reviewId/reply', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), validate(replyReviewSchema), orgCtrl.replyReview);
router.patch('/reviews/:reviewId/publish', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), validate(publishReviewSchema), orgCtrl.publishReview);
router.delete('/reviews/:reviewId', requireAuth, requireRole('SUPER_ADMIN'), orgCtrl.hideReview);

// Notices
router.post('/:organizationId/notices', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addNoticeSchema), orgCtrl.addNotice);
router.delete('/:organizationId/notices/:noticeId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, extra.deleteNotice);

// Announcements
router.post('/:organizationId/announcements', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, validate(addTempleAnnouncementSchema), orgCtrl.addAnnouncement);
router.delete('/:organizationId/announcements/:announcementId', requireAuth, requirePermission('BHOJANSHALAS', 'EDIT'), scopeToOrganization, extra.deleteAnnouncement);

// Follow / Unfollow
router.post('/:organizationId/follow', requireAuth, orgCtrl.follow);
router.post('/:organizationId/unfollow', requireAuth, orgCtrl.unfollow);
router.post('/:organizationId/report-incorrect-info', requireAuth, validate(reportIncorrectInfoSchema), orgCtrl.reportIncorrectInfo);

// Zod schemas for validation
const updateTimingsSchema = z.object({
  body: z.object({
    bhojanshalaBreakfastTiming: z.string().optional(),
    bhojanshalaBreakfastCharge: z.string().optional(),
    bhojanshalaLunchTiming: z.string().optional(),
    bhojanshalaLunchCharge: z.string().optional(),
    bhojanshalaDinnerTiming: z.string().optional(),
    bhojanshalaDinnerCharge: z.string().optional(),
  }),
});

const menuItemSchema = z.object({
  body: z.object({
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']),
    dayOfWeek: z.string(),
    itemName: z.string(),
    description: z.string().optional(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    price: z.number().optional().nullable(),
    isAvailable: z.boolean().optional(),
  }),
});

const passSchema = z.object({
  body: z.object({
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']),
    date: z.coerce.date(),
    numberOfPersons: z.number().min(1),
    pricePaid: z.number().min(0),
    paymentId: z.string().optional(),
    memberId: z.string().optional(),
    memberIdentifier: z.string().optional(),
    status: z.string().optional(),
  }),
});

const scanPassSchema = z.object({
  body: z.object({
    deviceInfo: z.any().optional(),
  }),
});

// Organization Timings
router.put(
  '/:organizationId/timings',
  requireAuth,
  validate(updateTimingsSchema),
  asyncHandler(bhojanshalaController.updateTimings)
);

// Menu Items
router.get(
  '/:organizationId/menu',
  asyncHandler(bhojanshalaController.getMenu)
);

router.post(
  '/:organizationId/menu',
  requireAuth,
  validate(menuItemSchema),
  asyncHandler(bhojanshalaController.addMenuItem)
);

router.put(
  '/:organizationId/menu/:itemId',
  requireAuth,
  validate(menuItemSchema),
  asyncHandler(bhojanshalaController.updateMenuItem)
);

router.delete(
  '/:organizationId/menu/:itemId',
  requireAuth,
  asyncHandler(bhojanshalaController.deleteMenuItem)
);

// Passes

router.get(
  '/:organizationId/passes',
  requireAuth,
  asyncHandler(bhojanshalaController.getPasses)
);

router.post(
  '/:organizationId/passes',
  requireAuth,
  validate(passSchema),
  asyncHandler(bhojanshalaController.createPass)
);

router.post(
  '/:organizationId/passes/:publicId/scan',
  requireAuth,
  validate(scanPassSchema),
  asyncHandler(bhojanshalaController.scanPass)
);

router.patch(
  '/:organizationId/passes/:passId/approve',
  requireAuth,
  asyncHandler(bhojanshalaController.approvePass)
);

router.patch(
  '/:organizationId/passes/:passId/pending',
  requireAuth,
  asyncHandler(bhojanshalaController.markPassPending)
);


router.patch(
  '/:organizationId/passes/:passId/cancel',
  requireAuth,
  asyncHandler(bhojanshalaController.cancelPass)
);

router.get(
  '/:organizationId/managers',
  requireAuth,
  requirePermission('BHOJANSHALAS', 'VIEW'),
  scopeToOrganization,
  asyncHandler(bhojanshalaController.getManagers)
);

const addManagerSchema = z.object({
  body: z.object({
    mobile: z.string().min(10),
  }),
});

router.post(
  '/:organizationId/managers',
  requireAuth,
  requirePermission('BHOJANSHALAS', 'EDIT'),
  scopeToOrganization,
  validate(addManagerSchema),
  asyncHandler(bhojanshalaController.addManager)
);

router.delete(
  '/:organizationId/managers/:userId',
  requireAuth,
  requirePermission('BHOJANSHALAS', 'EDIT'),
  scopeToOrganization,
  asyncHandler(bhojanshalaController.removeManager)
);

export { router as bhojanshalaRoutes };
