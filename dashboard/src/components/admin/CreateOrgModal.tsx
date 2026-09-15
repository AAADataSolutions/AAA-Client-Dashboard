'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    phone: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state showing generated Invite Link
  const [createdInvite, setCreatedInvite] = useState<{
    orgName: string;
    inviteUrl: string;
    email: string;
    expires_at: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide the client organization name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zip_code.trim() || null,
          country: formData.country.trim() || 'USA',
          phone: formData.phone.trim() || null,
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create organization');
      }

      onSuccess();

      if (json.invitation?.inviteUrl) {
        setCreatedInvite({
          orgName: formData.name.trim(),
          inviteUrl: json.invitation.inviteUrl,
          email: formData.contact_email.trim(),
          expires_at: json.invitation.expires_at,
        });
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Create organization error:', err);
      setError(err.message || 'Failed to create organization.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInvite = () => {
    if (!createdInvite?.inviteUrl) return;
    navigator.clipboard.writeText(createdInvite.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFinish = () => {
    setCreatedInvite(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={createdInvite ? handleFinish : onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          />

          {/* Central Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <div className="flex items-center gap-2.5">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {createdInvite ? 'Organization & Invitation Created' : 'Create Client Organization'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {createdInvite
                        ? 'Send the invitation link to the client admin.'
                        : 'Provision a new client tenant organization and generate admin invitation.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={createdInvite ? handleFinish : onClose}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {createdInvite ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {createdInvite.orgName} is Ready!
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-xs max-w-md mx-auto leading-relaxed">
                      An invitation token was generated for <strong className="text-slate-900 dark:text-white">{createdInvite.email}</strong>. The client admin will set their own password upon opening.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Secure Invitation URL (Valid for 7 Days)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdInvite.inviteUrl}
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 text-[11px] select-all"
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCopyInvite}
                        className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy URL'}</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <a
                      href={createdInvite.inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold cursor-pointer"
                    >
                      <span>Open Invite in New Window</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleFinish}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                    >
                      Done
                    </motion.button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* Organization Info */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Organization Details
                    </span>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Organization Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Marriott Hospitality Group"
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Street Address
                        </label>
                        <textarea
                          rows={2}
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="123 Main Street"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                          City, State, ZIP
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                            className="px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                          />
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="State (IL)"
                            className="px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                          />
                          <input
                            type="text"
                            name="zip_code"
                            value={formData.zip_code}
                            onChange={handleChange}
                            placeholder="ZIP"
                            className="px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Organization Main Phone
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (800) 555-0199"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                      />
                    </div>
                  </div>

                  {/* Primary Admin Contact Section */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Primary Administrator &amp; Invitation
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Admin Contact Name
                        </label>
                        <input
                          type="text"
                          name="contact_name"
                          value={formData.contact_name}
                          onChange={handleChange}
                          placeholder="e.g., Jane Doe"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Admin Email Address <span className="text-slate-400 font-normal">(Receives Invite)</span>
                        </label>
                        <input
                          type="email"
                          name="contact_email"
                          value={formData.contact_email}
                          onChange={handleChange}
                          placeholder="admin@hotelchain.com"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Admin Direct Phone
                      </label>
                      <input
                        type="text"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleChange}
                        placeholder="+1 (312) 555-0123"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                      />
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating &amp; Generating Invite...</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Create Organization</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
