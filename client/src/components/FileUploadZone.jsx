import { useState, useRef } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function FileUploadZone({ onFileLoaded, selectedLanguage, onLanguageDetected }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileMeta, setFileMeta] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const extensionToLangMap = {
    js: 'JavaScript',
    jsx: 'JavaScript',
    mjs: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    cc: 'C++',
    cxx: 'C++',
    h: 'C++',
    hpp: 'C++',
    cs: 'C#',
    go: 'Go',
  };

  const processFile = (file) => {
    setError('');
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 5MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const detectedLang = extensionToLangMap[ext];

    if (detectedLang && onLanguageDetected) {
      onLanguageDetected(detectedLang);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (typeof content === 'string') {
        if (content.trim().length < 10) {
          setError('The uploaded file appears to be empty or contains fewer than 10 characters.');
          return;
        }
        setFileMeta({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', ext });
        onFileLoaded(content, file.name);
      }
    };
    reader.onerror = () => setError('Failed to read file content.');
    reader.readAsText(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFileMeta(null);
    setError('');
    onFileLoaded('', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {fileMeta ? (
        <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                {fileMeta.name}
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Loaded
                </span>
              </p>
              <p className="text-xs text-slate-400">{fileMeta.size}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Remove File"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-600/10'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cs,.go,.txt"
            className="hidden"
          />
          <div className="p-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Click to upload or drag & drop a code file
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports: .js, .ts, .py, .java, .cpp, .cs, .go (Max size: 5MB)
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
