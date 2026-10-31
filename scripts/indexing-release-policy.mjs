// Strict build-time release gate. A preview deployment is always noindex,
// even when production-related variables happen to be present on the branch.
const version=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function indexableRelease(env) {
 const browserVersion=env.VITE_APPROVED_CATALOG_VERSION;
 const serverVersion=env.RRS_APPROVED_PUBLIC_CATALOG_VERSION;
 return env.VERCEL_ENV==='production' &&
   env.RRS_PRODUCTION_RELEASE_VERIFIED==='true' &&
   env.RRS_PRODUCTION_INDEXABLE==='true' &&
   env.VITE_PUBLIC_CATALOG_MODE==='independent' &&
   env.RRS_PUBLIC_CATALOG_MODE==='independent' &&
   env.RRS_PUBLIC_CATALOG_ENABLED==='true' &&
   typeof browserVersion==='string' && version.test(browserVersion) &&
   typeof serverVersion==='string' && browserVersion.toLowerCase()===serverVersion.toLowerCase();
}
