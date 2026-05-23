import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getProjectDetails, getProjectSprints, createSprint } from '../services/projectService';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { getActivityLogs } from '../services/activityService';
import KanbanBoard from '../components/KanbanBoard';
import { Calendar, Users, ListFilter, Plus, FolderSync, Clock, AlertCircle, X, ChevronRight, CheckSquare, Mail } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Data States
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSprintFilter, setActiveSprintFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals States
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Sprint Form State
  const [sprintName, setSprintName] = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');
  const [sprintError, setSprintError] = useState('');
  const [sprintLoading, setSprintLoading] = useState(false);

  // Task Form State & Checklist States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSprint, setTaskSprint] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskSubtasks, setTaskSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [taskError, setTaskError] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projDetails, sprintList, taskList, activityList] = await Promise.all([
          getProjectDetails(id),
          getProjectSprints(id),
          getTasks({ projectId: id }),
          getActivityLogs(id)
        ]);

        setProject(projDetails);
        setSprints(sprintList);
        setTasks(taskList);
        setLogs(activityList.logs || []);

        if (sprintList.length > 0) {
          // Default to active sprint if available
          const activeSprint = sprintList.find(s => s.status === 'active');
          if (activeSprint) {
            setActiveSprintFilter(activeSprint._id);
          }
        }
      } catch (err) {
        console.error('Failed to load project details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 🔗 Socket.IO Real-time Synchronization
    if (socket) {
      console.log(`📂 Emitting project:join room for project: ${id}`);
      socket.emit('project:join', id);

      socket.on('task:created', (data) => {
        setTasks(prev => {
          if (prev.some(t => t._id === data.task._id)) return prev;
          return [data.task, ...prev];
        });
        refreshActivities();
      });

      socket.on('task:updated', (data) => {
        setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t));
        refreshActivities();
      });

      socket.on('task:deleted', (data) => {
        setTasks(prev => prev.filter(t => t._id !== data.taskId));
        refreshActivities();
      });
    }

    return () => {
      if (socket) {
        console.log(`📂 Emitting project:leave room for project: ${id}`);
        socket.emit('project:leave', id);
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');
      }
    };
  }, [id, socket]);

  const refreshActivities = async () => {
    try {
      const activityList = await getActivityLogs(id);
      setLogs(activityList.logs || []);
    } catch (err) {
      console.warn('Failed to refresh activity logs');
    }
  };

  const handleTaskMove = async (taskId, targetStatus, updatedSubtasks) => {
    try {
      // Optimistic client update for super-responsive drag and checklist checks
      setTasks(prev =>
        prev.map(t =>
          t._id === taskId
            ? { ...t, status: targetStatus, subtasks: updatedSubtasks || t.subtasks }
            : t
        )
      );
      await updateTask(taskId, { status: targetStatus, subtasks: updatedSubtasks });
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert if error
      const freshTasks = await getTasks({ projectId: id });
      setTasks(freshTasks);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setTasks(prev => prev.filter(t => t._id !== taskId));
      await deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      const freshTasks = await getTasks({ projectId: id });
      setTasks(freshTasks);
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    setSprintError('');
    setSprintLoading(true);

    try {
      const newSprint = await createSprint(id, {
        name: sprintName,
        startDate: sprintStart,
        endDate: sprintEnd
      });

      setSprints([...sprints, newSprint]);
      setActiveSprintFilter(newSprint._id);
      setShowSprintModal(false);
      setSprintName('');
      setSprintStart('');
      setSprintEnd('');
      refreshActivities();
    } catch (err) {
      setSprintError(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setSprintLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    setTaskLoading(true);

    try {
      const newTask = await createTask({
        title: taskTitle,
        description: taskDesc,
        projectId: id,
        sprintId: taskSprint,
        assignedTo: taskAssignee,
        priority: taskPriority,
        status: taskStatus,
        subtasks: taskSubtasks
      });

      setTasks([newTask, ...tasks]);
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskSprint('');
      setTaskAssignee('');
      setTaskPriority('medium');
      setTaskStatus('todo');
      setTaskSubtasks([]);
      refreshActivities();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleAddSubtaskInput = (e) => {
    e.preventDefault();
    if (newSubtaskText.trim() === '') return;
    setTaskSubtasks([...taskSubtasks, { title: newSubtaskText.trim(), completed: false }]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtaskInput = (idx, e) => {
    e.preventDefault();
    setTaskSubtasks(taskSubtasks.filter((_, index) => index !== idx));
  };

  // Filter tasks based on active sprint
  const filteredTasks = tasks.filter(task => {
    if (activeSprintFilter === 'all') return true;
    return task.sprintId?._id === activeSprintFilter;
  });

  // 📈 Compute Active Sprint Statistics for the SVG Circular Progress Gauge
  const activeSprintTasks = tasks.filter(t => {
    if (activeSprintFilter === 'all') return true;
    return t.sprintId?._id === activeSprintFilter;
  });
  const totalActiveTasks = activeSprintTasks.length;
  const completedActiveTasks = activeSprintTasks.filter(t => t.status === 'done').length;
  const activeProgressPercent = totalActiveTasks > 0 ? Math.round((completedActiveTasks / totalActiveTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-400">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-semibold text-white">Project not found</h2>
        <Link to="/" className="mt-2 text-brand-400 hover:underline inline-block">Return to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-950 text-slate-100">
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-350">{project.name}</span>
      </div>

      {/* Main Title, Members, & Circular SVG Progress Gauge */}
      <div className="mt-4 flex flex-col gap-6 border-b border-slate-850 pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold tracking-tight text-white">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400 leading-relaxed">{project.description || 'No description provided.'}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center -space-x-2">
              {project.members?.slice(0, 5).map(member => (
                <div
                  key={member._id}
                  title={`${member.name} (${member.role})`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-900 bg-slate-800 text-[10px] font-bold text-slate-350 uppercase"
                >
                  {member.name.charAt(0)}
                </div>
              ))}
              {project.members?.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-900 bg-slate-950 text-[10px] font-semibold text-slate-555">
                  +{project.members.length - 5}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-500 border-l border-slate-800 pl-4 py-1.5">
              <span className="block font-semibold text-slate-400">{project.members?.length || 0} Members Assigned</span>
              <span>Manager: {project.createdBy?.name || 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* 📈 Animated Circular SVG Burn-down progress gauge */}
        <div className="flex items-center gap-4 bg-slate-900/30 border border-slate-850 p-4 rounded-2xl max-w-sm backdrop-blur-xl">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                className="stroke-slate-850"
                strokeWidth="4.5"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                className="stroke-brand-500 transition-all duration-500 ease-out"
                strokeWidth="4.5"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - activeProgressPercent / 100)}`}
              />
            </svg>
            <span className="absolute font-outfit text-xs font-bold text-white">{activeProgressPercent}%</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Sprint Progress</span>
            <span className="block text-xs font-semibold text-slate-200 mt-0.5">
              {completedActiveTasks}/{totalActiveTasks} tasks completed
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Current column: done</span>
          </div>
        </div>
      </div>

      {/* Filter and Board Setup */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Sprint selector */}
        <div className="flex flex-wrap items-center gap-3">
          <ListFilter className="h-4 w-4 text-slate-500" />
          <button
            onClick={() => setActiveSprintFilter('all')}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold border transition-all ${
              activeSprintFilter === 'all'
                ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            All Sprints
          </button>
          {sprints.map(sprint => (
            <button
              key={sprint._id}
              onClick={() => setActiveSprintFilter(sprint._id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold border transition-all ${
                activeSprintFilter === sprint._id
                  ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              {sprint.name} {sprint.status === 'completed' && '(Closed)'}
            </button>
          ))}

          {(user.role === 'admin' || user.role === 'manager') && (
            <button
              onClick={() => setShowSprintModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:border-slate-700 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Sprint</span>
            </button>
          )}
        </div>

        {/* Task Buttons */}
        <button
          onClick={() => {
            if (sprints.length === 0) {
              alert('Please create a sprint before adding tasks!');
              return;
            }
            // Prefill Sprint Form Value
            setTaskSprint(activeSprintFilter !== 'all' ? activeSprintFilter : sprints[0]._id);
            setTaskAssignee(project.members?.[0]?._id || user._id);
            setShowTaskModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4.5 py-2.5 font-outfit text-xs font-semibold text-white shadow-lg shadow-brand-600/20 transition-all hover:from-brand-500 hover:to-indigo-500"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Kanban Board & Activity Feed Section */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Kanban Board Container (Spans 3) */}
        <div className="lg:col-span-3">
          <KanbanBoard
            tasks={filteredTasks}
            onTaskMove={handleTaskMove}
            onTaskDelete={handleTaskDelete}
            userRole={user.role}
            currentUserId={user._id}
            onCreateTaskClick={() => {
              if (sprints.length === 0) {
                alert('Please create a sprint before adding tasks!');
                return;
              }
              setTaskSprint(activeSprintFilter !== 'all' ? activeSprintFilter : sprints[0]._id);
              setTaskAssignee(project.members?.[0]?._id || user._id);
              setShowTaskModal(true);
            }}
          />
        </div>

        {/* Sidebar Auditing Logs Feed (Spans 1) */}
        <div className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 backdrop-blur-xl max-h-[750px] flex flex-col">
          <h3 className="font-outfit text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
            <Clock className="h-4 w-4 text-slate-500" />
            <span>Sprint Activity Feed</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-650">
                <span className="text-xs">No activity logged yet</span>
              </div>
            ) : (
              logs.map(log => (
                <div key={log._id} className="text-[11px] leading-relaxed border-b border-slate-855 pb-2.5">
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">{log.userId?.name || 'User'}</span>{' '}
                    {log.details}
                  </p>
                  <span className="mt-1 block text-[9px] text-slate-650 font-medium">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    on {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CREATE SPRINT MODAL */}
      {showSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div onClick={() => setShowSprintModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-outfit text-base font-bold text-white">Create Sprint Cycle</h3>
              <button onClick={() => setShowSprintModal(false)} className="rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sprintError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-455">
                <AlertCircle className="h-4 w-4" />
                <span>{sprintError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSprint} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500"
                  placeholder="e.g. Sprint v1.0 - Core Authentication"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Start Date</label>
                  <input
                    type="date"
                    required
                    value={sprintStart}
                    onChange={(e) => setSprintStart(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">End Date</label>
                  <input
                    type="date"
                    required
                    value={sprintEnd}
                    onChange={(e) => setSprintEnd(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sprintLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 px-4 font-outfit text-xs font-semibold text-white transition-all hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50"
              >
                {sprintLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span>Launch Sprint</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div onClick={() => setShowTaskModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-outfit text-base font-bold text-white">Add New Sprint Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {taskError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-455">
                <AlertCircle className="h-4 w-4" />
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500"
                  placeholder="e.g. Implement refresh tokens rotation"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows="2"
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500"
                  placeholder="Provide context and criteria of completion..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Sprint</label>
                  <select
                    value={taskSprint}
                    onChange={(e) => setTaskSprint(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500 appearance-none"
                  >
                    {sprints.map(s => (
                      <option key={s._id} value={s._id} className="bg-slate-900">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assign To</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500 appearance-none"
                  >
                    <option value={project.createdBy?._id} className="bg-slate-900">{project.createdBy?.name} (Owner)</option>
                    {project.members?.map(m => (
                      <option key={m._id} value={m._id} className="bg-slate-900">{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500 appearance-none"
                  >
                    <option value="low" className="bg-slate-900">Low</option>
                    <option value="medium" className="bg-slate-900">Medium</option>
                    <option value="high" className="bg-slate-900">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Initial Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs text-white outline-none focus:border-brand-500 appearance-none"
                  >
                    <option value="todo" className="bg-slate-900">To Do</option>
                    <option value="in-progress" className="bg-slate-900">In Progress</option>
                    <option value="done" className="bg-slate-900">Done</option>
                  </select>
                </div>
              </div>

              {/* 🛠️ Dynamic Subtask checklist input section */}
              <div className="space-y-1.5 border-t border-slate-850/60 pt-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task Checklist / Subtasks</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    className="block flex-1 rounded-xl border border-slate-800 bg-slate-950/60 py-2 px-3 text-xs text-white outline-none focus:border-brand-500"
                    placeholder="e.g. Write integration test routes..."
                  />
                  <button
                    onClick={handleAddSubtaskInput}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 text-xs font-semibold text-white transition-colors"
                  >
                    Add
                  </button>
                </div>
                {taskSubtasks.length > 0 && (
                  <div className="mt-2.5 max-h-24 overflow-y-auto rounded-xl border border-slate-850 p-2.5 space-y-1.5 bg-slate-950/40">
                    {taskSubtasks.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] text-slate-350 bg-slate-900/30 p-1.5 rounded-lg border border-slate-850">
                        <span>• {sub.title}</span>
                        <button
                          onClick={(e) => handleRemoveSubtaskInput(idx, e)}
                          className="text-rose-500 hover:text-rose-400 font-bold transition-colors px-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={taskLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 px-4 font-outfit text-xs font-semibold text-white transition-all hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50"
              >
                {taskLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span>Create Task</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
