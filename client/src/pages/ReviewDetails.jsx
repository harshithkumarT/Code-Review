import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import {
  Code2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  BookOpen,
  Sliders,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Loader2,
  FileCode,
  Layers,
  Activity,
  CheckSquare,
  Star,
  FileText,
} from 'lucide-react';

export default function ReviewDetails() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('split');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await API.get(`/reviews/${id}`);
        const data = res.data.data.review;
        setReview(data);
        setIsFavorite(!!data.isFavorite);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load code review details.');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      const res = await API.post('/favorites/toggle', { reviewId: id });
      setIsFavorite(res.data.data.isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'original') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedOptimized(true);
      setTimeout(() => setCopiedOptimized(false), 2000);
    }
  };

  // Download PDF / DOCX Report from backend
  const downloadBackendReport = async (format) => {
    if (!review) return;
    setDownloading(true);
    try {
      const response = await API.get(`/reports/${id}/${format}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'docx';
      link.setAttribute('download', `CodeReview_${review.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(`Failed to download ${format.toUpperCase()} report.`);
    } finally {
      setDownloading(false);
    }
  };

  // Client-side Markdown Report export
  const downloadMarkdownReport = () => {
    if (!review) return;

    const reportContent = `
# 🛠️ AI Code Review Report: ${review.title}
**Language:** ${review.language}
**Health Score:** ${review.score}/100
**Date:** ${new Date(review.createdAt || Date.now()).toLocaleDateString()}

---

## 📌 Executive Summary
${review.aiFeedback || review.summary || 'N/A'}

---

## ⚡ Algorithmic Complexity
- **Time Complexity:** ${review.complexity?.timeComplexity || 'O(N)'}
- **Space Complexity:** ${review.complexity?.spaceComplexity || 'O(1)'}

---

## 📝 Original Code
\`\`\`${review.language.toLowerCase()}
${review.originalCode}
\`\`\`

---

## ✨ Optimized Code (AI Refactored)
\`\`\`${review.language.toLowerCase()}
${review.reviewedCode || review.optimizedCode}
\`\`\`
`.trim();

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CodeReview_${review.title.replace(/[^a-z0-9]/gi, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center text-slate-100">
        <div className="flex items-center space-x-3 text-indigo-400 font-medium">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Generating AI Code Analysis Report...</span>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Unable to retrieve analysis results.'}</p>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Review History
        </Link>
      </div>
    );
  }

  const scoreColor =
    review.score >= 85
      ? 'from-emerald-400 to-teal-400 text-emerald-400 border-emerald-500/30'
      : review.score >= 70
      ? 'from-amber-400 to-yellow-400 text-amber-400 border-amber-500/30'
      : 'from-rose-400 to-red-400 text-rose-400 border-rose-500/30';

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <Link
            to="/history"
            className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 mb-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reviews List
          </Link>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            {review.title}
            <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono rounded-lg">
              {review.language}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToggleFavorite}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isFavorite
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Bookmarked' : 'Add Favorite'}
          </button>

          {/* Export PDF Button */}
          <button
            onClick={() => downloadBackendReport('pdf')}
            disabled={downloading}
            className="px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-medium text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-rose-400" /> Export PDF
          </button>

          {/* Export DOCX Button */}
          <button
            onClick={() => downloadBackendReport('docx')}
            disabled={downloading}
            className="px-3.5 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-medium text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            <FileCode className="w-4 h-4 text-cyan-400" /> Export DOCX
          </button>

          {/* Export MD Button */}
          <button
            onClick={downloadMarkdownReport}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" /> Export MD
          </button>
        </div>
      </div>

      {/* Overall Score & Complexity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
          <div className="relative flex items-center justify-center">
            <div className={`w-28 h-28 rounded-full border-4 ${scoreColor} flex flex-col items-center justify-center bg-slate-950/80 shadow-2xl`}>
              <span className="text-3xl font-extrabold text-white">{review.score}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">/ 100</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Overall Quality Score</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {review.score >= 85 ? 'Excellent Code Quality' : review.score >= 70 ? 'Good (Minor Improvements Needed)' : 'Critical Refactoring Recommended'}
            </p>
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Time Complexity</span>
              <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-indigo-300">
              {review.complexity?.timeComplexity || 'O(N)'}
            </p>
            <p className="text-[11px] text-slate-500">Algorithmic execution scaling</p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Space Complexity</span>
              <div className="p-2 bg-cyan-600/10 text-cyan-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-cyan-300">
              {review.complexity?.spaceComplexity || 'O(1)'}
            </p>
            <p className="text-[11px] text-slate-500">Memory footprint efficiency</p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Cyclomatic Complexity</span>
              <div className="p-2 bg-emerald-600/10 text-emerald-400 rounded-lg">
                <Sliders className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-emerald-300">
              {review.complexity?.cyclomaticComplexity || 'Low'}
            </p>
            <p className="text-[11px] text-slate-500">Branching & decision tree depth</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Executive Summary
        </h2>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {review.aiFeedback || review.summary}
        </div>
      </div>

      {/* Code Comparison Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side Comparison
            </button>
            <button
              onClick={() => setActiveTab('optimized')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'optimized' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Optimized Code Only
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Original Code Only
            </button>
          </div>
        </div>

        {activeTab === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-slate-950">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-slate-500" /> Original Submission
                </span>
                <button
                  onClick={() => copyToClipboard(review.originalCode, 'original')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedOriginal ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-[500px]">
                <code>{review.originalCode}</code>
              </pre>
            </div>

            <div className="p-4 space-y-3 bg-slate-950/90">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Optimized Code (AI Refactored)
                </span>
                <button
                  onClick={() => copyToClipboard(review.reviewedCode || review.optimizedCode, 'optimized')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copiedOptimized ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedOptimized ? 'Copied' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-3 font-mono text-xs text-emerald-300/90 leading-relaxed overflow-x-auto max-h-[500px]">
                <code>{review.reviewedCode || review.optimizedCode}</code>
              </pre>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-950">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-slate-300">
                {activeTab === 'optimized' ? '✨ AI Refactored Code' : '📄 Original Submitted Snippet'}
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    activeTab === 'optimized' ? review.reviewedCode || review.optimizedCode : review.originalCode,
                    activeTab === 'optimized' ? 'optimized' : 'original'
                  )
                }
                className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
            </div>
            <pre className="font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
              <code>{activeTab === 'optimized' ? review.reviewedCode || review.optimizedCode : review.originalCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
