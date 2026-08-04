import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Search,
  Filter,
  Star,
  Trash2,
  ExternalLink,
  Code2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  PlusCircle,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Zap,
} from 'lucide-react';

export default function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Basic Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  
  // Advanced Search Panel States
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });

  const navigate = useNavigate();
  const supportedLanguages = ['All', 'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'TypeScript'];

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 6,
        sort: sortOption,
      };

      if (searchTerm) params.search = searchTerm;
      if (keywords) params.keywords = keywords;
      if (selectedLang && selectedLang !== 'All') params.language = selectedLang;
      if (minScore !== '') params.minScore = minScore;
      if (maxScore !== '') params.maxScore = maxScore;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await API.get('/reviews', { params });
      setReviews(res.data.data.reviews || []);
      setPagination(res.data.data.pagination || { totalPages: 1, totalCount: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load code review history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [searchTerm, keywords, selectedLang, minScore, maxScore, startDate, endDate, sortOption, page]);

  const resetFilters = () => {
    setSearchTerm('');
    setKeywords('');
    setSelectedLang('All');
    setSortOption('newest');
    setMinScore('');
    setMaxScore('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleToggleFavorite = async (reviewId, e) => {
    e.stopPropagation();
    try {
      const res = await API.post('/favorites/toggle', { reviewId });
      const isFav = res.data.data.isFavorite;

      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, isFavorite: isFav } : r))
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDelete = async (reviewId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this code review?')) return;

    try {
      await API.delete(`/reviews/${reviewId}`);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-6 h-6 text-indigo-400" />
            Advanced Code Review Search
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query past AI reports by title, keywords, language, score ranges, and submission dates.
          </p>
        </div>

        <Link
          to="/new-review"
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> New Review
        </Link>
      </div>

      {/* Main Search & Filter Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Title Search Input */}
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by review title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Language Selector */}
          <div className="relative md:col-span-3 flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <select
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  Language: {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="relative md:col-span-2 flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="score_desc">Sort: Highest Score</option>
              <option value="score_asc">Sort: Lowest Score</option>
            </select>
          </div>

          {/* Toggle Advanced Filters Button */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                showAdvanced
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvanced ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filter Drawer */}
        {showAdvanced && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            {/* Full-Text Keywords Input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Keywords Search (Text Index)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => {
                  setKeywords(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. JWT, binary tree, SQL..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Score Range Filters */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Score Range (0 - 100)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => {
                    setMinScore(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Min"
                  className="w-1/2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500 text-xs">-</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxScore}
                  onChange={(e) => {
                    setMaxScore(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Max"
                  className="w-1/2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Date Range End & Reset Action */}
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-indigo-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-medium">Executing MongoDB indexed search query...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Code2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Matching Code Reviews</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No code reviews matched your advanced search query or score/date range. Try resetting your filter criteria.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-medium hover:bg-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Reset Search Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((item) => (
            <div
              key={item._id}
              onClick={() => navigate(`/reviews/${item._id}`)}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/40 transition-all cursor-pointer space-y-3 shadow-lg group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 text-xs font-mono rounded-lg">
                    {item.language}
                  </span>
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                    Score: {item.score}/100
                  </span>
                  <button
                    onClick={(e) => handleToggleFavorite(item._id, e)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      item.isFavorite
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                    title={item.isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item._id, e)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400 overflow-x-auto max-h-24">
                <code>{item.originalCode}</code>
              </pre>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Date: {new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="text-indigo-400 hover:underline flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                  View Full Analysis <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Page <strong className="text-slate-200">{page}</strong> of{' '}
            <strong className="text-slate-200">{pagination.totalPages}</strong> (Total:{' '}
            {pagination.totalCount} items)
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
