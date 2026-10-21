const fs = require('fs');

// 1. Update bhojanshala.service.ts
let servicePath = 'src/modules/bhojanshala/bhojanshala.service.ts';
let serviceCode = fs.readFileSync(servicePath, 'utf8');

if (!serviceCode.includes('cancelPass =')) {
  serviceCode += `
export const cancelPass = async (passId: string, organizationId: string) => {
  const pass = await prisma.bhojanshalaPass.findUnique({
    where: { id: passId }
  });
  
  if (!pass) {
    throw ApiError.notFound('Pass not found');
  }
  
  if (pass.organizationId !== organizationId) {
    throw ApiError.forbidden('You are not authorized to cancel this pass');
  }
  
  if (pass.status === 'SCANNED' || pass.status === 'EXPIRED') {
    throw ApiError.badRequest('Cannot cancel a scanned or expired pass');
  }
  
  return prisma.bhojanshalaPass.update({
    where: { id: passId },
    data: { status: 'CANCELLED' }
  });
};
`;
  fs.writeFileSync(servicePath, serviceCode);
}

// 2. Update bhojanshala.controller.ts
let controllerPath = 'src/modules/bhojanshala/bhojanshala.controller.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf8');

if (!controllerCode.includes('cancelPass =')) {
  controllerCode += `
export const cancelPass = async (req: Request, res: Response) => {
  const { organizationId, passId } = req.params;
  const userId = req.actor?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const result = await bhojanshalaService.cancelPass(passId as string, organizationId as string);
  return ok(res, result);
};
`;
  fs.writeFileSync(controllerPath, controllerCode);
}

// 3. Update bhojanshala.routes.ts
let routesPath = 'src/modules/bhojanshala/bhojanshala.routes.ts';
let routesCode = fs.readFileSync(routesPath, 'utf8');

if (!routesCode.includes('/passes/:passId/cancel')) {
  const cancelRoute = `
router.patch(
  '/:organizationId/passes/:passId/cancel',
  requireAuth,
  asyncHandler(bhojanshalaController.cancelPass)
);

export { router as bhojanshalaRoutes };`;
  
  routesCode = routesCode.replace('export { router as bhojanshalaRoutes };', cancelRoute);
  fs.writeFileSync(routesPath, routesCode);
}

console.log("Backend patched");
