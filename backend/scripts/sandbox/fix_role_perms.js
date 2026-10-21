const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const roles = await prisma.role.findMany({
        where: { key: { in: ['TEMPLE_ADMIN', 'DHARAMSHALA_ADMIN', 'JAIN_CENTER_ADMIN'] } }
    });

    const modules = ['BHOJANSHALAS', 'PATHSHALAS', 'GOSHALAS'];
    const actions = ['VIEW', 'CREATE', 'EDIT', 'APPROVE', 'REJECT'];

    for (const role of roles) {
        for (const module of modules) {
            for (const action of actions) {
                const existing = await prisma.rolePermission.findFirst({
                    where: { roleId: role.id, module, action }
                });
                if (!existing) {
                    await prisma.rolePermission.create({
                        data: {
                            roleId: role.id,
                            module,
                            action,
                            allowed: true
                        }
                    });
                }
            }
        }
    }
    console.log('Added missing RolePermissions for facilities.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
