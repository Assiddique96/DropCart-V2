import prisma from "src/db";

const authSeller = async (userId, preferredStoreId) => {
  try {
    if (!userId) return false;
    const stores = await prisma.store.findMany({
      where: { userId, status: "approved" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!stores.length) {
      return false;
    }

    if (preferredStoreId && stores.some((store) => store.id === preferredStoreId)) {
      return preferredStoreId;
    }

    return stores[0].id;
  } catch (error) {
    console.error(error)
    return false
  }
};

export default authSeller
