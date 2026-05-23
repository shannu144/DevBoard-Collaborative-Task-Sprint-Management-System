import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, LogOut, Briefcase, User, CheckCircle2, AlertCircle, Clock, Trash } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <User className="h-4 w-4 text-brand-400" />;
      case 'status_change':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg shadow-brand-500/20">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="font-outfit text-xl font-bold tracking-tight text-white">
                Dev<span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Board</span>
              </span>
            </Link>
          </div>

          {/* User & Notifications Section */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 transition-all hover:bg-slate-800 hover:text-white ${
                    unreadCount > 0 ? 'animate-pulse-slow border-brand-500/30' : ''
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                      <span className="font-outfit text-sm font-semibold text-white">Notifications</span>
                      <div className="flex space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-medium text-brand-400 hover:text-brand-300"
                          >
                            Mark read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={clearNotifications}
                            className="flex items-center text-[11px] font-medium text-slate-500 hover:text-rose-400"
                          >
                            <Trash className="mr-0.5 h-3 w-3" /> Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Bell className="h-8 w-8 text-slate-700" />
                          <span className="mt-2 text-xs text-slate-500">All caught up! No notifications.</span>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.task?.projectId) {
                                navigate(`/project/${notif.task.projectId}`);
                                setShowNotifications(false);
                              }
                            }}
                            className={`flex cursor-pointer gap-3 border-b border-slate-850 px-3 py-2.5 transition-colors hover:bg-slate-800/40 ${
                              !notif.read ? 'bg-brand-500/5' : ''
                            }`}
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="flex items-center text-[10px] text-slate-500">
                                <Clock className="mr-1 h-2.5 w-2.5" />
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile details */}
              <div className="hidden items-center space-x-3 sm:flex">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-brand-400">
                    {user.role}
                  </span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 font-outfit text-sm font-bold text-slate-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-400"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
