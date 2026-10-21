import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { MealType, Prisma } from '@prisma/client';
import { nextPublicId } from '@/engines/idGenerator/id.service';

export const updateTimings = async (
  organizationId: string,
  data: {
    bhojanshalaBreakfastTiming?: string;
    bhojanshalaBreakfastCharge?: string;
    bhojanshalaLunchTiming?: string;
    bhojanshalaLunchCharge?: string;
    bhojanshalaDinnerTiming?: string;
    bhojanshalaDinnerCharge?: string;
  }
) => {
  return prisma.organization.update({
    where: { id: organizationId },
    data,
  });
};

export const getMenu = async (organizationId: string, dayOfWeek?: string) => {
  const where: Prisma.BhojanshalaMenuItemWhereInput = { organizationId };
  if (dayOfWeek) {
    where.dayOfWeek = dayOfWeek;
  }
  return prisma.bhojanshalaMenuItem.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
};

export const addMenuItem = async (
  organizationId: string,
  data: {
    mealType: MealType;
    dayOfWeek: string;
    itemName: string;
    description?: string;
    startTime?: string | null;
    endTime?: string | null;
    price?: number | null;
    isAvailable?: boolean;
  }
) => {
  return prisma.bhojanshalaMenuItem.create({
    data: {
      organizationId,
      ...data,
    },
  });
};

export const updateMenuItem = async (
  itemId: string,
  organizationId: string,
  data: {
    mealType: MealType;
    dayOfWeek: string;
    itemName: string;
    description?: string;
    startTime?: string | null;
    endTime?: string | null;
    price?: number | null;
    isAvailable?: boolean;
  }
) => {
  const item = await prisma.bhojanshalaMenuItem.findFirst({
    where: { id: itemId, organizationId },
  });

  if (!item) {
    throw ApiError.notFound('Menu item not found');
  }

  return prisma.bhojanshalaMenuItem.update({
    where: { id: itemId },
    data,
  });
};

export const deleteMenuItem = async (itemId: string, organizationId: string) => {
  const item = await prisma.bhojanshalaMenuItem.findFirst({
    where: { id: itemId, organizationId },
  });

  if (!item) {
    throw ApiError.notFound('Menu item not found');
  }

  await prisma.bhojanshalaMenuItem.delete({
    where: { id: itemId },
  });
};

export const getPasses = async (organizationId: string) => {
  return prisma.bhojanshalaPass.findMany({
    where: { organizationId },
    include: {
      member: {
        select: {
          firstName: true,
          surname: true,
        },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
};

export const createPass = async (
  organizationId: string,
  memberId: string,
  data: {
    mealType: MealType;
    date: Date;
    numberOfPersons: number;
    pricePaid: number;
    paymentId?: string;
    status?: string; // allow passing status
  }
) => {
  return prisma.$transaction(async (tx) => {
    const publicId = await nextPublicId('BHOJANSHALA_PASS', tx);
    return tx.bhojanshalaPass.create({
      data: {
        publicId,
        organizationId,
        memberId,
        status: data.status as any || 'PENDING',
        mealType: data.mealType,
        date: data.date,
        numberOfPersons: data.numberOfPersons,
        totalAmount: data.pricePaid,
      },
    });
  });
};

export const getMyPasses = async (memberId: string) => {
  return prisma.bhojanshalaPass.findMany({
    where: { memberId },
    include: {
      organization: {
        select: {
          name: true,
          publicId: true,
        },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
};

export const scanPass = async (
  organizationId: string,
  publicId: string,
  scannedById: string,
  deviceInfo?: any
) => {
  return prisma.$transaction(async (tx) => {
    const pass = await tx.bhojanshalaPass.findFirst({
      where: { publicId, organizationId },
    });

    if (!pass) {
      throw ApiError.notFound('Pass not found or does not belong to this organization');
    }

    if (pass.status !== 'BOOKED') {
      throw ApiError.badRequest(`Pass cannot be scanned. Current status is ${pass.status}`);
    }

    // Mark pass as SCANNED
    const updatedPass = await tx.bhojanshalaPass.update({
      where: { id: pass.id },
      data: { status: 'SCANNED' },
      include: {
        member: {
          select: {
            publicId: true,
            firstName: true,
            surname: true,
            user: { select: { mobile: true } }
          }
        }
      }
    });

    // Create scan record
    await tx.bhojanshalaPassScan.create({
      data: {
        passId: pass.id,
        scannedById,
        deviceInfo,
      },
    });

    return updatedPass;
  });
};

export const getMemberIdFromUserId = async (userId: string) => {
  const member = await prisma.member.findUnique({ where: { userId } });
  return member?.id;
};

export const getMemberByIdentifier = async (identifier: string) => {
  const member = await prisma.member.findFirst({
    where: {
      OR: [
        { publicId: identifier },
        { user: { mobile: identifier } }
      ]
    }
  });
  return member?.id;
};

export const approvePass = async (passId: string, organizationId: string) => {
  const pass = await prisma.bhojanshalaPass.findUnique({
    where: { id: passId }
  });
  
  if (!pass) {
    throw ApiError.notFound('Pass not found');
  }
  
  if (pass.organizationId !== organizationId) {
    throw ApiError.forbidden('You are not authorized to approve this pass');
  }
  
  if (pass.status !== 'PENDING') {
    throw ApiError.badRequest(`Cannot approve pass with status ${pass.status}`);
  }
  
  return prisma.bhojanshalaPass.update({
    where: { id: passId },
    data: { status: 'BOOKED' }
  });
};

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
    data: { status: 'CANCELLED' },
  });
};

export const markPassPending = async (
  organizationId: string,
  passId: string,
  actionUserId: string
) => {
  const pass = await prisma.bhojanshalaPass.findUnique({
    where: { id: passId },
  });

  if (!pass) {
    throw ApiError.notFound('Pass not found');
  }

  if (pass.organizationId !== organizationId) {
    throw ApiError.forbidden('Pass does not belong to this organization');
  }

  return prisma.bhojanshalaPass.update({
    where: { id: passId },
    data: { status: 'PENDING' },
  });
};

export const getManagers = async (organizationId: string) => {
  return prisma.userOrganization.findMany({
    where: {
      organizationId,
      roleKey: 'BHOJANSHALA_ADMIN'
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          publicId: true,
        }
      }
    }
  });
};

export const addManager = async (organizationId: string, mobile: string) => {
  let user = await prisma.user.findFirst({
    where: { mobile }
  });
  
  let tempPassword = null;
  if (!user) {
    // Generate a random 8 char password
    tempPassword = Math.random().toString(36).slice(-8);
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    user = await prisma.user.create({
      data: {
        mobile,
        passwordHash: hashedPassword,
        createdByAdmin: true,
      }
    });
    
    // In a real app, send the tempPassword via SMS/WhatsApp here.
    console.log(`[Notification] Sent temporary password to ${mobile}: ${tempPassword}`);
  }
  
  // Check if already a manager
  const existing = await prisma.userOrganization.findFirst({
    where: {
      userId: user.id,
      organizationId,
      roleKey: 'BHOJANSHALA_ADMIN'
    }
  });
  
  if (existing) {
    throw ApiError.badRequest('User is already a Bhojanshala Admin');
  }
  
  const userOrg = await prisma.userOrganization.create({
    data: {
      userId: user.id,
      organizationId,
      roleKey: 'BHOJANSHALA_ADMIN'
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          publicId: true,
        }
      }
    }
  });
  
  return {
    manager: userOrg,
    tempPassword, // Return temp password to show in UI if needed (for demonstration)
  };
};

export const removeManager = async (organizationId: string, userId: string) => {
  await prisma.userOrganization.deleteMany({
    where: {
      userId,
      organizationId,
      roleKey: 'BHOJANSHALA_ADMIN'
    }
  });
};
