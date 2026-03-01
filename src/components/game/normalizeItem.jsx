/**
 * Normalize item image field to a consistent public URL string
 * Handles: image_url, image_urls[], file, asset, or raw string URL
 */
export function normalizeItemImage(item) {
  if (!item) return null;

  // Already normalized to 'image' field
  if (item.image && typeof item.image === 'string') {
    return item.image;
  }

  // Check image_urls array (newer multi-image support)
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    const url = item.image_urls[0];
    if (typeof url === 'string' && url.trim()) {
      return url;
    }
  }

  // Check image_url field (legacy single image)
  if (item.image_url && typeof item.image_url === 'string') {
    return item.image_url;
  }

  // Handle file object (shouldn't happen at runtime, but just in case)
  if (item.file && typeof item.file === 'string') {
    return item.file;
  }

  // Handle asset field
  if (item.asset && typeof item.asset === 'string') {
    return item.asset;
  }

  return null;
}

/**
 * Normalize entire item object with image field
 */
export function normalizeItem(item) {
  if (!item) return null;
  
  const image = normalizeItemImage(item);
  
  return {
    ...item,
    image: image || null
  };
}

/**
 * Normalize array of items
 */
export function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeItem);
}