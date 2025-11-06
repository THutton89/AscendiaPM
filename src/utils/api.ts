export async function api(endpoint: string, data?: any) {
  console.log(`API call to ${endpoint} with data:`, data);
  if (!window.electronAPI) {
    console.error('Electron API not available');
    throw new Error('Electron API not available');
  }

  try {
    const response = await window.electronAPI[endpoint](data);
    console.log(`API response from ${endpoint}:`, response);
    return response;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}