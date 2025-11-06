// services/lmStudioService.js
const fs = require('fs');
const path = require('path');

// Note: __dirname will be the 'services' directory
const configPath = path.join(__dirname, '..', '..', 'data', 'lmstudio-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  // Default configuration
  return {
    baseUrl: 'http://127.0.0.1:1234/v1',
    model: 'deepseek-r1-distill-qwen-32b@q2_k_l'
  };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

const lmStudioConfig = {
  getConfig: loadConfig,
  updateConfig: (newConfig) => {
    const currentConfig = loadConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    saveConfig(updatedConfig);
    return updatedConfig;
  }
};

module.exports = {
  lmStudioConfig
};