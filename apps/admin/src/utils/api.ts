const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const getAssetUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};
