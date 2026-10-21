import { PrismaClient } from "@prisma/client";
import { getOrganization } from "./src/modules/temples/organizations.service";

const prisma = new PrismaClient();
getOrganization('cmti2qmty000medc2t0endnbv').then(org => {
  console.log("MulNayakBhagwan:", org.mulNayakBhagwan);
  console.log("TempleMulNayakName:", org.templeMulNayakName);
  console.log("deity:", (org as any).deity);
  console.log("mulNayakName:", (org as any).mulNayakName);
  console.log("mulNayakBhagwanName:", (org as any).mulNayakBhagwanName);
}).catch(console.error).finally(() => prisma.$disconnect());
