import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Users, UserPlus, Briefcase, Calendar, Clock, 
  ChevronRight, X, AlertCircle, Loader, Plus, Edit3, Trash2
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Project & Task Core States
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  // Add Member Modal States
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');

  // Create Task Modal States
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskCreateLoading, setTaskCreateLoading] = useState(false);
  const [taskCreateError, setTaskCreateError] = useState('');

  // View/Edit Task Details Modal States
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [taskUpdateLoading, setTaskUpdateLoading] = useState(false);
  const [taskUpdateError, setTaskUpdateError] = useState('');
  const [taskDeleteLoading, setTaskDeleteLoading] = useState(false);
  const [taskDeleteError, setTaskDeleteError] = useState('');

  // Fetch Project Details, Project Members, and Associated Tasks
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError('');

      const [projRes, tasksRes] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/projects/${id}/tasks`)
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.project);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks);
      }
    } catch (err) {
      console.error('[ProjectDetails fetch error]:', err);
      setError(err.response?.data?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Fetch all system users for Add Member select dropdown (filtered to exclude existing members)
  const handleOpenMemberModal = async () => {
    setShowMemberModal(true);
    setMemberError('');
    setSelectedUserId('');
    try {
      const res = await API.get('/auth/users');
      if (res.data.success) {
        // Exclude users who are already members
        const memberIds = project.members.map(m => m.id);
        const nonMembers = res.data.users.filter(u => !memberIds.includes(u.id));
        setAllUsers(nonMembers);
        if (nonMembers.length > 0) {
          setSelectedUserId(nonMembers[0].id.toString());
        }
      }
    } catch (err) {
      setMemberError('Failed to fetch system users.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setMemberLoading(true);
    setMemberError('');

    try {
      const res = await API.post(`/projects/${id}/members`, {
        userId: parseInt(selectedUserId, 10)
      });

      if (res.data.success) {
        setShowMemberModal(false);
        // Refresh project data
        fetchProjectData();
      }
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setMemberLoading(false);
    }
  };

  // Open task creation modal & clear inputs
  const handleOpenCreateTaskModal = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDate('');
    setTaskAssigneeId('');
    setTaskCreateError('');
    setShowCreateTaskModal(true);
  };

  // Create Task Submit Handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskCreateError('');
    setTaskCreateLoading(true);

    try {
      const payload = {
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate || null,
        assignedTo: taskAssigneeId ? parseInt(taskAssigneeId, 10) : null
      };

      const res = await API.post(`/projects/${id}/tasks`, payload);

      if (res.data.success) {
        setShowCreateTaskModal(false);
        // Refresh project data
        fetchProjectData();
      }
    } catch (err) {
      setTaskCreateError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setTaskCreateLoading(false);
    }
  };

  // Open Task details modal & load form states
  const handleOpenTaskDetails = (task) => {
    setSelectedTask(task);
    setEditTitle(task.title || '');
    setEditDesc(task.description || '');
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setEditAssigneeId(task.assignedTo ? task.assignedTo.toString() : '');
    setEditStatus(task.status || 'Pending');
    setTaskUpdateError('');
    setTaskDeleteError('');
    setShowTaskDetailsModal(true);
  };

  // Update Task details
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setTaskUpdateError('');
    setTaskUpdateLoading(true);

    try {
      const isAdmin = user?.role === 'Admin';
      const isAssigned = selectedTask?.assignedTo === user?.id;

      let payload = {};
      if (isAdmin) {
        // Admins can update all parameters
        payload = {
          title: editTitle,
          description: editDesc,
          dueDate: editDueDate || null,
          assignedTo: editAssigneeId ? parseInt(editAssigneeId, 10) : null,
          status: editStatus
        };
      } else if (isAssigned) {
        // Members can ONLY update status
        payload = {
          status: editStatus
        };
      } else {
        throw new Error('Unauthorized task modification.');
      }

      const res = await API.put(`/tasks/${selectedTask.id}`, payload);

      if (res.data.success) {
        setShowTaskDetailsModal(false);
        // Refresh project data
        fetchProjectData();
      }
    } catch (err) {
      setTaskUpdateError(err.response?.data?.message || err.message || 'Failed to update task.');
    } finally {
      setTaskUpdateLoading(false);
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setTaskDeleteError('');
    setTaskDeleteLoading(true);

    try {
      const res = await API.delete(`/tasks/${selectedTask.id}`);

      if (res.data.success) {
        setShowTaskDetailsModal(false);
        // Refresh project data
        fetchProjectData();
      }
    } catch (err) {
      setTaskDeleteError(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setTaskDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="p-6 rounded-2xl glass-panel text-center space-y-3">
          <AlertCircle size={40} className="text-rose-500 mx-auto" />
          <h3 className="text-slate-200 font-bold text-lg">Error Loading Project</h3>
          <p className="text-slate-400 text-sm">{error || 'Project not found.'}</p>
        </div>
      </div>
    );
  }

  // Filter tasks based on task status select filter
  const filteredTasks = tasks.filter(t => filter === 'All' || t.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{project.name}</h1>
            <p className="text-slate-400 text-sm leading-relaxed">{project.description || 'No description provided.'}</p>
          </div>

          {user?.role === 'Admin' && (
            <button
              onClick={handleOpenCreateTaskModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/10 cursor-pointer shrink-0"
            >
              <Plus size={18} />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout: Left Tasks list, Right Members list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Tasks Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-400" />
              Tasks
            </h2>

            {/* Status Segment Control Filters */}
            <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 gap-1 overflow-x-auto">
              {['All', 'Pending', 'In Progress', 'Completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    filter === f 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
              <Clock size={40} className="text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-semibold text-base">No tasks found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                No tasks matches the current status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => handleOpenTaskDetails(task)}
                  className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4 group hover:border-slate-700/50 hover:bg-slate-800/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-slate-200 text-sm truncate">{task.title}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      {task.assignee ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center border border-indigo-500/10">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </span>
                          {task.assignee.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Unassigned</span>
                      )}

                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors">
                    <ChevronRight size={18} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Members Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-indigo-400" />
              Members
            </h2>

            {user?.role === 'Admin' && (
              <button
                onClick={handleOpenMemberModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 text-indigo-400 border border-indigo-500/10 hover:border-indigo-500/20 transition-all font-semibold text-xs cursor-pointer"
              >
                <UserPlus size={14} />
                Add Member
              </button>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="divide-y divide-slate-800/50">
              {project.members.map((member, idx) => (
                <div key={member.id} className={`flex items-center gap-3 py-3 ${idx === 0 ? 'pt-0' : ''} ${idx === project.members.length - 1 ? 'pb-0' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700/50 shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-semibold text-sm text-slate-200 truncate">{member.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    member.role === 'Admin' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add Member Modal Overlay */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#020617]/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl shadow-2xl relative border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowMemberModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Add Project Member</h3>
            <p className="text-slate-400 text-xs mb-6">Select an available user in the system to join this project.</p>

            {memberError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{memberError}</span>
              </div>
            )}

            {allUsers.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Users size={28} className="text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">All system users are already members of this project.</p>
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label htmlFor="userselect" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Choose User
                  </label>
                  <select
                    id="userselect"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
                  >
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email} - {u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/30">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={memberLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {memberLoading ? (
                      <>
                        <Loader size={14} className="animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      'Add Member'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal Overlay (Admin Only) */}
      {showCreateTaskModal && user?.role === 'Admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#020617]/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl relative border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCreateTaskModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Create New Task</h3>
            <p className="text-slate-400 text-xs mb-6">Create and assign a new task inside this project workspace.</p>

            {taskCreateError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{taskCreateError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label htmlFor="tasktitle" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  id="tasktitle"
                  type="text"
                  required
                  placeholder="e.g. Wireframe User Profiles"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="taskdesc" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  id="taskdesc"
                  rows="3"
                  placeholder="Detail the specifications for this task..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taskdue" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    id="taskdue"
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
                  />
                </div>

                <div>
                  <label htmlFor="taskassign" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assignee
                  </label>
                  <select
                    id="taskassign"
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/30">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskCreateLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {taskCreateLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details / Edit / Delete Modal Overlay */}
      {showTaskDetailsModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#020617]/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl relative border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowTaskDetailsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Task Specifications</h3>
            <p className="text-slate-400 text-xs mb-6">
              {user?.role === 'Admin' 
                ? 'Inspect, modify, or delete this task.' 
                : selectedTask.assignedTo === user?.id 
                  ? 'Update the status of this task assigned to you.' 
                  : 'View task details (Read-only).'}
            </p>

            {taskUpdateError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{taskUpdateError}</span>
              </div>
            )}
            
            {taskDeleteError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{taskDeleteError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label htmlFor="edittitle" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  id="edittitle"
                  type="text"
                  required
                  readOnly={user?.role !== 'Admin'}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none ${
                    user?.role === 'Admin' ? 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500' : 'opacity-75 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="editdesc" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  id="editdesc"
                  rows="3"
                  readOnly={user?.role !== 'Admin'}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className={`block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm resize-none focus:outline-none ${
                    user?.role === 'Admin' ? 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500' : 'opacity-75 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editdue" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    id="editdue"
                    type="date"
                    readOnly={user?.role !== 'Admin'}
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className={`block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none ${
                      user?.role === 'Admin' ? 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer' : 'opacity-75 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="editassign" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assignee
                  </label>
                  {user?.role === 'Admin' ? (
                    <select
                      id="editassign"
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {project.members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={selectedTask.assignee?.name || 'Unassigned'}
                      className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm opacity-75 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="editstatus" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Task Status
                </label>
                {/* Allow status changes if Admin OR if the task is explicitly assigned to this Member user */}
                {(user?.role === 'Admin' || selectedTask.assignedTo === user?.id) ? (
                  <select
                    id="editstatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <input
                    id="editstatus"
                    type="text"
                    readOnly
                    value={editStatus}
                    className="block w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm opacity-75 cursor-not-allowed"
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800/30">
                {/* Delete button (Admin only) */}
                {user?.role === 'Admin' ? (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    disabled={taskDeleteLoading}
                    className="px-3 py-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/50 text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {taskDeleteLoading ? (
                      <Loader size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete Task
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTaskDetailsModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {/* Show save controls only if user has update permission (Admin or Assigned Member) */}
                  {(user?.role === 'Admin' || selectedTask.assignedTo === user?.id) && (
                    <button
                      type="submit"
                      disabled={taskUpdateLoading}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {taskUpdateLoading ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
