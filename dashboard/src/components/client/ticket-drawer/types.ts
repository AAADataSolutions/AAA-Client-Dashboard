export interface TicketConversationDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onStatusChange?: () => void;
}

export type TabType = 'details' | 'conversation' | 'attachments';
