import { prisma } from '@/lib/prisma';
import type { ItemWithType } from '@/lib/db/items';

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
}

const sidebarCollectionSelect = {
  id: true,
  name: true,
  isFavorite: true,
  items: {
    select: {
      item: {
        select: {
          itemType: {
            select: { id: true, color: true },
          },
        },
      },
    },
  },
} as const;

function mapSidebarCollections(
  collections: Awaited<ReturnType<typeof prisma.collection.findMany<{ select: typeof sidebarCollectionSelect }>>>
): SidebarCollection[] {
  return collections.map((col) => {
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
}

export async function getSidebarCollections(userId: string): Promise<{
  favorites: SidebarCollection[];
  recents: SidebarCollection[];
}> {
  const [favoriteRows, recentRows] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: sidebarCollectionSelect,
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: sidebarCollectionSelect,
    }),
  ]);

  return {
    favorites: mapSidebarCollections(favoriteRows),
    recents: mapSidebarCollections(recentRows),
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

export async function getAllCollectionsForUser(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
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

    const typeCounts = new Map<string, { count: number; icon: string; color: string }>();
    for (const type of itemTypes) {
      const existing = typeCounts.get(type.id);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(type.id, { count: 1, icon: type.icon, color: type.color });
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

export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: ItemWithType[];
}

export async function getCollectionDetail(
  collectionId: string,
  userId: string,
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      items: {
        orderBy: { item: { updatedAt: 'desc' } },
        include: {
          item: {
            include: {
              itemType: { select: { name: true, icon: true, color: true } },
              tags: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!collection) return null;

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    items: collection.items.map((ic) => ({
      id: ic.item.id,
      title: ic.item.title,
      description: ic.item.description,
      contentType: ic.item.contentType,
      content: ic.item.content,
      url: ic.item.url,
      isFavorite: ic.item.isFavorite,
      isPinned: ic.item.isPinned,
      createdAt: ic.item.createdAt,
      updatedAt: ic.item.updatedAt,
      itemType: ic.item.itemType,
      tags: ic.item.tags,
    })),
  };
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionOption {
  id: string;
  name: string;
}

export async function getUserCollections(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getUserCollectionIds(
  userId: string,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.collection.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export interface CreateCollectionInput {
  name: string;
  description: string | null;
}

export async function createCollection(
  userId: string,
  data: CreateCollectionInput,
): Promise<CollectionSummary> {
  const created = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      user: { connect: { id: userId } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return created;
}
