/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Clock, 
  Bell, 
  BellOff,
  ChevronRight,
  Target,
  Trophy,
  Calendar as CalendarIcon,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  reminderTime?: string; // HH:mm format
  reminded?: boolean;
}

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('focusflow_goals');
    return saved ? JSON.parse(saved) : [];
  });
  const [newGoal, setNewGoal] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('focusflow_goals', JSON.stringify(goals));
  }, [goals]);

  // Notification Permission Check
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission === 'default') {
        setShowNotificationPrompt(true);
      }
    }
  }, []);

  // Reminder Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setGoals(prevGoals => {
        let changed = false;
        const newGoals = prevGoals.map(goal => {
          if (goal.reminderTime === currentTime && !goal.reminded && !goal.completed) {
            sendNotification(`Reminder: ${goal.text}`, "It's time to work on your goal!");
            changed = true;
            return { ...goal, reminded: true };
          }
          return goal;
        });
        return changed ? newGoals : prevGoals;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled) {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setShowNotificationPrompt(false);
      }
    }
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    const goal: Goal = {
      id: crypto.randomUUID(),
      text: newGoal.trim(),
      completed: false,
      createdAt: Date.now(),
      reminderTime: reminderTime || undefined,
      reminded: false,
    };

    setGoals([goal, ...goals]);
    setNewGoal('');
    setReminderTime('');
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        const newState = !goal.completed;
        if (newState) {
          sendNotification("Goal Completed!", `Great job! You finished: ${goal.text}`);
        }
        return { ...goal, completed: newState };
      }
      return goal;
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [goals]);

  const today = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">FocusFlow</h1>
              <p className="text-neutral-500 flex items-center gap-2">
                <CalendarIcon size={16} />
                {today}
              </p>
            </div>
            <button 
              onClick={requestPermission}
              className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200'}`}
              title={notificationsEnabled ? "Notifications Active" : "Enable Notifications"}
            >
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
          </div>
        </header>

        {/* Progress Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-1">Daily Progress</h2>
              <p className="text-3xl font-bold">{stats.percentage}% Complete</p>
            </div>
            <div className="h-16 w-16 rounded-full border-4 border-neutral-100 flex items-center justify-center relative">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-emerald-500"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * stats.percentage) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <Target className="text-emerald-500" size={24} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 rounded-2xl p-4">
              <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Completed</p>
              <p className="text-xl font-bold flex items-center gap-2">
                {stats.completed} <span className="text-sm font-normal text-neutral-400">tasks</span>
              </p>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-4">
              <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Remaining</p>
              <p className="text-xl font-bold flex items-center gap-2">
                {stats.total - stats.completed} <span className="text-sm font-normal text-neutral-400">tasks</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notification Prompt */}
        <AnimatePresence>
          {showNotificationPrompt && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 p-2 rounded-xl text-white">
                    <Bell size={18} />
                  </div>
                  <p className="text-sm font-medium text-emerald-900">Enable notifications for reminders</p>
                </div>
                <button 
                  onClick={requestPermission}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700 px-4 py-2"
                >
                  Enable
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Section */}
        <form onSubmit={addGoal} className="mb-8 space-y-3">
          <div className="relative group">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="What's your next goal?"
              className="w-full bg-white rounded-2xl px-6 py-4 pr-12 shadow-sm border border-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-neutral-300"
            />
            <button 
              type="submit"
              disabled={!newGoal.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-black/5 shadow-sm">
              <Clock size={16} className="text-neutral-400" />
              <input 
                type="time" 
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="text-sm focus:outline-none bg-transparent"
              />
              <span className="text-xs text-neutral-400 font-medium uppercase">Reminder</span>
            </div>
            {reminderTime && (
              <button 
                type="button"
                onClick={() => setReminderTime('')}
                className="text-xs font-bold text-neutral-400 hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Goals List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {goals.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="text-neutral-300" size={32} />
                </div>
                <p className="text-neutral-400 font-medium">No goals set for today yet.</p>
              </motion.div>
            ) : (
              goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-black/5 transition-all ${goal.completed ? 'opacity-60' : ''}`}
                >
                  <button 
                    onClick={() => toggleGoal(goal.id)}
                    className={`transition-colors ${goal.completed ? 'text-emerald-500' : 'text-neutral-300 hover:text-emerald-400'}`}
                  >
                    {goal.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${goal.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                      {goal.text}
                    </p>
                    {goal.reminderTime && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Bell size={10} className={goal.completed ? 'text-neutral-300' : 'text-emerald-500'} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {goal.reminderTime}
                        </span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Completion Celebration */}
        {stats.total > 0 && stats.percentage === 100 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 bg-emerald-500 rounded-3xl p-8 text-white text-center shadow-xl shadow-emerald-500/20"
          >
            <Trophy size={48} className="mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">All Done!</h3>
            <p className="text-emerald-50 text-sm">You've completed all your goals for today. Time to rest!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
