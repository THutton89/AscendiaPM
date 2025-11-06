import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { lmStudioClient } from '../utils/lmStudioClient';

// Ensure output directories exist
const OUTPUT_BASE = join(__dirname, '../../ai_outputs');
const OUTPUT_DIRS = [
  'analyst_reports',
  'documentation', 
  'qa_reports',
  'process_analysis'
];

OUTPUT_DIRS.forEach(dir => {
  const fullPath = join(OUTPUT_BASE, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }
});

interface AIModel {
  name: string;
  gpu: number;
  tasks: string[];
  outputDir: string;
}

export class AITeamService {
  private agentTaskMapping = [
    {
      agentType: 'Analyst',
      tasks: ['risk-assessment', 'resource-allocation', 'commit-analysis', 'read-code'],
      outputDir: join(OUTPUT_BASE, 'analyst_reports')
    },
    {
      agentType: 'Documentation',
      tasks: ['release-notes', 'meeting-summaries'],
      outputDir: join(OUTPUT_BASE, 'documentation')
    },
    {
      agentType: 'QA',
      tasks: ['test-case-generation', 'workflow-analysis'],
      outputDir: join(OUTPUT_BASE, 'qa_reports')
    },
    {
      agentType: 'Process',
      tasks: ['standup-prep', 'visual-analysis'],
      outputDir: join(OUTPUT_BASE, 'process_analysis')
    }
  ];

  public async dispatchTask(taskType: string, input: any) {
    const agent = this.agentTaskMapping.find(a => a.tasks.includes(taskType));
    if (!agent) {
      throw new Error(`No agent configured for task type: ${taskType}`);
    }

    const agentConfig = await window.electronAPI.getAgentConfig();
    const modelName = agentConfig[agent.agentType];

    if (!modelName) {
      throw new Error(`No model configured for agent: ${agent.agentType}`);
    }

    console.log(`Routing ${taskType} task to ${modelName}`);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = join(agent.outputDir, `${taskType}_${timestamp}.txt`);

      // Generate task-specific prompt
      let prompt: string;
      let result: string;
      
      switch (taskType) {
        case 'risk-assessment':
          prompt = `Analyze these project risks:\n${JSON.stringify(input, null, 2)}\nProvide a detailed risk assessment report.`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'resource-allocation':
          prompt = `Analyze these resource requirements:\n${JSON.stringify(input, null, 2)}\nProvide optimized resource allocation suggestions.`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'release-notes':
          prompt = `Generate release notes for these changes:\n${JSON.stringify(input, null, 2)}`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'meeting-summaries':
          prompt = `Summarize this meeting content:\n${JSON.stringify(input, null, 2)}\nInclude key decisions and action items.`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'test-case-generation':
          prompt = `Generate test cases for:\n${JSON.stringify(input, null, 2)}`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'workflow-analysis':
          prompt = `Analyze this workflow:\n${JSON.stringify(input, null, 2)}\nIdentify bottlenecks and suggest improvements.`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'standup-prep':
          prompt = `Prepare standup notes for:\n${JSON.stringify(input, null, 2)}`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'visual-analysis':
          prompt = `Analyze these visual elements:\n${JSON.stringify(input, null, 2)}`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'commit-analysis':
          prompt = `Analyze the following code changes and generate a concise, conventional commit message:\n\n${input}`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        case 'read-code':
          const code = await window.electronAPI.readCodeSandbox();
          prompt = `Analyze the following code and provide a summary of its functionality, potential bugs, and suggestions for improvement:\n\n${code}`;
          result = await lmStudioClient.getSummary(prompt, modelName);
          break;
        default:
          throw new Error(`Unsupported task type: ${taskType}`);
      }

      writeFileSync(outputFile, result);
      
      return {
        model: modelName,
        outputPath: outputFile,
        status: 'completed'
      };
    } catch (error) {
      console.error(`Task ${taskType} failed:`, error);
      return {
        model: modelName,
        outputPath: '',
        status: 'failed',
        error: error.message
      };
    }
  }
}

// Singleton instance
export const aiTeamService = new AITeamService();