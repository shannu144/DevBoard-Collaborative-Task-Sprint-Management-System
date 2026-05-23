import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, seedDemoWorkspace } from '../services/projectService';
import { getTasks } from '../services/taskService';
import { getAllUsers } from '../services/authService';
import { Briefcase, FolderPlus, CheckCircle, Clock, AlertCircle, Plus, Users, ArrowRight, X, Mail } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projList, taskList] = await Promise.all([
          getProjects(),
          getTasks({ assignedTo: user._id })
        ]);
        setProjects(projList);
        setAssignedTasks(taskList);

        if (user.role === 'admin' || user.role === 'manager') {
          const userList = await getAllUsers();
          // Filter out current user from potential members select list
          setUsers(userList.filter(u => u._id !== user._id));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      const newProj = await createProject({
        name: projectName,
        description: projectDesc,
        members: selectedMembers
      });
      setProjects([newProj, ...projects]);
      setShowModal(false);
      // Reset
      setProjectName('');
      setProjectDesc('');
      setSelectedMembers([]);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setLoading(true);
    try {
      await seedDemoWorkspace();
      const projList = await getProjects();
      const taskList = await getTasks({ assignedTo: user._id });
      setProjects(projList);
      setAssignedTasks(taskList);
    } catch (err) {
      console.error('Failed to seed demo data:', err);
      alert('Seeding failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-450 border border-rose-500/20">High</span>;
      case 'medium':
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">Medium</span>;
      default:
        return <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done':
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-450 border border-emerald-500/20">Done</span>;
      case 'in-progress':
        return <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">In Progress</span>;
      default:
        return <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/30">To Do</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-950 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-slate-850 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold tracking-tight text-white">
            Workspace Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, {user.name}. Manage your sprint cycles and track assignments.
          </p>
        </div>
        {(user.role === 'admin' || user.role === 'manager') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-3 font-outfit text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:from-brand-500 hover:to-indigo-500 hover:shadow-brand-500/30"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Quick Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-850 bg-slate-900/20 p-6 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <span className="text-sm font-medium text-slate-450">Active Projects</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{projects.length}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-850 bg-slate-900/20 p-6 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-sm font-medium text-slate-455">Pending Assignments</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">
              {assignedTasks.filter(t => t.status !== 'done').length}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-850 bg-slate-900/20 p-6 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-450">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-sm font-medium text-slate-460">Completed Tasks</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">
              {assignedTasks.filter(t => t.status === 'done').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Projects Columns (Span 2) */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="font-outfit text-xl font-bold text-white flex items-center gap-2">
            <span>My Projects</span>
            <span className="rounded-full bg-slate-850 px-2.5 py-0.5 text-xs text-slate-400">
              {projects.length}
            </span>
          </h2>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/10">
              <Briefcase className="h-10 w-10 text-slate-700" />
              <h3 className="mt-4 text-sm font-semibold text-white">No projects found</h3>
              <p className="mt-1 text-xs text-slate-500 mb-6">
                {(user.role === 'admin' || user.role === 'manager')
                  ? 'Create a project to get started with sprint cycles, or seed our demo project.'
                  : 'Ask your manager or admin to add you to a project, or seed our demo project to explore the board.'}
              </p>
              
              <button
                onClick={handleSeedDemo}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-3 font-outfit text-xs font-semibold text-white shadow-lg shadow-brand-500/20 hover:from-brand-500 hover:to-indigo-500 hover:shadow-brand-500/30 transition-all cursor-pointer"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Seed Portfolio Demo Data</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {projects.map(proj => (
                <Link
                  key={proj._id}
                  to={`/project/${proj._id}`}
                  className="group relative block rounded-2xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-800 hover:bg-slate-900/50 hover:shadow-xl hover:shadow-brand-500/[0.02] hover:-translate-y-0.5"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-outfit text-lg font-semibold text-white group-hover:text-brand-400 transition-colors">
                          {proj.name}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-slate-650 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-850/60 pt-4">
                      <div className="flex items-center text-[11px] text-slate-500">
                        <Users className="mr-1 h-3.5 w-3.5 text-slate-400" />
                        <span>{proj.members?.length || 0} members</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Created {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Tasks Column (Span 1) */}
        <div className="space-y-6">
          <h2 className="font-outfit text-xl font-bold text-white flex items-center gap-2">
            <span>My Tasks</span>
            <span className="rounded-full bg-slate-850 px-2.5 py-0.5 text-xs text-slate-400">
              {assignedTasks.length}
            </span>
          </h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {assignedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-850 bg-slate-900/10 p-12 text-center">
                <CheckCircle className="h-8 w-8 text-slate-750" />
                <h3 className="mt-4 text-xs font-semibold text-slate-400">All tasks completed</h3>
                <p className="mt-1 text-[11px] text-slate-600">No active tasks are assigned to you.</p>
              </div>
            ) : (
              assignedTasks.map(task => (
                <div
                  key={task._id}
                  className="rounded-xl border border-slate-850 bg-slate-900/20 p-4 hover:border-slate-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {task.title}
                    </h4>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {task.description || 'No description.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-850/40 pt-3">
                    <span className="text-[10px] font-medium text-brand-400 bg-brand-500/5 px-2 py-0.5 rounded-md border border-brand-500/10">
                      Sprint: {task.sprintId?.name || 'Default'}
                    </span>
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-outfit text-lg font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-455">
                <AlertCircle className="h-4 w-4" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. Mobile E-Commerce Gateway"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows="3"
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Summarize objectives, requirements, and targets..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assign Team Members
                </label>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-2 space-y-1.5">
                  {users.length === 0 ? (
                    <span className="block text-center py-4 text-xs text-slate-600">No other users found</span>
                  ) : (
                    users.map(u => (
                      <div
                        key={u._id}
                        onClick={() => toggleMemberSelection(u._id)}
                        className={`flex items-center justify-between cursor-pointer rounded-lg p-2 transition-all hover:bg-slate-800 ${
                          selectedMembers.includes(u._id) ? 'bg-brand-500/10 border border-brand-500/20' : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">{u.name}</p>
                            <span className="text-[9px] text-slate-500 flex items-center"><Mail className="mr-0.5 h-2 w-2"/>{u.email}</span>
                          </div>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold bg-slate-850 px-1.5 py-0.5 rounded">
                          {u.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 px-4 font-outfit text-sm font-semibold text-white shadow-lg transition-all hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none"
              >
                {modalLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
