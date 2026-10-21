sed -i '' "s|import { serializeMember, serializeMemberFull } from './members.serializer';|import { serializeMember, serializeMemberFull } from './members.serializer';\nimport { verifyRegistrationToken } from '@/engines/rbac/jwt.service';\nimport { issueTokensForUser } from '@/modules/auth/auth.service';|" src/modules/members/members.controller.ts

cat << 'INNER_EOF' > patch_controller.txt
export const registerJainMember = asyncHandler(async (req: Request, res: Response) => {
  const { registrationToken, deviceId, deviceType, os, appVersion } = req.body;
  if (!registrationToken) throw ApiError.unauthorized('Registration token missing');
  
  const decoded = verifyRegistrationToken(registrationToken);
  const member = await membersService.registerMember({ category: 'JAIN', mobile: decoded.mobile, ...req.body });
  
  const tokens = await issueTokensForUser({ id: member.userId, publicId: member.publicId, primaryRoleKey: 'MEMBER' }, { deviceId, deviceType, os, appVersion, ip: req.ip });
  
  return created(res, { ...serializeMemberFull(member, null, true), ...tokens });
});

export const registerNonJainMember = asyncHandler(async (req: Request, res: Response) => {
  const { registrationToken, deviceId, deviceType, os, appVersion } = req.body;
  if (!registrationToken) throw ApiError.unauthorized('Registration token missing');
  
  const decoded = verifyRegistrationToken(registrationToken);
  const member = await membersService.registerMember({ category: 'NON_JAIN', mobile: decoded.mobile, ...req.body });
  
  const tokens = await issueTokensForUser({ id: member.userId, publicId: member.publicId, primaryRoleKey: 'NON_JAIN_MEMBER' }, { deviceId, deviceType, os, appVersion, ip: req.ip });
  
  return created(res, { ...serializeMemberFull(member, null, true), ...tokens });
});
INNER_EOF

sed -i '' -e '/export const registerJainMember = asyncHandler(async (req: Request, res: Response) => {/,/});/c\
'"$(cat patch_controller.txt | sed ':a;N;$!ba;s/\n/\\n/g')"'
' src/modules/members/members.controller.ts
