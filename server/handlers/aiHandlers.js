// handlers/aiHandlers.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getDatabase, saveDatabase } = require('../database');

// Load environment variables
const INFERENCE_SERVER_URL = process.env.INFERENCE_SERVER_URL || 'http://localhost:5002';
const INFERENCE_SERVER_API_KEY = process.env.INFERENCE_SERVER_API_KEY;

async function handleGetInferenceServerConfig() {
  const db = await getDatabase();
  const result = db.exec('SELECT base_url, model FROM lmstudio_config LIMIT 1');
  let config;
  if (result.length > 0 && result[0].values.length > 0) {
    const row = result[0].values[0];
    config = {
      base_url: row[0],
      model: row[1]
    };
  } else {
    config = {
      base_url: 'http://localhost:5002/v1',
      model: 'Qwen/Qwen3-VL-4B-Instruct'
    };
  }
  return config;
}

async function handleSaveInferenceServerConfig(config) {
  const db = await getDatabase();
  db.run(`
    INSERT OR REPLACE INTO lmstudio_config (rowid, base_url, model)
    VALUES (1, ?, ?)
  `, [config.baseUrl, config.model]);
  await saveDatabase();
  return { success: true };
}

async function handleTestInferenceServerConnection() {
  try {
    const headers = INFERENCE_SERVER_API_KEY ? { 'x-api-key': INFERENCE_SERVER_API_KEY } : {};
    const response = await axios.get(`${INFERENCE_SERVER_URL}/api/models`, {
      headers,
      timeout: 5000
    });
    return { success: response.status === 200 };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleGetInferenceServerSummary(data) {
  const { prompt, model } = data;
  try {
    const headers = INFERENCE_SERVER_API_KEY ? { 'x-api-key': INFERENCE_SERVER_API_KEY } : {};
    const response = await axios.post(`${INFERENCE_SERVER_URL}/api/inference`, {
      model_path: model || 'Manojb/Qwen3-4B-toolcalling-gguf-codex',
      prompt: prompt,
      agent_type: 'customer-service',
      max_tokens: 500,
      temperature: 0.7
    }, { headers });

    if (response.data.success) {
      return response.data.response;
    } else {
      throw new Error(response.data.error || 'Inference failed');
    }
  } catch (error) {
    console.error('Inference server error:', error.message);
    throw new Error(`Failed to get inference: ${error.message}`);
  }
}

async function handleGetAvailableModels() {
  try {
    const headers = INFERENCE_SERVER_API_KEY ? { 'x-api-key': INFERENCE_SERVER_API_KEY } : {};
    const response = await axios.get(`${INFERENCE_SERVER_URL}/api/models`, { headers });
    return response.data.loaded_models || [];
  } catch (err) {
    console.error('Failed to fetch models from inference server:', err.message);
    // Return some default models if server is unreachable
    return [
      'Manojb/Qwen3-4B-toolcalling-gguf-codex',
      'Qwen/Qwen3-VL-8B-Instruct',
      'microsoft/phi-3.5-mini-instruct'
    ];
  }
}

async function handleDispatchAITask(taskType, input) {
  const db = await getDatabase();
  try {
    const dbResult = db.exec('SELECT agent_type, model_name FROM agent_config');
    const agentConfigs = {};
    if (dbResult.length > 0) {
      dbResult[0].values.forEach(row => {
        agentConfigs[row[0]] = row[1];
      });
    }

    const agentTaskMapping = [
      {
        agentType: 'Analyst',
        tasks: ['risk-assessment', 'resource-allocation', 'commit-analysis', 'read-code'],
        outputDir: path.join(__dirname, '../ai_outputs/analyst_reports')
      },
      {
        agentType: 'Documentation',
        tasks: ['release-notes', 'meeting-summaries'],
        outputDir: path.join(__dirname, '../ai_outputs/documentation')
      },
      {
        agentType: 'QA',
        tasks: ['test-case-generation', 'workflow-analysis'],
        outputDir: path.join(__dirname, '../ai_outputs/qa_reports')
      },
      {
        agentType: 'Process',
        tasks: ['standup-prep', 'visual-analysis'],
        outputDir: path.join(__dirname, '../ai_outputs/process_analysis')
      }
    ];

    const agent = agentTaskMapping.find(a => a.tasks.includes(taskType));
    if (!agent) {
      throw new Error(`No agent configured for task type: ${taskType}`);
    }

    const modelName = agentConfigs[agent.agentType];
    if (!modelName) {
      throw new Error(`No model configured for agent: ${agent.agentType}`);
    }

    if (!fs.existsSync(agent.outputDir)) {
      fs.mkdirSync(agent.outputDir, { recursive: true });
    }

    let prompt;
    let agentType = 'customer-service'; // Default agent type

    switch (taskType) {
      case 'risk-assessment':
        prompt = `Analyze these project risks:\n${JSON.stringify(input, null, 2)}\nProvide a detailed risk assessment report.`;
        agentType = 'analyst';
        break;
      case 'resource-allocation':
        prompt = `Analyze these resource requirements:\n${JSON.stringify(input, null, 2)}\nProvide optimized resource allocation suggestions.`;
        agentType = 'project-manager';
        break;
      case 'release-notes':
        prompt = `Generate release notes for these changes:\n${JSON.stringify(input, null, 2)}`;
        agentType = 'documentation';
        break;
      case 'meeting-summaries':
        prompt = `Summarize this meeting content:\n${JSON.stringify(input, null, 2)}\nInclude key decisions and action items.`;
        agentType = 'secretary';
        break;
      case 'test-case-generation':
        prompt = `Generate test cases for:\n${JSON.stringify(input, null, 2)}`;
        agentType = 'qa-engineer';
        break;
      case 'workflow-analysis':
        prompt = `Analyze this workflow:\n${JSON.stringify(input, null, 2)}\nIdentify bottlenecks and suggest improvements.`;
        agentType = 'process-engineer';
        break;
      case 'standup-prep':
        prompt = `Prepare standup notes for:\n${JSON.stringify(input, null, 2)}`;
        agentType = 'scrum-master';
        break;
      case 'visual-analysis':
        prompt = `Analyze these visual elements:\n${JSON.stringify(input, null, 2)}`;
        agentType = 'designer';
        break;
      case 'commit-analysis':
        prompt = `Analyze the following code changes and generate a concise, conventional commit message:\n\n${input}`;
        agentType = 'developer';
        break;
      case 'read-code':
        prompt = `Analyze the following code and provide a summary of its functionality, potential bugs, and suggestions for improvement:\n\n${input}`;
        agentType = 'code-reviewer';
        break;
      default:
        throw new Error(`Unsupported task type: ${taskType}`);
    }

    const headers = INFERENCE_SERVER_API_KEY ? { 'x-api-key': INFERENCE_SERVER_API_KEY } : {};
    const response = await axios.post(`${INFERENCE_SERVER_URL}/api/inference`, {
      model_path: modelName,
      prompt: prompt,
      agent_type: agentType,
      max_tokens: 500,
      temperature: 0.7
    }, { headers });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Inference failed');
    }

    const result = response.data.response;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(agent.outputDir, `${taskType}_${timestamp}.txt`);
    fs.writeFileSync(outputFile, result);

    return {
      model: modelName,
      outputPath: outputFile,
      status: 'completed',
      tool_calls: response.data.tool_calls || []
    };

  } catch (error) {
    return {
      status: 'failed',
      error: error.message
    };
  }
}

async function handleGetEmbeddingConfig() {
  const db = await getDatabase();
  const result = db.exec('SELECT base_url, model_name FROM embedding_config LIMIT 1');
  if (result.length > 0 && result[0].values.length > 0) {
    const row = result[0].values[0];
    return {
      base_url: row[0],
      model_name: row[1]
    };
  }
  return {
    base_url: 'http://127.0.0.1:5003',
    model_name: 'Qwen/Qwen3-Embedding-4B'
  };
}

async function handleSaveEmbeddingConfig(config) {
  const db = await getDatabase();
  db.run(`
    INSERT OR REPLACE INTO embedding_config (id, base_url, model_name, updated_at)
    VALUES (1, ?, ?, CURRENT_TIMESTAMP)
  `, [config.baseUrl, config.modelName]);
  await saveDatabase();
  return { success: true };
}

async function handleGenerateEmbedding(text) {
  try {
    const config = await handleGetEmbeddingConfig();
    const response = await axios.post(`${config.base_url}/embeddings`, {
      input: text,
      model: config.model_name
    });
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

async function handleStoreEmbedding(userId, contentType, contentId, contentText, embedding) {
  const db = await getDatabase();
  const config = await handleGetEmbeddingConfig();

  db.run(`
    INSERT INTO embeddings (user_id, content_type, content_id, content_text, embedding, model_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    userId,
    contentType,
    contentId,
    contentText,
    JSON.stringify(embedding),
    config.model_name
  ]);

  await saveDatabase();
  return { success: true };
}

async function handleGetEmbeddings(userId, contentType = null, limit = 100) {
  const db = await getDatabase();
  let query = 'SELECT * FROM embeddings WHERE user_id = ?';
  const params = [userId];

  if (contentType) {
    query += ' AND content_type = ?';
    params.push(contentType);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const result = db.exec(query, params);
  return result[0] ? result[0].values.map(row => ({
    id: row[0],
    user_id: row[1],
    content_type: row[2],
    content_id: row[3],
    content_text: row[4],
    embedding: JSON.parse(row[5]),
    model_name: row[6],
    created_at: row[7],
    updated_at: row[8]
  })) : [];
}

function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function handleSemanticSearch(userId, queryText, contentType = null, limit = 10) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await handleGenerateEmbedding(queryText);

    // Get all relevant embeddings
    const embeddings = await handleGetEmbeddings(userId, contentType, 1000);

    // Calculate similarities
    const similarities = embeddings.map(emb => ({
      ...emb,
      similarity: cosineSimilarity(queryEmbedding, emb.embedding)
    }));

    // Sort by similarity (descending) and return top results
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, limit);
  } catch (error) {
    console.error('Semantic search failed:', error.message);
    throw new Error(`Semantic search failed: ${error.message}`);
  }
}

async function handleEmbedContent(userId, contentType, contentId, contentText) {
  try {
    // Check if embedding already exists
    const db = await getDatabase();
    const existing = db.exec(
      'SELECT id FROM embeddings WHERE user_id = ? AND content_type = ? AND content_id = ?',
      [userId, contentType, contentId]
    );

    if (existing.length > 0 && existing[0].values.length > 0) {
      // Update existing embedding
      const embedding = await handleGenerateEmbedding(contentText);
      db.run(`
        UPDATE embeddings
        SET content_text = ?, embedding = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND content_type = ? AND content_id = ?
      `, [
        contentText,
        JSON.stringify(embedding),
        userId,
        contentType,
        contentId
      ]);
    } else {
      // Create new embedding
      const embedding = await handleGenerateEmbedding(contentText);
      await handleStoreEmbedding(userId, contentType, contentId, contentText, embedding);
    }

    await saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Content embedding failed:', error.message);
    throw new Error(`Failed to embed content: ${error.message}`);
  }
}

async function handleTranscribeAudio(audioData) {
  try {
    // This is a placeholder for transcription service integration
    // In a real implementation, you would send the audio data to a service like:
    // - OpenAI Whisper API
    // - Google Speech-to-Text
    // - Azure Speech Services
    // - AWS Transcribe

    // For now, return a mock transcript
    const mockTranscript = `Meeting Transcript - ${new Date().toISOString()}

This is a placeholder transcript. In a production implementation, this would be generated by processing the actual audio recording through a speech-to-text service.

Key points discussed:
- Project timeline review
- Task assignments
- Next steps and action items

The transcription service would analyze the audio file and convert speech to text with timestamps and speaker identification.`;

    return mockTranscript;
  } catch (error) {
    console.error('Audio transcription failed:', error.message);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

module.exports = {
  handleGetInferenceServerConfig: handleGetInferenceServerConfig,
  handleSaveInferenceServerConfig: handleSaveInferenceServerConfig,
  handleTestInferenceServerConnection: handleTestInferenceServerConnection,
  handleGetInferenceServerSummary: handleGetInferenceServerSummary,
  handleGetAvailableModels,
  handleDispatchAITask,
  handleGetEmbeddingConfig,
  handleSaveEmbeddingConfig,
  handleGenerateEmbedding,
  handleStoreEmbedding,
  handleGetEmbeddings,
  handleSemanticSearch,
  handleEmbedContent,
  handleTranscribeAudio
};