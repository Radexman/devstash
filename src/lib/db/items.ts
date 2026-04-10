import { prisma } from '@/lib/prisma';

export interface ItemWithType {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
  tags: { id: string; name: string }[];
}

export async function getPinnedItems(userId: string): Promise<ItemWithType[]> {
  return prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      itemType: { select: { name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
    },
  });
}

export async function getRecentItems(userId: string): Promise<ItemWithType[]> {
  return prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      itemType: { select: { name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
    },
  });
}

export interface DashboardStats {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [totalItems, totalCollections, favoriteItems, favoriteCollections] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, totalCollections, favoriteItems, favoriteCollections };
}
