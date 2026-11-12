import React from 'react';
import type { Variants } from 'framer-motion';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED';

export interface PropertyOption {
  id: string;
  name: string;
  organization_name?: string;
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export interface CreateTicketFormData {
  subject: string;
  phone_number: string;
  property_id: string;
  priority: TicketPriority;
  description: string;
}

export interface TicketComment {
  id: string;
  content: string;
  is_internal?: boolean;
  created_at: string;
  author?: {
    id?: string;
    full_name?: string;
    role?: string;
  };
}

export interface TicketAttachment {
  id: string;
  file_name: string;
  file_size: number;
  url?: string;
}

export interface TicketDetailData {
  id: string;
  display_id?: string;
  subject: string;
  description: string;
  clean_description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  organization_name?: string;
  property_name?: string;
  property_location?: string;
  created_by_name?: string;
  created_by_email?: string;
  created_by_phone?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  related_items?: Record<string, string>;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
}

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export const getPriorityBadge = (p: TicketPriority | string) => {
  switch (p) {
    case 'URGENT':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/40';
    case 'HIGH':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40';
    case 'MEDIUM':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40';
    case 'LOW':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
};

export const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
    WAITING_ON_CLIENT: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/40',
    RESOLVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40',
    CLOSED: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200 dark:border-slate-700/40',
  };
  const dotColors: Record<string, string> = {
    OPEN: 'bg-blue-500',
    IN_PROGRESS: 'bg-amber-500',
    WAITING_ON_CLIENT: 'bg-purple-500',
    RESOLVED: 'bg-emerald-500',
    CLOSED: 'bg-slate-500',
  };
  return React.createElement(
    'span',
    {
      className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${styles[status] || styles.OPEN}`,
    },
    React.createElement('span', {
      className: `w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.OPEN}`,
    }),
    status?.replace(/_/g, ' ')
  );
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
