import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Briefcase, Clock, Activity, CheckCircle2, 
  AlertTriangle, ArrowRight, FolderKanban, Users, Calendar, 
  Loader, X, AlertCircle 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Page States
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Project Modal States
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch Dashboard Stats & Projects lists
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, projectsRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/projects')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.projects);
      }
    } catch (err) {
      console.error('[Dashboard fetch error]:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      const res = await API.post('/projects', {
        name: projectName,
        description: projectDesc
      });

      if (res.data.success) {
        setShowModal(false);
        setProjectName('');
        setProjectDesc('');
        // Refresh project list and metrics
        fetchData();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  const counters = stats?.stats || {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Hello, {user?.name}</h1>
          <p className="text-slate-400 mt-1 text-sm">Here is what's happening with your workspace today.</p>
        </div>

        {user?.role === 'Admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/10 cursor-pointer hover:shadow-indigo-600/20"
          >
            <Plus size={18} />
            New Project
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Total Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Briefcase size={16} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-white">{counters.totalTasks}</p>
        </div>

        {/* Pending */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-amber-400">{counters.pendingTasks}</p>
        </div>

        {/* In Progress */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-blue-400">{counters.inProgressTasks}</p>
        </div>

        {/* Completed */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-emerald-400">{counters.completedTasks}</p>
        </div>

        {/* Overdue */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-w-0 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-rose-500">{counters.overdueTasks}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Projects Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderKanban size={20} className="text-indigo-400" />
              Active Projects
            </h2>
            <span className="text-xs text-slate-400 font-medium bg-slate-900 px-2.5 py-1 rounded-full">
              {projects.length} Total
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl text-center space-y-3">
              <FolderKanban size={40} className="text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-semibold text-base">No active projects</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {user?.role === 'Admin' 
                  ? 'Get started by creating a new project to assign members and tasks.' 
                  : 'You have not been added to any projects yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div 
                  key={proj.id} 
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="glass-panel p-6 rounded-2xl hover:bg-slate-800/20 border border-slate-800/80 hover:border-slate-700/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors truncate">
                      {proj.name}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                      {proj.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/50">
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Users size={14} className="text-indigo-400" />
                      {proj.members?.length || 0} Members
                    </span>
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-indigo-400" />
              Recent Tasks
            </h2>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            {!stats?.recentTasks || stats.recentTasks.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Clock size={32} className="text-slate-600 mx-auto" />
                <h4 className="text-slate-400 font-medium text-sm">No tasks tracked yet</h4>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {stats.recentTasks.map((task, idx) => (
                  <div key={task.id} className={`py-4 ${idx === 0 ? 'pt-0' : ''} ${idx === stats.recentTasks.length - 1 ? 'pb-0' : ''} space-y-2`}>
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-slate-200 text-sm line-clamp-1 leading-snug">
                        {task.title}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 uppercase tracking-wider ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[120px]">{task.project?.name}</span>
                      <span className="flex items-center gap-1 shrink-0 text-slate-500">
                        <Calendar size={12} />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#020617]/60 backdrop-blur-sm transition-opacity duration-300">
          
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl relative border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Create New Project</h3>
            <p className="text-slate-400 text-xs mb-6">Initialize a new project environment to coordinate actions.</p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="pname" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Project Name
                </label>
                <input
                  id="pname"
                  type="text"
                  required
                  placeholder="e.g. Marketing Launch"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="pdesc" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  id="pdesc"
                  rows="3"
                  placeholder="Summarize the core focus area..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/30">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {createLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
