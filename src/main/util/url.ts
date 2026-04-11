/**
 * Normalise un endpoint en supprimant le host et en nettoyant le path
 */
export const normalizeEndpoint = (endpoint: string): string => {
  let normalizedEndpoint: string
  try {
    const url = new URL(endpoint)
    // Normaliser le pathname pour éviter les doubles slashes
    normalizedEndpoint = url.pathname
  } catch {
    // Si ce n'est pas une URL complète, considérer que c'est déjà un path
    // Normaliser pour éviter les doubles slashes
    normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }

  // Nettoyer les doubles slashes et supprimer les trailing slashes (sauf pour la racine)
  const cleaned = normalizedEndpoint.replace(/\/+/g, '/')
  return cleaned === '/' ? '/' : cleaned.replace(/\/$/, '')
}

/**
 * Normalise les query parameters pour être déterministe
 */
export const normalizeQueryParams = (
  params?: Record<string, string>,
): Record<string, string> => {
  if (!params || Object.keys(params).length === 0) return {}

  const result: Record<string, string> = {}
  Object.keys(params)
    .sort()
    .forEach((key) => {
      result[key] = params[key]
    })
  return result
}
