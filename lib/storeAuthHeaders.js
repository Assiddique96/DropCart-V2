export const ACTIVE_STORE_KEY = "dropcart_active_store_id";

export async function getStoreAuthHeaders(getToken) {
  const token = await getToken();
  const activeStoreId =
    typeof window !== "undefined" ? localStorage.getItem(ACTIVE_STORE_KEY) : null;

  return {
    Authorization: `Bearer ${token}`,
    ...(activeStoreId ? { "x-store-id": activeStoreId } : {}),
  };
}
