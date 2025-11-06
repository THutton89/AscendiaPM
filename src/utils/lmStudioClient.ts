class _LMStudioClient {
  async getSummary(prompt: string, model?: string): Promise<string> {
    return window.electronAPI.getLmstudioSummary({ prompt, model });
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return window.electronAPI.testLmstudioConnection();
  }

  async getAvailableModels(): Promise<string[]> {
    return window.electronAPI.getAvailableModels();
  }
}

export const lmStudioClient = new _LMStudioClient();
export default _LMStudioClient;


