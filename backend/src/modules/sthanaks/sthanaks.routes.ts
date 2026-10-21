import { Router } from 'express';
import { requireAuth, requireRole, requirePermission, scopeToOrganization } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addTrusteeSchema,
  addVolunteerSchema,
  addContactSchema,
  addDhajaRecordSchema,
  addReviewSchema,
  replyReviewSchema,
  publishReviewSchema,
  addNoticeSchema,
  addGalleryImageSchema,
  reportIncorrectInfoSchema,
} from '@/modules/temples/organizations.dto';
import { makeOrganizationController, orgExtras } from '@/modules/temples/organizations.controller';
import multer from 'multer';

export const sthanaksRoutes = Router();
const ctrl = makeOrganizationController('STHANAK');
const extra = orgExtras('STHANAK');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

sthanaksRoutes.post('/', requireAuth, requireRole('SUPER_ADMIN'), validate(createOrganizationSchema), ctrl.create);
sthanaksRoutes.get('/', requireAuth, ctrl.list);
sthanaksRoutes.get('/:organizationId', requireAuth, ctrl.get);
sthanaksRoutes.patch('/:organizationId', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(updateOrganizationSchema), ctrl.update);

sthanaksRoutes.post('/:organizationId/logo', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, upload.single('logo'), extra.uploadLogo);
sthanaksRoutes.post('/:organizationId/gallery', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(addGalleryImageSchema), ctrl.addGalleryImage);
sthanaksRoutes.post('/:organizationId/gallery/bulk', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, upload.array('images', 20), extra.bulkUploadGallery);
sthanaksRoutes.delete('/:organizationId/gallery/:imageId', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, extra.deleteGalleryImage);

sthanaksRoutes.post('/:organizationId/trustees', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(addTrusteeSchema), ctrl.addTrustee);
sthanaksRoutes.delete('/:organizationId/trustees/:trusteeId', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, extra.deleteTrustee);

sthanaksRoutes.post('/:organizationId/volunteers', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(addVolunteerSchema), ctrl.addVolunteer);

sthanaksRoutes.post('/:organizationId/contacts', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(addContactSchema), ctrl.addContact);
sthanaksRoutes.delete('/:organizationId/contacts/:contactId', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, extra.deleteContact);

sthanaksRoutes.post('/:organizationId/dhaja', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(addDhajaRecordSchema), ctrl.addDhajaRecord);
sthanaksRoutes.patch('/:organizationId/dhaja/:dhajaRecordId', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(addDhajaRecordSchema), ctrl.updateDhajaRecord);
sthanaksRoutes.delete('/:organizationId/dhaja/:dhajaId', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, extra.deleteDhaja);

sthanaksRoutes.post('/:organizationId/reviews', requireAuth, validate(addReviewSchema), ctrl.addReview);
sthanaksRoutes.patch('/reviews/:reviewId/reply', requireAuth, requirePermission('STHANAKS', 'EDIT'), validate(replyReviewSchema), ctrl.replyReview);
sthanaksRoutes.patch('/reviews/:reviewId/publish', requireAuth, requirePermission('STHANAKS', 'EDIT'), validate(publishReviewSchema), ctrl.publishReview);
sthanaksRoutes.delete('/reviews/:reviewId', requireAuth, requireRole('SUPER_ADMIN'), ctrl.hideReview);

sthanaksRoutes.post('/:organizationId/notices', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, validate(addNoticeSchema), ctrl.addNotice);
sthanaksRoutes.delete('/:organizationId/notices/:noticeId', requireAuth, requirePermission('STHANAKS', 'EDIT'), scopeToOrganization, extra.deleteNotice);

sthanaksRoutes.post('/:organizationId/follow', requireAuth, ctrl.follow);
sthanaksRoutes.post('/:organizationId/unfollow', requireAuth, ctrl.unfollow);
sthanaksRoutes.post('/:organizationId/report-incorrect-info', requireAuth, validate(reportIncorrectInfoSchema), ctrl.reportIncorrectInfo);
