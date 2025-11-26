import React, { useState, useEffect } from 'react';
import { FileText, Folder, RefreshCw, Download, Trash2, Eye } from 'lucide-react';

export default function TaskFileViewer({ taskId, runId }) {
  const [scope, setScope] = useState('run');
  const [files, setFiles] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [taskId, runId, scope, currentPath]);

  useEffect(() => {
    if (watching) {
      const ws = new WebSocket(`ws://localhost:3001/vfs/watch?path=tasks:/${taskId}/${scope}${currentPath}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'change') {
          loadFiles();
        }
      };

      return () => ws.close();
    }
  }, [watching, taskId, scope, currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${currentPath}`);
      const data = await response.json();
      setFiles(data.files || []);
      setDirectories(data.directories || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewFile = async (file) => {
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${file.path}`);
      const data = await response.json();
      setSelectedFile(file);
      setFileContent(data.content);
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  };

  const deleteFile = async (file) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    
    try {
      await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${file.path}`, {
        method: 'DELETE'
      });
      loadFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const downloadFile = async (file) => {
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${file.path}`);
      const data = await response.json();
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const navigateToDirectory = (dir) => {
    setCurrentPath(dir.path);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    setCurrentPath('/' + parts.join('/'));
  };

  return (
    <div className="task-file-viewer">
      <div className="viewer-header">
        <div className="scope-selector">
          <button
            className={scope === 'run' ? 'active' : ''}
            onClick={() => setScope('run')}
          >
            Run Scope
          </button>
          <button
            className={scope === 'task' ? 'active' : ''}
            onClick={() => setScope('task')}
          >
            Task Scope
          </button>
          <button
            className={scope === 'global' ? 'active' : ''}
            onClick={() => setScope('global')}
          >
            Global Scope
          </button>
        </div>

        <div className="controls">
          <button onClick={() => setWatching(!watching)} className={watching ? 'active' : ''}>
            <Eye size={16} />
            {watching ? 'Watching' : 'Watch'}
          </button>
          <button onClick={loadFiles}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="path-bar">
        <button onClick={navigateUp} disabled={currentPath === '/'}>
          ..
        </button>
        <span>{currentPath}</span>
      </div>

      <div className="file-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {directories.map(dir => (
              <div key={dir.path} className="file-item directory" onClick={() => navigateToDirectory(dir)}>
                <Folder size={20} />
                <span className="name">{dir.name}</span>
                <span className="size">{new Date(dir.modified).toLocaleString()}</span>
              </div>
            ))}

            {files.map(file => (
              <div key={file.path} className="file-item">
                <FileText size={20} />
                <span className="name">{file.name}</span>
                <span className="size">{formatBytes(file.size)}</span>
                <span className="date">{new Date(file.modified).toLocaleString()}</span>
                <div className="actions">
                  <button onClick={() => viewFile(file)} title="View">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => downloadFile(file)} title="Download">
                    <Download size={16} />
                  </button>
                  <button onClick={() => deleteFile(file)} title="Delete" className="danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {selectedFile && (
        <div className="file-viewer">
          <div className="viewer-header">
            <h3>{selectedFile.name}</h3>
            <button onClick={() => setSelectedFile(null)}>Close</button>
          </div>
          <pre className="file-content">{fileContent}</pre>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
