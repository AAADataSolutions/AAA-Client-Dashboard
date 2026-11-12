import React from 'react';

export const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    OPEN: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
    IN_PROGRESS: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
    WAITING_ON_CLIENT: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/40',
    RESOLVED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
    CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  };
  const dotColors: Record<string, string> = {
    OPEN: 'bg-blue-500',
    IN_PROGRESS: 'bg-amber-500',
    WAITING_ON_CLIENT: 'bg-purple-500',
    RESOLVED: 'bg-emerald-500',
    CLOSED: 'bg-slate-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${styles[status] || styles.OPEN}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.OPEN}`} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

export const getPriorityDisplay = (priority: string) => {
  const config: Record<string, { color: string; icon: string }> = {
    URGENT: { color: 'text-rose-600 dark:text-rose-400', icon: '🔴' },
    HIGH: { color: 'text-amber-600 dark:text-amber-400', icon: '🟠' },
    MEDIUM: { color: 'text-blue-600 dark:text-blue-400', icon: '🔵' },
    LOW: { color: 'text-emerald-600 dark:text-emerald-400', icon: '🟢' },
  };
  const c = config[priority] || config.MEDIUM;
  return (
    <span className={`font-semibold text-xs ${c.color} flex items-center gap-1`}>
      <span className="text-[10px]">{c.icon}</span> {priority}
    </span>
  );
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
