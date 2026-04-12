import { prisma } from '@/lib/prisma';

export interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  hasPassword: boolean;
}

export async function getProfileData(userId: string): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      hashedPassword: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: !!user.hashedPassword,
  };
}

export interface ProfileStats {
  totalItems: number;
  totalCollections: number;
  itemsByType: { name: string; icon: string; color: string; count: number }[];
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, typeCounts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: {
        name: true,
        icon: true,
        color: true,
        _count: {
          select: {
            items: { where: { userId } },
          },
        },
      },
    }),
  ]);

  return {
    totalItems,
    totalCollections,
    itemsByType: typeCounts.map((t) => ({
      name: t.name,
      icon: t.icon,
      color: t.color,
      count: t._count.items,
    })),
  };
}
