export function isCatalogPublished(status: string | null | undefined): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return !normalized || normalized === 'active' || normalized === 'published';
}
