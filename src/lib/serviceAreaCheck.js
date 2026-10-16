// Frontend service-area matching logic.
// Backend equivalent lives in base44/shared/serviceAreaCheck.ts.

export function isLocationInServiceArea(city, zip, areas) {
  if (!city && !zip) return false;
  const cityLower = city?.toLowerCase().trim();
  const zipClean = zip?.trim();

  for (const area of areas) {
    if (cityLower && area.city?.toLowerCase() === cityLower) return true;
    if (zipClean && (area.zip_codes || []).includes(zipClean)) return true;
  }
  return false;
}