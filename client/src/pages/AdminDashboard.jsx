import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import {
  ShieldCheck,
  Users,
  Code2,
  TrendingUp,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'reviews'

  // Users Tab State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ totalPages: 1, totalCount: 0 });
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Reviews Tab State
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ totalPages: 1, totalCount: 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');

  // Fetch System Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/admin/stats');
        setStats(res.data.data);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to load admin stats');
      }
    };
    fetchStats();
  }, []);

  // Fetch Admin Users
  const fetchAdminUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await API.get('/admin/users', {
        params: { search: userSearch, page: userPage, limit: 8 },
      });
      setUsers(res.data.data.users || []);
      setUserPagination(res.data.data.pagination || { totalPages: 1, totalCount: 0 });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch users list');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchAdminUsers();
  }, [userSearch, userPage, activeTab]);

  // Fetch Admin Reviews
  const fetchAdminReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await API.get('/admin/reviews', {
        params: { search: reviewSearch, page: reviewPage, limit: 8 },
      });
      setReviews(res.data.data.reviews || []);
      setReviewPagination(res.data.data.pagination || { totalPages: 1, totalCount: 0 });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch platform reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') fetchAdminReviews();
  }, [reviewSearch, reviewPage, activeTab]);

  // Handle Delete User
  const handleDeleteUser = async (userId, userEmail) => {
    if (
      !window.confirm(
        `⚠️ ADMIN ACTION: Are you sure you want to delete user ${userEmail}? This will permanently purge their account and code reviews.`
      )
    )
      return;

    try {
      await API.delete(`/admin/users/${userId}`);
      fetchAdminUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            System Administration Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based user management, system audit logs, and platform analytics control.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total System Users</span>
            <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total Code Reviews</span>
            <div className="p-2 bg-cyan-600/10 text-cyan-400 rounded-lg">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalReviews || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Platform Quality Avg</span>
            <div className="p-2 bg-emerald-600/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats?.avgPlatformScore || 0}/100</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>System Admins</span>
            <div className="p-2 bg-amber-600/10 text-amber-400 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.totalAdmins || 0}</p>
        </div>
      </div>

      {/* Navigation Console Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Manage Users ({userPagination.totalCount || users.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Inspect System Reviews ({reviewPagination.totalCount || reviews.length})
        </button>
      </div>

      {/* TAB 1: MANAGE USERS CONSOLE */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {loadingUsers ? (
            <div className="py-12 flex justify-center text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
              No registered users found.
            </p>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <img
                            src={u.profileImage}
                            alt={u.name}
                            className="w-8 h-8 rounded-full border border-indigo-500/30 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-white">{u.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                              u.role === 'admin'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u._id, u.email)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {userPagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Page {userPage} of {userPagination.totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                  disabled={userPage === 1}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUserPage((p) => Math.min(p + 1, userPagination.totalPages))}
                  disabled={userPage === userPagination.totalPages}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INSPECT SYSTEM REVIEWS CONSOLE */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={reviewSearch}
              onChange={(e) => {
                setReviewSearch(e.target.value);
                setReviewPage(1);
              }}
              placeholder="Search code reviews across platform..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {loadingReviews ? (
            <div className="py-12 flex justify-center text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
              No platform reviews found.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono rounded-md">
                        {r.language}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-100">{r.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      Author: <span className="text-slate-200 font-medium">{r.user?.name || 'Unknown User'}</span> ({r.user?.email || 'N/A'})
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                      Score: {r.score}/100
                    </span>
                    <Link
                      to={`/reviews/${r._id}`}
                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    >
                      Inspect <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {reviewPagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Page {reviewPage} of {reviewPagination.totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReviewPage((p) => Math.max(p - 1, 1))}
                  disabled={reviewPage === 1}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setReviewPage((p) => Math.min(p + 1, reviewPagination.totalPages))}
                  disabled={reviewPage === reviewPagination.totalPages}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
