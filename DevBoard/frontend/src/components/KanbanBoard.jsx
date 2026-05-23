import React, { useState } from 'react';
import { Plus, Trash2, Calendar, User2, Search, Filter, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

const KanbanBoard = ({ tasks, onTaskMove, onTaskDelete, userRole, onCreateTaskClick, currentUserId }) => {
  const [draggedOverCol, setDraggedOverCol] = useState(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({}); // { taskId: boolean }

  const columns = [
    { id: 'todo', title: 'To Do', accent: 'border-t-4 border-t-slate-500 bg-slate-900/10' },
    { id: 'in-progress', title: 'In Progress', accent: 'border-t-4 border-t-indigo-500 bg-slate-900/10' },
    { id: 'done', title: 'Done', accent: 'border-t-4 border-t-emerald-500 bg-slate-900/10' }
  ];

  // Drag & Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, colId) => {
    e.preventDefault();
    setDraggedOverCol(colId);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      // Find task to pass subtasks unmodified
      const task = tasks.find(t => t._id === taskId);
      onTaskMove(taskId, targetStatus, task?.subtasks);
    }
  };

  // Expand / Collapse subtasks checklist
  const toggleChecklist = (taskId, e) => {
    e.stopPropagation(); // Stop trigger card click/drag issues
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Toggle single subtask status
  const handleSubtaskToggle = (task, subtaskIndex, e) => {
    e.stopPropagation();
    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[subtaskIndex].completed = !updatedSubtasks[subtaskIndex].completed;
    onTaskMove(task._id, task.status, updatedSubtasks);
  };

  // Filter Tasks based on search bar and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    const matchesMyTasks = !myTasksOnly || 
      (task.assignedTo?._id === currentUserId || task.assignedTo === currentUserId);

    return matchesSearch && matchesPriority && matchesMyTasks;
  });

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* 🔍 Search & Advanced Filtering Panel */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-850 bg-slate-900/30 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-550" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Search sprint tasks by title or criteria..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 px-3 text-xs text-slate-350 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-400 transition-colors hover:border-slate-700">
            <input
              type="checkbox"
              checked={myTasksOnly}
              onChange={(e) => setMyTasksOnly(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950/60 text-brand-500 outline-none focus:ring-0 cursor-pointer"
            />
            <span>Assigned to me</span>
          </label>
        </div>
      </div>

      {/* 📋 Kanban Board Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isHovered = draggedOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragEnter={(e) => handleDragEnter(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border border-slate-850 p-4 transition-all ${col.accent} ${
                isHovered ? 'border-brand-500 bg-brand-500/[0.01] scale-[0.99] border-dashed shadow-2xl' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-850/60">
                <div className="flex items-center gap-2">
                  <span className="font-outfit text-sm font-bold text-white">{col.title}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-slate-400">
                    {colTasks.length}
                  </span>
                </div>
                {col.id === 'todo' && (
                  <button
                    onClick={onCreateTaskClick}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                    title="Add Task"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Task list Container */}
              <div className="flex flex-1 flex-col gap-3 min-h-[400px] overflow-y-auto max-h-[700px] pr-0.5 scrollbar-thin">
                {colTasks.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-slate-650 border border-dashed border-slate-850/60 rounded-2xl">
                    <span className="text-xs">No tasks in column</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isExpanded = !!expandedTasks[task._id];
                    const subtaskCount = task.subtasks?.length || 0;
                    const subtasksCompleted = task.subtasks?.filter(s => s.completed).length || 0;
                    const progressPercent = subtaskCount > 0 ? Math.round((subtasksCompleted / subtaskCount) * 100) : 0;

                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        className="group relative cursor-grab active:cursor-grabbing rounded-2xl border border-slate-850 bg-slate-900/40 p-4 transition-all hover:border-slate-800 hover:bg-slate-900/60 shadow-lg hover:shadow-brand-500/[0.01]"
                      >
                        {/* Priority Badge & Delete */}
                        <div className="flex items-start justify-between gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {(userRole === 'admin' || userRole === 'manager') && (
                            <button
                              onClick={() => onTaskDelete(task._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-455 rounded transition-opacity"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="mt-2 text-xs font-semibold text-slate-100 leading-relaxed">
                          {task.title}
                        </h4>

                        {/* Description */}
                        {task.description && (
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* 📈 Advanced Subtasks Checklist Summary */}
                        {subtaskCount > 0 && (
                          <div className="mt-3.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-550 mb-1">
                              <button
                                onClick={(e) => toggleChecklist(task._id, e)}
                                className="flex items-center text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
                              >
                                <span>Checklist: {subtasksCompleted}/{subtaskCount}</span>
                                {isExpanded ? <ChevronUp className="ml-0.5 h-3.5 w-3.5" /> : <ChevronDown className="ml-0.5 h-3.5 w-3.5" />}
                              </button>
                              <span>{progressPercent}%</span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="h-1 w-full bg-slate-850 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>

                            {/* Expandable checklists drawer */}
                            {isExpanded && (
                              <div className="mt-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                                {task.subtasks.map((sub, idx) => (
                                  <div
                                    key={sub._id || idx}
                                    onClick={(e) => handleSubtaskToggle(task, idx, e)}
                                    className="flex cursor-pointer items-center gap-2 rounded-md p-1 hover:bg-slate-850/60"
                                  >
                                    {sub.completed ? (
                                      <CheckSquare className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                                    ) : (
                                      <Square className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                                    )}
                                    <span className={`text-[10px] ${sub.completed ? 'text-slate-550 line-through' : 'text-slate-300'}`}>
                                      {sub.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer metadata */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-850/50 pt-3 text-[10px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[8px] font-bold text-slate-400 uppercase">
                              {task.assignedTo?.name?.charAt(0) || 'U'}
                            </div>
                            <span className="font-semibold text-slate-400">{task.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Calendar className="h-3 w-3 text-slate-550" />
                            <span className="text-slate-500 truncate max-w-[80px]">{task.sprintId?.name || 'Sprint'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
