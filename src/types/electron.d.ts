interface Window {
  electronAPI: {
    dbQuery: (query: string, params?: any[] | Record<string, any>) => Promise<any>;
    dispatchAITask: (taskType: string, params: string) => Promise<any>;
    // LM Studio related APIs
    getLmstudioConfig: () => Promise<{ baseUrl: string; model: string; }>;
    saveLmstudioConfig: (config: { baseUrl?: string; model?: string; }) => Promise<boolean>;
    testLmstudioConnection: () => Promise<{ success: boolean; error?: string }>;
    getLmstudioSummary: (args: { prompt: string; model?: string }) => Promise<string>;
    getAvailableModels: () => Promise<string[]>;
    getAgentConfig: () => Promise<Record<string, string>>;
    saveAgentConfig: (config: { agentType: string; modelName: string }) => Promise<{ success: boolean }>;

    // Embedding Service APIs
    getEmbeddingConfig: () => Promise<{ base_url: string; model_name: string }>;
    saveEmbeddingConfig: (config: { baseUrl: string; modelName: string }) => Promise<{ success: boolean }>;
    generateEmbedding: (text: string) => Promise<number[]>;
    storeEmbedding: (data: { contentType: string; contentId: number; contentText: string; embedding: number[] }) => Promise<{ success: boolean }>;
    getEmbeddings: (params?: { contentType?: string; limit?: number }) => Promise<Array<{
      id: number;
      user_id: number;
      content_type: string;
      content_id: number;
      content_text: string;
      embedding: number[];
      model_name: string;
      created_at: string;
      updated_at: string;
    }>>;
    semanticSearch: (params: { query: string; contentType?: string; limit?: number }) => Promise<Array<{
      id: number;
      user_id: number;
      content_type: string;
      content_id: number;
      content_text: string;
      embedding: number[];
      model_name: string;
      created_at: string;
      updated_at: string;
      similarity: number;
    }>>;
    embedContent: (data: { contentType: string; contentId: number; contentText: string }) => Promise<{ success: boolean }>;
    transcribeAudio: (audioData: any) => Promise<string>;
    createCommit: (message: string) => Promise<string>;
    sendCode: (code: string) => void;
    onRequestCode: (callback: () => void) => void;
    removeRequestCodeListener: (callback: () => void) => void;
    readCodeSandbox: () => Promise<string>;
    // Git related APIs
    gitStore: (type: 'blob' | 'tree' | 'commit' | 'tag', content: any) => Promise<string>;
    gitRead: (oid: string) => Promise<any>;
    // Bug related APIs
    createBug: (bug: any) => Promise<string>;
    getBug: (oid: string) => Promise<any>;
    updateBug: (data: { oid: string; updates: any }) => Promise<string>;
    listBugs: () => Promise<any[]>;
    // Auth related APIs
    signup: (data: any) => Promise<any>;
    login: (data: any) => Promise<any>;
    logout: (userId: number) => Promise<{ success: boolean }>;
    googleOAuthSignin: () => Promise<{ success: boolean; user?: any; error?: string }>;
    // Task management APIs
    createTask: (task: {
      project_id?: number;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string;
    }) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateTask: (data: {
      id: number;
      updates: {
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        due_date?: string;
      }
    }) => Promise<{ success: boolean; error?: string }>;
    getTasks: (projectId?: number) => Promise<{
      success: boolean;
      tasks?: Array<{
        id: number;
        project_id?: number;
        title: string;
        description?: string;
        status: string;
        priority: string;
        due_date?: string;
        created_at: string;
      }>;
      error?: string;
    }>;
    deleteTask: (taskId: number) => Promise<{ success: boolean; error?: string }>;

    // Project management APIs
    createProject: (project: {
      name: string;
      description?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    }, options?: { apiKey?: string }) => Promise<{ success: boolean; id?: number; error?: string }>;

    getProjects: (options?: { apiKey?: string }) => Promise<{
      success: boolean;
      projects?: Array<{
        id: number;
        name: string;
        description?: string;
        status: string;
        start_date?: string;
        end_date?: string;
        created_at: string;
      }>;
      error?: string;
    }>;

    updateProject: (data: {
      id: number;
      updates: {
        name?: string;
        description?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
      }
    }, options?: { apiKey?: string }) => Promise<{ success: boolean; error?: string }>;

    deleteProject: (projectId: number, options?: { apiKey?: string }) => Promise<{ success: boolean; error?: string }>;

    getProjectStats: (projectId: number, options?: { apiKey?: string }) => Promise<{
      success: boolean;
      stats?: {
        todo_count: number;
        in_progress_count: number;
        done_count: number;
      };
      error?: string;
    }>;

    // API Key management APIs
    createApiKey: (data: { name: string; userId: number }) => Promise<{ id: number; key: string; name: string; userId: number }>;
    getApiKeys: (userId?: number) => Promise<Array<{
      id: number;
      key: string;
      name: string;
      user_id: number;
      active: number;
      created_at: string;
      last_used_at?: string;
    }>>;
    deleteApiKey: (id: number) => Promise<{ success: boolean }>;

    // Settings APIs
    getSettings: (params: { category?: string; userId?: number }) => Promise<Array<{
      id: number;
      category: string;
      key: string;
      value: any;
      user_id?: number;
      created_at: string;
      updated_at: string;
    }>>;
    saveSetting: (setting: { category: string; key: string; value: any; user_id?: number }) => Promise<{ id: number }>;
    updateSetting: (params: { id: number; setting: { value: any } }) => Promise<{ success: boolean }>;
    deleteSetting: (id: number) => Promise<{ success: boolean }>;
  };
}
