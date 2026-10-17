'use client';

import React, { useState, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
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
    type: 'GROUP' as 'GROUP' | 'INDIVIDUAL',
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be 5MB or less.');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

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
      let uploadedLogoUrl: string | null = null;
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        const logoRes = await fetch('/api/admin/organizations/logo', {
          method: 'POST',
          body: logoFormData,
        });
        const logoJson = await logoRes.json();
        if (logoJson.success && logoJson.logo_url) {
          uploadedLogoUrl = logoJson.logo_url;
        }
      }

      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          logo_url: uploadedLogoUrl,
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
        handleFinish();
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
    handleRemoveLogo();
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
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl z-10 max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#222430] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {createdInvite ? 'Management Group & Invitation Created' : 'Create Management Group'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {createdInvite
                        ? 'Send the invitation link to the client admin.'
                        : 'Provision a new client tenant management group and generate admin invitation.'}
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
                <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {createdInvite ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {createdInvite.orgName} is Ready!
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 text-xs max-w-md mx-auto leading-relaxed">
                        An invitation email has been dispatched to <strong className="text-slate-900 dark:text-white">{createdInvite.email}</strong>. The client admin can also use the secure link below to activate their account and set their password.
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
                  </div>

                  <div className="flex items-center justify-end p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
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
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
                    {/* Management Group Logo Upload */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Management Group Logo (Optional)
                      </label>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/60">
                        {logoPreview ? (
                          <div className="relative w-12 h-12 rounded-xl border border-slate-200 dark:border-[#282a36] overflow-hidden bg-white dark:bg-[#1a1b24] shrink-0">
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 cursor-pointer shadow-xs"
                              title="Remove logo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 dark:border-[#2f3242] flex items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#15161c] shrink-0">
                            <Building2 className="w-5 h-5 text-slate-400" />
                          </div>
                        )}

                        <div className="flex-1 space-y-1">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoSelect}
                          />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#252733] hover:bg-slate-100 dark:hover:bg-[#1d1f28] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-blue-500" />
                            <span>{logoFile ? 'Change Logo' : 'Upload Logo'}</span>
                          </button>
                          <p className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP up to 5MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* Management Group Info */}
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Management Group Details
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                            Management Group Name <span className="text-rose-500">*</span>
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

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                            Type <span className="text-rose-500">*</span>
                          </label>
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs cursor-pointer"
                          >
                            <option value="GROUP">Group</option>
                            <option value="INDIVIDUAL">Individual</option>
                          </select>
                        </div>
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
                            Admin Email Address
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
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
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
