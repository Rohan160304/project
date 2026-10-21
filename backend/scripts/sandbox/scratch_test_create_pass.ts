import { PrismaClient } from '@prisma/client';
import * as bhojanshalaService from './src/modules/bhojanshala/bhojanshala.service';
const prisma = new PrismaClient();

async function run() {
  const org = await prisma.organization.findFirst({ where: { type: 'BHOJANSHALA' } });
  const member = await prisma.member.findFirst();
  
  if (!org || !member) {
    console.log("No org or member");
    return;
  }

  // simulate what controller does
  const reqBody = {
    mealType: 'LUNCH',
    date: new Date(),
    numberOfPersons: 2,
    pricePaid: 100,
    status: 'PENDING' // from frontend
  };
  
  // zod strips it
  delete reqBody.status;

  const passData = { ...reqBody };
  // memberIdentifier not provided

  const result = await bhojanshalaService.createPass(org.id, member.id, passData as any);
  console.log("Created pass status:", result.status);
}

run().finally(() => prisma.$disconnect());
