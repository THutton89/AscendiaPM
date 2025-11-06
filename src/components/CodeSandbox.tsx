import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

interface CodeSandboxProps {
  taskId: string;
  initialCode?: string;
  language?: string;
}

export function CodeSandbox({ taskId, initialCode = '', language = 'javascript' }: CodeSandboxProps) {
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<WebrtcProvider>();
  const [code, setCode] = useState(initialCode);

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

  useEffect(() => {
    const handleRequestCode = () => {
      window.electronAPI.sendCode(code);
    };
    window.electronAPI.onRequestCode(handleRequestCode);

    return () => {
      window.electronAPI.removeRequestCodeListener(handleRequestCode);
    };
  }, [code]);

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
    const commitMessage = await window.electronAPI.dispatchAITask('commit-analysis', code);
    const oid = await window.electronAPI.createCommit(commitMessage);
    console.log('Commit created:', oid);
    alert(`Commit created with OID: ${oid}`);
  };

  const handleReadCode = async () => {
    const analysis = await window.electronAPI.dispatchAITask('read-code', '');
    alert(`Code analysis: ${analysis}`);
  };

  return (
    <div className="h-full w-full flex flex-col border rounded-lg overflow-hidden">
      <div className="flex items-center p-2 border-b">
        <button className="btn-secondary" onClick={handleReadCode}>Read Code</button>
        <button className="btn-primary ml-2" onClick={handleAnalyzeAndCommit}>Analyze and Commit</button>
      </div>
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