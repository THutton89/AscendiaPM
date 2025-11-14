import { api } from './api';

class _LMStudioClient {
  async getSummary(prompt: string, model?: string): Promise<string> {
    return api('lmstudio-get-summary', { prompt, model });
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return api('lmstudio-test-connection');
  }

  async getAvailableModels(): Promise<string[]> {
    return api('lmstudio-get-available-models');
  }
}

export const lmStudioClient = new _LMStudioClient();
export default _LMStudioClient;


