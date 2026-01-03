import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const nickname = 'swifter';
    try {
        const user = await prisma.user.update({
            where: { nickname },
            data: { isAdmin: true }
        });
        console.log(`User ${nickname} is now Admin!`);
    } catch (e) {
        console.error(`Error updating user ${nickname}:`, e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
