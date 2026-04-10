import { prisma } from '@/lib/prisma';

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
}

export async function getSidebarCollections(userId: string): Promise<{
  favorites: SidebarCollection[];
  recents: SidebarCollection[];
}> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  });

  const mapped: SidebarCollection[] = collections.map((col) => {
    const typeCounts = new Map<string, { count: number; color: string }>();
    for (const ic of col.items) {
      const existing = typeCounts.get(ic.item.itemType.id);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(ic.item.itemType.id, { count: 1, color: ic.item.itemType.color });
      }
    }

    let dominantColor: string | null = null;
    let maxCount = 0;
    for (const entry of typeCounts.values()) {
      if (entry.count > maxCount) {
        maxCount = entry.count;
        dominantColor = entry.color;
      }
    }

    return {
      id: col.id,
      name: col.name,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      dominantColor,
    };
  });

  return {
    favorites: mapped.filter((c) => c.isFavorite),
    recents: mapped.filter((c) => !c.isFavorite),
  };
}

export interface CollectionWithMeta {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
  typeIcons: { icon: string; color: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getCollectionsForDashboard(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    include: {
      items: {
        include: {
          item: {
            include: {
              itemType: true,
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    const itemTypes = collection.items.map((ic) => ic.item.itemType);

    // Count occurrences of each type to find dominant
    const typeCounts = new Map<string, { count: number; icon: string; color: string }>();
    for (const type of itemTypes) {
      const existing = typeCounts.get(type.id);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(type.id, { count: 1, icon: type.icon, color: type.color });
      }
    }

    // Dominant color = most-used type's color
    let dominantColor: string | null = null;
    let maxCount = 0;
    for (const entry of typeCounts.values()) {
      if (entry.count > maxCount) {
        maxCount = entry.count;
        dominantColor = entry.color;
      }
    }

    // Unique type icons (up to 4)
    const typeIcons = [...typeCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map(({ icon, color }) => ({ icon, color }));

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      dominantColor,
      typeIcons,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  });
}
