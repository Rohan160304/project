import { Request, Response } from 'express';
import { ok, created } from '@/utils/apiResponse';
import * as bhojanshalaService from './bhojanshala.service';

export const updateTimings = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const result = await bhojanshalaService.updateTimings(organizationId as string, req.body);
  return ok(res, result);
};

export const getMenu = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { dayOfWeek } = req.query;
  const result = await bhojanshalaService.getMenu(
    organizationId as string,
    typeof dayOfWeek === 'string' ? dayOfWeek : undefined
  );
  return ok(res, result);
};

export const addMenuItem = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const result = await bhojanshalaService.addMenuItem(organizationId as string, req.body);
  return created(res, result);
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const { organizationId, itemId } = req.params;
  const result = await bhojanshalaService.updateMenuItem(
    itemId as string,
    organizationId as string,
    req.body
  );
  return ok(res, result);
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  const { organizationId, itemId } = req.params;
  await bhojanshalaService.deleteMenuItem(itemId as string, organizationId as string);
  return ok(res, null);
};

export const getPasses = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const result = await bhojanshalaService.getPasses(organizationId as string);
  return ok(res, result);
};

export const createPass = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  
  let memberId = req.body.memberId;
  const memberIdentifier = req.body.memberIdentifier; // New field for mobile or publicId
  
  if (!memberId && memberIdentifier) {
    memberId = await bhojanshalaService.getMemberByIdentifier(memberIdentifier);
  }
  
  if (!memberId && req.actor?.userId && !memberIdentifier) {
    memberId = await bhojanshalaService.getMemberIdFromUserId(req.actor.userId);
  }
  
  if (!memberId) {
    return res.status(400).json({ success: false, message: 'Member ID or valid mobile number is required to book a pass.' });
  }
  
  // If pass is created via memberIdentifier by an admin, it's PENDING
  const passData = { ...req.body };
  if (memberIdentifier) {
    passData.status = 'PENDING';
  } else {
    passData.status = 'BOOKED';
  }
  
  const result = await bhojanshalaService.createPass(organizationId as string, memberId, passData);
  return created(res, result);
};

export const getMyPasses = async (req: Request, res: Response) => {
  const userId = req.actor?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const memberId = await bhojanshalaService.getMemberIdFromUserId(userId);
  if (!memberId) {
    return res.status(400).json({ success: false, message: 'Member profile required' });
  }
  const result = await bhojanshalaService.getMyPasses(memberId);
  return ok(res, result);
};

export const scanPass = async (req: Request, res: Response) => {
  const { organizationId, publicId } = req.params;
  const scannedById = req.actor?.userId;
  if (!scannedById) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const result = await bhojanshalaService.scanPass(organizationId as string, publicId as string, scannedById as string, req.body.deviceInfo);
  return ok(res, result);
};

export const approvePass = async (req: Request, res: Response) => {
  const { organizationId, passId } = req.params;
  const userId = req.actor?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const result = await bhojanshalaService.approvePass(passId as string, organizationId as string);
  return ok(res, result);
};

export const cancelPass = async (req: Request, res: Response) => {
  const { organizationId, passId } = req.params;
  const userId = req.actor?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const result = await bhojanshalaService.cancelPass(passId as string, organizationId as string);
  return ok(res, result);
};

export const markPassPending = async (req: Request, res: Response) => {
  const { organizationId, passId } = req.params;
  const userId = req.actor?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const result = await bhojanshalaService.markPassPending(
    organizationId as string,
    passId as string,
    userId
  );
  return ok(res, result);
};

export const getManagers = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const result = await bhojanshalaService.getManagers(organizationId as string);
  return ok(res, result);
};

export const addManager = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { mobile } = req.body;
  const result = await bhojanshalaService.addManager(organizationId as string, mobile);
  return created(res, result);
};

export const removeManager = async (req: Request, res: Response) => {
  const { organizationId, userId } = req.params;
  await bhojanshalaService.removeManager(organizationId as string, userId as string);
  return ok(res, null);
};
