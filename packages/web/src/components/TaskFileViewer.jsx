import React, { useState, useEffect, useRef } from 'react';
import { FileText, Folder, RefreshCw, Download, Trash2, Eye, EyeOff, Plus, Upload, FolderPlus, Search, X, Edit, Save } from 'lucide-react';

export default function TaskFileViewer({ taskId, runId }) {
  const [scope, setScope] = useState('run');
  const [files, setFiles] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newDirName, setNewDirName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewDir, setShowNewDir] = useState(false);
  const [error, setError] = useState(null);
  const [vfsTree, setVfsTree] = useState(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    loadFiles();
    loadVFSTree();
  }, [taskId, runId, scope, currentPath]);

  useEffect(() => {
    if (watching) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    
    return () => disconnectWebSocket();
  }, [watching, taskId, scope, currentPath]);

  const connectWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:3001/vfs/watch?path=tasks:/${taskId}/${scope}${currentPath}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'change' || data.type === 'vfs:change') {
          loadFiles();
        }
      };

      wsRef.current.onerror = () => {
        setError('WebSocket connection failed');
        setWatching(false);
      };
    } catch (err) {
      setError(`Failed to connect WebSocket: ${err.message}`);
      setWatching(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${currentPath}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setFiles(data.files || []);
      setDirectories(data.directories || []);
    } catch (err) {
      setError(`Failed to load files: ${err.message}`);
      setFiles([]);
      setDirectories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVFSTree = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tree/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setVfsTree(data);
      }
    } catch (err) {
      console.error('Failed to load VFS tree:', err);
    }
  };

  const viewFile = async (file) => {
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${file.path}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSelectedFile(file);
      setFileContent(data.content);
      setEditContent(data.content);
      setEditing(false);
    } catch (err) {
      setError(`Failed to load file: ${err.message}`);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${selectedFile.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      setFileContent(editContent);
      setEditing(false);
      loadFiles();
    } catch (err) {
      setError(`Failed to save file: ${err.message}`);
    }
  };

  const deleteFile = async (file) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${file.path}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      if (selectedFile && selectedFile.path === file.path) {
        setSelectedFile(null);
      }
      loadFiles();
    } catch (err) {
      setError(`Failed to delete file: ${err.message}`);
    }
  };

  const downloadFile = async (file) => {
    try {
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${file.path}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to download file: ${err.message}`);
    }
  };

  const createFile = async () => {
    if (!newFileName.trim()) return;
    
    try {
      const filePath = currentPath === '/' ? `/${newFileName}` : `${currentPath}/${newFileName}`;
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${filePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      setNewFileName('');
      setShowNewFile(false);
      loadFiles();
    } catch (err) {
      setError(`Failed to create file: ${err.message}`);
    }
  };

  const createDirectory = async () => {
    if (!newDirName.trim()) return;
    
    try {
      const dirPath = currentPath === '/' ? `/${newDirName}` : `${currentPath}/${newDirName}`;
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${dirPath}/.gitkeep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      setNewDirName('');
      setShowNewDir(false);
      loadFiles();
    } catch (err) {
      setError(`Failed to create directory: ${err.message}`);
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const content = await file.text();
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const response = await fetch(`http://localhost:3001/api/vfs/tasks/${taskId}/${scope}${filePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      loadFiles();
    } catch (err) {
      setError(`Failed to upload file: ${err.message}`);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const navigateToDirectory = (dir) => {
    setCurrentPath(dir.path);
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    setCurrentPath('/' + parts.join('/'));
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDirectories = directories.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScopeColor = (scopeName) => {
    const colors = {
      run: '#3b82f6',
      task: '#10b981',
      global: '#f59e0b'
    };
    return colors[scopeName] || '#6b7280';
  };

  return (
    <div className="task-file-viewer" style={styles.container}>
      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError(null)} style={styles.errorClose}>
            <X size={16} />
          </button>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.scopeSelector}>
          {['run', 'task', 'global'].map(s => (
            <button
              key={s}
              style={{
                ...styles.scopeButton,
                ...(scope === s ? { ...styles.scopeButtonActive, borderBottomColor: getScopeColor(s) } : {})
              }}
              onClick={() => setScope(s)}
            >
              <span style={{ color: getScopeColor(s), fontSize: '20px', marginRight: '4px' }}>●</span>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.controls}>
          <button onClick={() => setWatching(!watching)} style={{...styles.button, ...(watching ? styles.buttonActive : {})}}>
            {watching ? <Eye size={16} /> : <EyeOff size={16} />}
            {watching ? 'Watching' : 'Watch'}
          </button>
          <button onClick={loadFiles} style={styles.button}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchBar}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.actions}>
          <button onClick={() => setShowNewFile(true)} style={styles.toolbarButton}>
            <Plus size={16} />
            New File
          </button>
          <button onClick={() => setShowNewDir(true)} style={styles.toolbarButton}>
            <FolderPlus size={16} />
            New Folder
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={styles.toolbarButton}>
            <Upload size={16} />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={uploadFile}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {showNewFile && (
        <div style={styles.inputBar}>
          <input
            type="text"
            placeholder="filename.txt"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createFile()}
            style={styles.input}
            autoFocus
          />
          <button onClick={createFile} style={styles.button}>Create</button>
          <button onClick={() => setShowNewFile(false)} style={styles.button}>Cancel</button>
        </div>
      )}

      {showNewDir && (
        <div style={styles.inputBar}>
          <input
            type="text"
            placeholder="folder-name"
            value={newDirName}
            onChange={(e) => setNewDirName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createDirectory()}
            style={styles.input}
            autoFocus
          />
          <button onClick={createDirectory} style={styles.button}>Create</button>
          <button onClick={() => setShowNewDir(false)} style={styles.button}>Cancel</button>
        </div>
      )}

      <div style={styles.pathBar}>
        <button onClick={navigateUp} disabled={currentPath === '/'} style={styles.pathButton}>
          ↑ Up
        </button>
        <span style={styles.pathText}>
          <span style={{ color: getScopeColor(scope) }}>/{scope}</span>
          {currentPath}
        </span>
      </div>

      <div style={styles.fileList}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <>
            {filteredDirectories.map(dir => (
              <div key={dir.path} style={styles.fileItem} onClick={() => navigateToDirectory(dir)} onDoubleClick={() => navigateToDirectory(dir)}>
                <Folder size={20} color="#60a5fa" />
                <span style={styles.fileName}>{dir.name}</span>
                <span style={styles.fileDate}>{new Date(dir.modified).toLocaleString()}</span>
              </div>
            ))}

            {filteredFiles.map(file => (
              <div key={file.path} style={styles.fileItem}>
                <FileText size={20} color="#94a3b8" />
                <span style={styles.fileName}>{file.name}</span>
                <span style={styles.fileSize}>{formatBytes(file.size)}</span>
                <span style={styles.fileDate}>{new Date(file.modified).toLocaleString()}</span>
                <div style={styles.fileActions}>
                  <button onClick={() => viewFile(file)} title="View" style={styles.iconButton}>
                    <Eye size={16} />
                  </button>
                  <button onClick={() => downloadFile(file)} title="Download" style={styles.iconButton}>
                    <Download size={16} />
                  </button>
                  <button onClick={() => deleteFile(file)} title="Delete" style={{...styles.iconButton, ...styles.dangerButton}}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filteredFiles.length === 0 && filteredDirectories.length === 0 && (
              <div style={styles.empty}>
                {searchTerm ? 'No files match your search' : 'No files in this directory'}
              </div>
            )}
          </>
        )}
      </div>

      {vfsTree && (
        <div style={styles.vfsTree}>
          <h4 style={styles.vfsTreeTitle}>VFS Storage</h4>
          {Object.entries(vfsTree).map(([scopeName, data]) => (
            <div key={scopeName} style={styles.vfsTreeItem}>
              <span style={{ color: getScopeColor(scopeName) }}>●</span>
              <strong>{scopeName}</strong>: {formatBytes(data.size)}
            </div>
          ))}
        </div>
      )}

      {selectedFile && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{selectedFile.name}</h3>
              <div style={styles.modalActions}>
                {editing ? (
                  <>
                    <button onClick={saveFile} style={{...styles.button, ...styles.primaryButton}}>
                      <Save size={16} />
                      Save
                    </button>
                    <button onClick={() => { setEditing(false); setEditContent(fileContent); }} style={styles.button}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} style={styles.button}>
                    <Edit size={16} />
                    Edit
                  </button>
                )}
                <button onClick={() => setSelectedFile(null)} style={styles.button}>
                  <X size={16} />
                  Close
                </button>
              </div>
            </div>
            {editing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={styles.editor}
              />
            ) : (
              <pre style={styles.fileContent}>{fileContent}</pre>
            )}
          </div>
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  error: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '4px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #1e293b'
  },
  scopeSelector: {
    display: 'flex',
    gap: '8px'
  },
  scopeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center'
  },
  scopeButtonActive: {
    color: '#e2e8f0',
    borderBottomWidth: '2px'
  },
  controls: {
    display: 'flex',
    gap: '8px'
  },
  button: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s'
  },
  buttonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #1e293b',
    gap: '12px'
  },
  searchBar: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1e293b',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #334155'
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#e2e8f0',
    outline: 'none',
    fontSize: '14px'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  toolbarButton: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap'
  },
  inputBar: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155'
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  pathBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155'
  },
  pathButton: {
    backgroundColor: '#334155',
    border: 'none',
    color: '#e2e8f0',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  pathText: {
    fontSize: '14px',
    color: '#94a3b8',
    fontFamily: 'monospace'
  },
  fileList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginBottom: '4px'
  },
  fileName: {
    flex: 1,
    fontSize: '14px'
  },
  fileSize: {
    fontSize: '13px',
    color: '#64748b',
    minWidth: '60px'
  },
  fileDate: {
    fontSize: '13px',
    color: '#64748b',
    minWidth: '160px'
  },
  fileActions: {
    display: 'flex',
    gap: '4px',
    opacity: 0.6,
    transition: 'opacity 0.2s'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    transition: 'all 0.2s'
  },
  dangerButton: {
    color: '#ef4444'
  },
  loading: {
    textAlign: 'center',
    padding: '32px',
    color: '#64748b'
  },
  empty: {
    textAlign: 'center',
    padding: '32px',
    color: '#64748b',
    fontSize: '14px'
  },
  vfsTree: {
    padding: '16px',
    borderTop: '1px solid #1e293b',
    backgroundColor: '#1e293b'
  },
  vfsTreeTitle: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  vfsTreeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#cbd5e1',
    marginBottom: '6px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #1e293b'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #1e293b'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  modalActions: {
    display: 'flex',
    gap: '8px'
  },
  fileContent: {
    flex: 1,
    padding: '20px',
    margin: 0,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  },
  editor: {
    flex: 1,
    padding: '20px',
    margin: 0,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    fontSize: '13px',
    fontFamily: 'monospace',
    border: 'none',
    outline: 'none',
    resize: 'none'
  }
};
