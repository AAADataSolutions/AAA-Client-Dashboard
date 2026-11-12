export {
  getNoReplyFromAddress,
  getSupportFromAddress,
} from './templates/config';

export {
  type TicketEmailAttachment,
  type TicketEmailData,
  type PortingEmailAttachment,
  type PortingEmailData,
  sendTicketEmail,
  sendPortingEmail,
} from './templates/ticket-porting';

export {
  type InviteEmailData,
  sendInviteEmail,
  type ResetPasswordEmailData,
  sendResetPasswordEmail,
} from './templates/invite-reset';

export {
  type PartnerInvoiceLineItem,
  type PartnerInvoiceEmailData,
  sendPartnerInvoiceEmail,
} from './templates/partner-invoice';
