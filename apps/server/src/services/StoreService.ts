import { prisma } from '../db';
import { StoreItem, UserProfile } from '@buzz/shared';
// @ts-ignore
import { StoreItem as PrismaStoreItem } from '@prisma/client';

export class StoreService {
    static async getStoreItems(): Promise<StoreItem[]> {
        const items = await prisma.storeItem.findMany({
            where: { isActive: true }
        });

        return items.map(item => ({
            id: item.id,
            type: item.type as 'SKIN' | 'BUNDLE',
            referenceId: item.referenceId,
            name: item.name,
            price: item.price,
            isActive: item.isActive
        }));
    }

    static async purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; error?: string; inventory?: string[]; gems?: number }> {
        // 1. Fetch Item and User
        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item || !item.isActive) {
            return { success: false, error: 'Item not found or inactive' };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { ownedItems: true }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // 2. Check Ownership
        const alreadyOwned = user.ownedItems.some(owned => owned.itemReferenceId === item.referenceId);
        if (alreadyOwned) {
            return { success: false, error: 'Item already owned' };
        }

        // 3. Check Balance
        if (user.gems < item.price) {
            return { success: false, error: 'Insufficient gems' };
        }

        // 4. Transaction: Deduct Gems + Add OwnedItem
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Deduct
                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: { gems: { decrement: item.price } }
                });

                if (updatedUser.gems < 0) {
                    throw new Error('Insufficient gems (race condition)');
                }

                // Add to Owned
                await tx.ownedItem.create({
                    data: {
                        userId: userId,
                        itemReferenceId: item.referenceId
                    }
                });

                // Return final state
                return updatedUser;
            });

            // Fetch updated inventory to return
            const finalUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { ownedItems: true }
            });

            return {
                success: true,
                gems: result.gems,
                inventory: finalUser?.ownedItems.map(i => i.itemReferenceId) || []
            };

        } catch (e: any) {
            return { success: false, error: e.message || 'Transaction failed' };
        }
    }

    // Seed logic for internal use
    static async seedDefaultItems() {
        const count = await prisma.storeItem.count();
        if (count === 0) {
            await prisma.storeItem.createMany({
                data: [
                    { referenceId: 'tralalero.glb', name: 'Tralalero', price: 1000, type: 'SKIN' },
                    { referenceId: 'capuchino.glb', name: 'Cappuccino Assassino', price: 1500, type: 'SKIN' },
                    { referenceId: 'tuntunsahur.glb', name: 'Tun Tun Sahur', price: 2000, type: 'SKIN' }
                ]
            });
            console.log('Seeded default store items');
        }
    }
}
