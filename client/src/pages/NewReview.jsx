import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import FileUploadZone from '../components/FileUploadZone';
import { useToast } from '../context/ToastContext';
import {
  Code2,
  FileCode,
  Sparkles,
  Send,
  ShieldAlert,
  Zap,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function NewReview() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      language: 'JavaScript',
      inputMethod: 'paste',
      codeSnippet: '',
      checkSecurity: true,
      checkPerformance: true,
      checkCleanCode: true,
      calculateComplexity: true,
    },
  });

  const inputMethod = watch('inputMethod');
  const selectedLanguage = watch('language');
  const codeSnippet = watch('codeSnippet');

  const [analyzing, setAnalyzing] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const navigate = useNavigate();

  const supportedLanguages = [
    { name: 'JavaScript', ext: '.js', icon: '⚡' },
    { name: 'Python', ext: '.py', icon: '🐍' },
    { name: 'Java', ext: '.java', icon: '☕' },
    { name: 'C++', ext: '.cpp', icon: '⚙️' },
    { name: 'C#', ext: '.cs', icon: '🔷' },
    { name: 'Go', ext: '.go', icon: '🐹' },
    { name: 'TypeScript', ext: '.ts', icon: '📘' },
  ];

  const handleFileLoaded = (content, fileName) => {
    setValue('codeSnippet', content, { shouldValidate: true });
    if (fileName && !watch('title')) {
      setValue('title', `Review: ${fileName}`, { shouldValidate: true });
    }
    toast.success(`File ${fileName} loaded into workspace.`);
  };

  const handleLanguageDetected = (detectedLang) => {
    if (supportedLanguages.some((l) => l.name === detectedLang)) {
      setValue('language', detectedLang, { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    setSubmissionError('');

    if (!data.codeSnippet || data.codeSnippet.trim().length < 10) {
      const err = 'Code snippet must contain at least 10 characters.';
      setSubmissionError(err);
      toast.error(err);
      return;
    }

    setAnalyzing(true);
    const loadingToastId = toast.loading(`Analyzing ${data.language} snippet with AI...`);

    try {
      const res = await API.post('/reviews', {
        title: data.title,
        language: data.language,
        codeSnippet: data.codeSnippet,
        checkSecurity: data.checkSecurity,
        checkPerformance: data.checkPerformance,
        checkCleanCode: data.checkCleanCode,
        calculateComplexity: data.calculateComplexity,
      });

      toast.dismiss(loadingToastId);
      toast.reviewComplete(`AI Review Complete! Score: ${res.data.data.review.score}/100`);

      const newReviewId = res.data.data.review._id;
      navigate(`/reviews/${newReviewId}`);
    } catch (err) {
      toast.dismiss(loadingToastId);
      const errMsg = err.response?.data?.message || 'Failed to analyze code snippet.';
      setSubmissionError(errMsg);
      toast.error(errMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  const lineCount = codeSnippet ? codeSnippet.split('\n').length : 0;
  const charCount = codeSnippet ? codeSnippet.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Code2 className="w-6 h-6 text-indigo-400" />
          Submit Code for AI Review
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Paste your code or upload a source file to receive automated security, performance, and clean code suggestions.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Review Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  {...register('title', {
                    required: 'Review title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                  })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. Express Auth Router Validation"
                />
                {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Programming Language <span className="text-rose-400">*</span>
                </label>
                <select
                  {...register('language', { required: 'Language selection is required' })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.name} value={lang.name}>
                      {lang.icon} {lang.name} ({lang.ext})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <label className="text-xs font-semibold text-slate-300">Code Input Method</label>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setValue('inputMethod', 'paste')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      inputMethod === 'paste'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" /> Paste Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('inputMethod', 'upload')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      inputMethod === 'upload'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" /> Upload File
                  </button>
                </div>
              </div>

              {inputMethod === 'paste' ? (
                <div className="space-y-2">
                  <textarea
                    rows={12}
                    {...register('codeSnippet', {
                      required: 'Code snippet is required',
                      minLength: { value: 10, message: 'Code snippet must contain at least 10 characters' },
                    })}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
                    placeholder={`// Paste your ${selectedLanguage} code snippet here...`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                    <span>Lines: {lineCount}</span>
                    <span>Characters: {charCount} / 50,000</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileUploadZone
                    onFileLoaded={handleFileLoaded}
                    selectedLanguage={selectedLanguage}
                    onLanguageDetected={handleLanguageDetected}
                  />

                  {codeSnippet && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-400">Uploaded Content Preview:</p>
                      <textarea
                        rows={8}
                        value={codeSnippet}
                        onChange={(e) => setValue('codeSnippet', e.target.value)}
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {errors.codeSnippet && <p className="text-[11px] text-rose-400">{errors.codeSnippet.message}</p>}
            </div>
          </div>

          {submissionError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={analyzing}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                Analyzing Code with AI...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit for Code Review
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Review Parameters
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Security Vulnerabilities
                </span>
                <input
                  type="checkbox"
                  {...register('checkSecurity')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Performance Optimizations
                </span>
                <input
                  type="checkbox"
                  {...register('checkPerformance')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> SOLID Clean Code Rules
                </span>
                <input
                  type="checkbox"
                  {...register('checkCleanCode')}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
