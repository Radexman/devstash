import { prisma } from '@/lib/prisma';
import type { ItemWithType } from '@/lib/db/items';
import { DASHBOARD_COLLECTIONS_LIMIT } from '@/lib/pagination';

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
    take: DASHBOARD_COLLECTIONS_LIMIT,
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

export interface CollectionDetailPage {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: ItemWithType[];
  total: number;
}

export async function getCollectionDetailPage(
  collectionId: string,
  userId: string,
  skip: number,
  take: number,
): Promise<CollectionDetailPage | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!collection) return null;

  const [rows, total] = await Promise.all([
    prisma.itemCollection.findMany({
      where: { collectionId },
      orderBy: [
        { item: { isPinned: 'desc' } },
        { item: { updatedAt: 'desc' } },
      ],
      skip,
      take,
      select: {
        item: {
          select: {
            id: true,
            title: true,
            description: true,
            contentType: true,
            content: true,
            url: true,
            isFavorite: true,
            isPinned: true,
            createdAt: true,
            updatedAt: true,
            itemType: { select: { name: true, icon: true, color: true } },
            tags: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.itemCollection.count({ where: { collectionId } }),
  ]);

  return {
    ...collection,
    items: rows.map((r) => r.item),
    total,
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

export interface UpdateCollectionInput {
  name: string;
  description: string | null;
}

export async function updateCollection(
  collectionId: string,
  userId: string,
  data: UpdateCollectionInput,
): Promise<CollectionSummary | null> {
  const result = await prisma.collection.updateMany({
    where: { id: collectionId, userId },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  if (result.count === 0) return null;

  return prisma.collection.findUnique({
    where: { id: collectionId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteCollection(
  collectionId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.collection.deleteMany({
    where: { id: collectionId, userId },
  });
  return result.count > 0;
}

export async function toggleCollectionFavorite(
  collectionId: string,
  userId: string,
): Promise<{ isFavorite: boolean } | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { isFavorite: true },
  });
  if (!existing) return null;

  const next = !existing.isFavorite;
  await prisma.collection.update({
    where: { id: collectionId },
    data: { isFavorite: next },
  });
  return { isFavorite: next };
}
