import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Star, ExternalLink, Code2, Loader2, AlertCircle } from 'lucide-react';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await API.get('/favorites');
      setFavorites(res.data.data.favorites || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookmarked favorites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (reviewId, e) => {
    e.stopPropagation();
    try {
      await API.post('/favorites/toggle', { reviewId });
      setFavorites((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
          <Star className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Bookmarked Favorites</h1>
          <p className="text-xs text-slate-400">Quick access to your saved code review benchmarks.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-amber-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-medium">Fetching favorite reviews...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Star className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Favorites Bookmarked</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not added any code reviews to your favorites yet. Click the star icon on any review card in your history to bookmark it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {favorites.map((item) => (
            <div
              key={item._id}
              onClick={() => navigate(`/reviews/${item._id}`)}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-all cursor-pointer space-y-4 flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 text-xs font-mono rounded-lg">
                    {item.language}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                      Score: {item.score}/100
                    </span>
                    <button
                      onClick={(e) => handleRemoveFavorite(item._id, e)}
                      className="p-1.5 text-amber-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Remove Favorite"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>

                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400 overflow-x-auto max-h-24">
                  <code>{item.originalCode}</code>
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Date: {new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="text-indigo-400 hover:underline flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                  View Analysis <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
