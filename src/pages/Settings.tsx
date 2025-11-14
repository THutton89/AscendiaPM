import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [agentConfig, setAgentConfig] = useState<Record<string, string>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Organization settings
  const [organization, setOrganization] = useState<any>(null);
  const [workHoursStart, setWorkHoursStart] = useState('07:00');
  const [workHoursEnd, setWorkHoursEnd] = useState('17:00');
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSaveStatus, setOrgSaveStatus] = useState<string>('');

  // Organization creation
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [createOrgStatus, setCreateOrgStatus] = useState<string>('');

  // Team management
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string>('');

  const agentTypes = ['Analyst', 'Documentation', 'QA', 'Process'];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Only load organization data if user is authenticated
        const promises = [
          api('inference-server-get-available-models'),
          api('get-inference-server-config'),
        ];

        if (user) {
          promises.push(api('get-organization').catch(() => null));
          promises.push(api('get-organization-members').catch(() => null));
        }

        const results = await Promise.all(promises);
        const [models, config] = results;
        setAvailableModels(models);
        setAgentConfig(config);

        if (user && results.length > 2) {
          const [orgData, teamData] = results.slice(2);

          if (orgData?.organization) {
            setOrganization(orgData.organization);
            setWorkHoursStart(orgData.organization.workHoursStart || '07:00');
            setWorkHoursEnd(orgData.organization.workHoursEnd || '17:00');
          }

          if (teamData?.members) {
            setTeamMembers(teamData.members);
          }
        }
      } catch (error) {
        console.error('Failed to load settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  const handleModelChange = (agentType: string, modelName: string) => {
    const newConfig = { ...agentConfig, [agentType]: modelName };
    setAgentConfig(newConfig);
    // Note: We no longer save immediately - only when "Save Configuration" is clicked
  };

  const handleLoadModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await api('inference-server-get-available-models');
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
        api('save-inference-server-config', { agentType, modelName })
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

  const handleSaveOrganizationSettings = async () => {
    setIsSavingOrg(true);
    setOrgSaveStatus('Saving...');
    try {
      await api('update-organization', {
        workHoursStart,
        workHoursEnd
      });
      setOrgSaveStatus('Organization settings saved successfully');
    } catch (error) {
      console.error('Failed to save organization settings:', error);
      setOrgSaveStatus('Failed to save organization settings');
    } finally {
      setIsSavingOrg(false);
      setTimeout(() => setOrgSaveStatus(''), 3000);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteStatus('Sending invitation...');
    try {
      await api('invite-user-to-organization', { email: inviteEmail.trim() });
      setInviteStatus('Invitation sent successfully');
      setInviteEmail('');
      // Refresh team members
      const teamData = await api('get-organization-members');
      if (teamData?.members) {
        setTeamMembers(teamData.members);
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      setInviteStatus('Failed to send invitation');
    } finally {
      setIsInviting(false);
      setTimeout(() => setInviteStatus(''), 3000);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      await api('update-user-role', { userId, role: newRole });
      // Refresh team members
      const teamData = await api('get-organization-members');
      if (teamData?.members) {
        setTeamMembers(teamData.members);
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) return;

    try {
      await api('remove-user-from-organization', { userId });
      // Refresh team members
      const teamData = await api('get-organization-members');
      if (teamData?.members) {
        setTeamMembers(teamData.members);
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) return;

    setIsCreatingOrg(true);
    setCreateOrgStatus('Creating organization...');
    try {
      const result = await api('create-organization', {
        name: orgName.trim(),
        description: orgDescription.trim(),
        workHoursStart,
        workHoursEnd
      });

      setCreateOrgStatus('Organization created successfully!');
      setOrgName('');
      setOrgDescription('');

      // Refresh organization data
      const orgData = await api('get-organization');
      if (orgData?.organization) {
        setOrganization(orgData.organization);
      }

      // Refresh team members
      const teamData = await api('get-organization-members');
      if (teamData?.members) {
        setTeamMembers(teamData.members);
      }
    } catch (error) {
      console.error('Failed to create organization:', error);
      setCreateOrgStatus('Failed to create organization');
    } finally {
      setIsCreatingOrg(false);
      setTimeout(() => setCreateOrgStatus(''), 3000);
    }
  };

  if (isLoading) return <div className="settings-container">Loading...</div>;

  return (
    <div className="settings-container">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>Agent Configuration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure which AI models to use for different agent types. Load available models from the inference server first, then assign them to agents and click "Save Configuration" to persist your changes.
        </p>

        <div className="mb-4 flex gap-2">
          <button
            onClick={handleLoadModels}
            disabled={isLoadingModels}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
          >
            {isLoadingModels ? 'Loading Models...' : 'Load Models from Inference Server'}
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

      {user && (
        <div className="settings-section">
          <h2>Organization & Team</h2>
          <p className="text-sm text-gray-600 mb-4">
            {organization
              ? "Manage your organization settings and team members."
              : "Create an organization to collaborate with team members, or continue using the app individually."
            }
          </p>

        {!organization ? (
          /* Organization Creation */
          <div>
            <h3 className="text-lg font-medium mb-4">Create Organization</h3>
            <div className="settings-form">
              <div className="form-group">
                <label>Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Describe your organization"
                  rows={3}
                  className="w-full p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>

              <div className="form-group">
                <label>Default Work Hours Start</label>
                <input
                  type="time"
                  value={workHoursStart}
                  onChange={(e) => setWorkHoursStart(e.target.value)}
                  className="w-full p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>

              <div className="form-group">
                <label>Default Work Hours End</label>
                <input
                  type="time"
                  value={workHoursEnd}
                  onChange={(e) => setWorkHoursEnd(e.target.value)}
                  className="w-full p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={handleCreateOrganization}
                disabled={isCreatingOrg || !orgName.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
              >
                {isCreatingOrg ? 'Creating...' : 'Create Organization'}
              </button>
            </div>

            {createOrgStatus && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                createOrgStatus.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {createOrgStatus}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Individual Use</h4>
              <p className="text-sm text-blue-700">
                You can continue using Axsendia PM without an organization. All your projects, tasks, and meetings will be private to you.
                Create an organization later if you want to collaborate with team members.
              </p>
            </div>
          </div>
        ) : (
          /* Organization Management */
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Organization: {organization.name}</h3>
              {organization.description && (
                <p className="text-sm text-gray-600">{organization.description}</p>
              )}
            </div>

            {/* Organization Settings */}
            <div className="mb-8">
              <h4 className="text-md font-medium mb-3">Work Hours Settings</h4>
              <div className="settings-form">
                <div className="form-group">
                  <label>Work Hours Start</label>
                  <input
                    type="time"
                    value={workHoursStart}
                    onChange={(e) => setWorkHoursStart(e.target.value)}
                    className="w-full p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  />
                </div>

                <div className="form-group">
                  <label>Work Hours End</label>
                  <input
                    type="time"
                    value={workHoursEnd}
                    onChange={(e) => setWorkHoursEnd(e.target.value)}
                    className="w-full p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  />
                </div>
              </div>

              <div className="mb-4 flex gap-2">
                <button
                  onClick={handleSaveOrganizationSettings}
                  disabled={isSavingOrg}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                >
                  {isSavingOrg ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {orgSaveStatus && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                  orgSaveStatus.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {orgSaveStatus}
                </div>
              )}
            </div>

            {/* Team Management */}
            <div>
              <h4 className="text-md font-medium mb-3">Team Management</h4>

              {/* Invite User */}
              <div className="mb-6">
                <h5 className="text-sm font-medium mb-2">Invite Team Member</h5>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  />
                  <button
                    onClick={handleInviteUser}
                    disabled={isInviting || !inviteEmail.trim()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                  >
                    {isInviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
                {inviteStatus && (
                  <div className={`mt-2 text-sm ${inviteStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {inviteStatus}
                  </div>
                )}
              </div>

              {/* Team Members */}
              <div>
                <h5 className="text-sm font-medium mb-4">Team Members ({teamMembers.length})</h5>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                        {member.is_owner && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Owner</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateUserRole(member.id, e.target.value)}
                          disabled={member.is_owner}
                          className="p-2 border rounded focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                          <option value="user">User</option>
                        </select>
                        {!member.is_owner && (
                          <button
                            onClick={() => handleRemoveUser(member.id)}
                            className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {teamMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No team members yet. Invite someone to get started!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

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
