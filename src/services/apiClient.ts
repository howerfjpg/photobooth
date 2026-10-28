export const getApiUrl = (path: string) => {
  // If running in browser/web locally, VITE_API_URL might be empty, so it uses relative paths.
  // Set VITE_API_URL only when the frontend and API are hosted on different origins.
  const baseUrl = (import.meta as any).env?.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};
