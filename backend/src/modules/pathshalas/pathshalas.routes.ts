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

export const pathshalasRoutes = Router();
const ctrl = makeOrganizationController('PATHSHALA');
const extra = orgExtras('PATHSHALA');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

pathshalasRoutes.post('/', requireAuth, requireRole('SUPER_ADMIN'), validate(createOrganizationSchema), ctrl.create);
pathshalasRoutes.get('/', requireAuth, ctrl.list);
pathshalasRoutes.get('/:organizationId', requireAuth, ctrl.get);
pathshalasRoutes.patch('/:organizationId', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(updateOrganizationSchema), ctrl.update);

pathshalasRoutes.post('/:organizationId/logo', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, upload.single('logo'), extra.uploadLogo);
pathshalasRoutes.post('/:organizationId/gallery', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(addGalleryImageSchema), ctrl.addGalleryImage);
pathshalasRoutes.post('/:organizationId/gallery/bulk', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, upload.array('images', 20), extra.bulkUploadGallery);
pathshalasRoutes.delete('/:organizationId/gallery/:imageId', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, extra.deleteGalleryImage);

pathshalasRoutes.post('/:organizationId/trustees', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(addTrusteeSchema), ctrl.addTrustee);
pathshalasRoutes.delete('/:organizationId/trustees/:trusteeId', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, extra.deleteTrustee);

pathshalasRoutes.post('/:organizationId/volunteers', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(addVolunteerSchema), ctrl.addVolunteer);

pathshalasRoutes.post('/:organizationId/contacts', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(addContactSchema), ctrl.addContact);
pathshalasRoutes.delete('/:organizationId/contacts/:contactId', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, extra.deleteContact);

pathshalasRoutes.post('/:organizationId/dhaja', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(addDhajaRecordSchema), ctrl.addDhajaRecord);
pathshalasRoutes.patch('/:organizationId/dhaja/:dhajaRecordId', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(addDhajaRecordSchema), ctrl.updateDhajaRecord);
pathshalasRoutes.delete('/:organizationId/dhaja/:dhajaId', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, extra.deleteDhaja);

pathshalasRoutes.post('/:organizationId/reviews', requireAuth, validate(addReviewSchema), ctrl.addReview);
pathshalasRoutes.patch('/reviews/:reviewId/reply', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), validate(replyReviewSchema), ctrl.replyReview);
pathshalasRoutes.patch('/reviews/:reviewId/publish', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), validate(publishReviewSchema), ctrl.publishReview);
pathshalasRoutes.delete('/reviews/:reviewId', requireAuth, requireRole('SUPER_ADMIN'), ctrl.hideReview);

pathshalasRoutes.post('/:organizationId/notices', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, validate(addNoticeSchema), ctrl.addNotice);
pathshalasRoutes.delete('/:organizationId/notices/:noticeId', requireAuth, requirePermission('PATHSHALAS', 'EDIT'), scopeToOrganization, extra.deleteNotice);

pathshalasRoutes.post('/:organizationId/follow', requireAuth, ctrl.follow);
pathshalasRoutes.post('/:organizationId/unfollow', requireAuth, ctrl.unfollow);
pathshalasRoutes.post('/:organizationId/report-incorrect-info', requireAuth, validate(reportIncorrectInfoSchema), ctrl.reportIncorrectInfo);
