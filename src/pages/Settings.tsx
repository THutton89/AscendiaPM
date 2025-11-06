import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
  const [agentConfig, setAgentConfig] = useState<Record<string, string>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const agentTypes = ['Analyst', 'Documentation', 'QA', 'Process'];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [models, config] = await Promise.all([
          window.electronAPI.getAvailableModels(),
          window.electronAPI.getAgentConfig(),
        ]);
        setAvailableModels(models);
        setAgentConfig(config);
      } catch (error) {
        console.error('Failed to load settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleModelChange = (agentType: string, modelName: string) => {
    const newConfig = { ...agentConfig, [agentType]: modelName };
    setAgentConfig(newConfig);
    // Note: We no longer save immediately - only when "Save Configuration" is clicked
  };

  const handleLoadModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await window.electronAPI.getAvailableModels();
      setAvailableModels(models);
      setSaveStatus('Models loaded successfully');
    } catch (error) {
      console.error('Failed to load models:', error);
      setSaveStatus('Failed to load models');
    } finally {
      setIsLoadingModels(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
      // Only save configurations that have a selected model (not empty string)
      const validConfigs = Object.entries(agentConfig).filter(
        ([agentType, modelName]) =>
          typeof modelName === 'string' && modelName.trim() !== ''
      );

      if (validConfigs.length === 0) {
        setSaveStatus('No models selected to save');
        setIsSaving(false);
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      const savePromises = validConfigs.map(([agentType, modelName]) =>
        window.electronAPI.saveAgentConfig({ agentType, modelName })
      );
      await Promise.all(savePromises);
      setSaveStatus('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setSaveStatus('Failed to save configuration');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (isLoading) return <div className="settings-container">Loading...</div>;

  return (
    <div className="settings-container">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>Agent Configuration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure which AI models to use for different agent types. Load available models from LM Studio first, then assign them to agents and click "Save Configuration" to persist your changes.
        </p>

        <div className="mb-4 flex gap-2">
          <button
            onClick={handleLoadModels}
            disabled={isLoadingModels}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
          >
            {isLoadingModels ? 'Loading Models...' : 'Load Models from LM Studio'}
          </button>

          <button
            onClick={handleSaveConfiguration}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {saveStatus && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            saveStatus.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {saveStatus}
          </div>
        )}

        <div className="settings-form">
          {agentTypes.map((agentType) => (
            <div className="form-group" key={agentType}>
              <label>{agentType} Agent Model</label>
              <select
                value={agentConfig[agentType] || ''}
                onChange={(e) => handleModelChange(agentType, e.target.value)}
                className="w-full p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
              >
                <option value="">Select a model</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h2>General Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure general application settings and preferences.
        </p>

        <div className="mb-4">
          <Link
            to="/api-keys"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Manage API Keys
          </Link>
          <p className="text-sm text-gray-500 mt-2">
            Create and manage API keys for programmatic access to the application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
