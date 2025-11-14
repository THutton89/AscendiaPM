
import { api } from './api';

export interface LMStudioConfig {
  baseUrl: string;
  model: string;
  gpu?: number;
  apiKey?: string;
}

export async function loadConfig(): Promise<LMStudioConfig> {
  try {
    return await api('lmstudio-get-config');
  } catch (error) {
    console.error('Error loading config:', error);
    return {
      baseUrl: 'http://127.0.0.1:1234/v1',
      model: 'deepseek-r1-distill-qwen-32b@q2_k_l'
    };
  }
}

export async function saveConfig(config: LMStudioConfig): Promise<void> {
  try {
    await api('lmstudio-update-config', config);
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

export async function updateConfig(newConfig: Partial<LMStudioConfig>): Promise<LMStudioConfig> {
  const currentConfig = await loadConfig();
  const updatedConfig = { ...currentConfig, ...newConfig };
  await saveConfig(updatedConfig);
  return updatedConfig;
}