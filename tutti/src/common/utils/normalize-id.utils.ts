export const normalizeId = (
  id: number | string | null | undefined,
): string => {
  if (id === null || id === undefined || id === "") return "";
  return String(id);
};

