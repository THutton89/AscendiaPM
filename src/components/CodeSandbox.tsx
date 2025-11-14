import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface CodeSandboxProps {
  taskId: string;
  initialCode?: string;
  language?: string;
}

export function CodeSandbox({ taskId, initialCode = '', language = 'javascript' }: CodeSandboxProps) {
  const { user, token } = useAuth();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<WebrtcProvider>();
  const [code, setCode] = useState(initialCode);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState('');
  const [filePath, setFilePath] = useState('code.js');
  const [isGitConnected, setIsGitConnected] = useState(false);

  useEffect(() => {
    // Initialize Yjs document and WebRTC provider
    const ydoc = new Y.Doc();
    const yprovider = new WebrtcProvider(`task-${taskId}`, ydoc, {
      signaling: ['wss://signaling.yjs.dev']
    });

    const ytext = ydoc.getText('codemirror');
    ytext.observe(() => {
      setCode(ytext.toString());
    });

    setDoc(ydoc);
    setProvider(yprovider);

    return () => {
      yprovider.destroy();
      ydoc.destroy();
    };
  }, [taskId]);

  // Load GitHub repositories
  useEffect(() => {
    const loadGitHubRepos = async () => {
      if (user && token) {
        try {
          const result = await api('github-repos', { accessToken: token });
          if (result.success) {
            setRepositories(result.repos);
            setIsGitConnected(true);
          }
        } catch (error) {
          console.log('GitHub not connected or no repositories:', error);
          setIsGitConnected(false);
        }
      } else {
        setIsGitConnected(false);
        setRepositories([]);
      }
    };

    loadGitHubRepos();
  }, [user, token]);

  // Auto-pull when repository is selected
  useEffect(() => {
    const autoPullRepo = async () => {
      if (selectedRepo && isGitConnected && token) {
        try {
          const [owner, repo] = selectedRepo.split('/');
          const result = await api('github-repos-pull', { owner, repo, branch: selectedBranch, accessToken: token });
          if (result.success && result.files && result.files.length > 0) {
            // Load the first file or a default file
            const defaultFile = result.files.find((f: any) => f.path.endsWith('.js') || f.path.endsWith('.ts')) || result.files[0];
            if (defaultFile) {
              setCode(defaultFile.content);
              setFilePath(defaultFile.path);
            }
          }
        } catch (error) {
          console.error('Auto-pull failed:', error);
        }
      }
    };

    autoPullRepo();
  }, [selectedRepo, selectedBranch, isGitConnected, token]);

  // Note: IPC event listeners removed for web version
  // useEffect(() => {
  //   const handleRequestCode = () => {
  //     api('send-code', { code });
  //   };
  //   // Event listener setup would need to be replaced with WebSocket or similar
  //   // window.electronAPI.onRequestCode(handleRequestCode);

  //   return () => {
  //     // window.electronAPI.removeRequestCodeListener(handleRequestCode);
  //   };
  // }, [code]);

  const handleEditorChange = (value: string | undefined) => {
    if (doc && value !== undefined) {
      const ytext = doc.getText('codemirror');
      doc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, value);
      });
    }
  };

  const handleAnalyzeAndCommit = async () => {
    if (!selectedRepo) {
      alert('Please select a GitHub repository first');
      return;
    }

    if (!commitMessage.trim()) {
      alert('Please enter a commit message');
      return;
    }

    try {
      // Generate commit message using AI if not provided
      let message = commitMessage;
      if (!message.trim()) {
        const aiResult = await api('dispatch-ai-task', { taskType: 'commit-analysis', input: code });
        if (aiResult.success) {
          message = aiResult.output || 'Update code';
        }
      }

      // Commit to GitHub
      const [owner, repo] = selectedRepo.split('/');
      const result = await api('github-commit', {
        accessToken: token,
        repo: `${owner}/${repo}`,
        branch: selectedBranch,
        message: message,
        content: code,
        path: filePath
      });

      if (result.success) {
        alert(`Successfully committed to GitHub!\nCommit: ${result.commit.url}`);
        setCommitMessage('');
      } else {
        alert(`Commit failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Commit error:', error);
      alert('Failed to commit to GitHub');
    }
  };

  const handleReadCode = async () => {
    const analysis = await api('dispatch-ai-task', { taskType: 'read-code', params: '' });
    alert(`Code analysis: ${analysis}`);
  };

  return (
    <div className="h-full w-full flex flex-col border rounded-lg overflow-hidden">
      {/* Git Controls */}
      {isGitConnected && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Repository:</label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="">Select repository...</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.full_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedRepo && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Branch:</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="main">main</option>
                    <option value="master">master</option>
                    <option value="develop">develop</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">File:</label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="path/to/file.js"
                    className="px-2 py-1 border rounded text-sm w-32"
                  />
                </div>
              </>
            )}
          </div>

          {selectedRepo && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
              <button className="btn-primary text-sm px-3 py-1" onClick={handleAnalyzeAndCommit}>
                Commit to GitHub
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor Controls */}
      <div className="flex items-center p-2 border-b">
        <button className="btn-secondary" onClick={handleReadCode}>Read Code</button>
        {!isGitConnected && (
          <div className="ml-4 text-sm text-gray-600">
            Sign in with GitHub to enable repository integration
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />
      </div>
    </div>
  );
}