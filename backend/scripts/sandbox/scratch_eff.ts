import { PrismaClient } from "@prisma/client";
import { loadEffectivePermissions, listAssignedModules } from "./src/engines/rbac/permission.service";

const run = async () => {
  const eff = await loadEffectivePermissions("cmsvcarm50004v9lu6gv7bigj");
  console.log("EFF:", JSON.stringify(eff, null, 2));
  console.log("MODULES:", listAssignedModules(eff));
};
run().catch(console.error);
