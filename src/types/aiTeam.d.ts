declare module '../services/aiTeamService' {
  interface AITaskResult {
    model: string;
    outputPath: string;
    status: 'dispatched' | 'completed' | 'failed';
    error?: string;
  }

  interface AITaskRequest {
    taskType: string;
    input: any;
  }

  export const aiTeamService: {
    dispatchTask(taskType: string, input: any): Promise<AITaskResult>;
  };
}