import React, { useState } from 'react';
import { Mail, Linkedin, Copy, Check, ExternalLink, Send, AlertCircle } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSent, setIsSent] = useState(false);

  const contactEmail = SITE_CONFIG.contact.email;
  const linkedinUrl = SITE_CONFIG.social.linkedin;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSent(false);

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!message.trim() || message.length < 10) {
      setErrorMsg('Please write a message with at least 10 characters.');
      return;
    }

    const fullSubject = `${SITE_CONFIG.contact.subjectPrefix} ${subject} from ${name}`;
    const fullBody = `Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent via MK Labs Contact Portal`;

    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(
      fullSubject
    )}&body=${encodeURIComponent(fullBody)}`;

    window.location.href = mailtoUrl;
    setIsSent(true);
  };

  return (
    <section id="contact" className="py-12 sm:py-16 md:py-28 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">
            Contact
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Let&apos;s Connect
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Have a question, idea, or collaboration in mind? Get in touch with MK Labs.
          </p>
        </div>

        <div className="mt-8 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          {/* Left Column: Direct Contact Info & LinkedIn */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* LinkedIn Card */}
            <div className="p-5 sm:p-6 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Linkedin className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Company Page
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Follow MK Labs on LinkedIn
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Stay updated with our latest digital product launches, project milestones, and tech announcements.
                </p>
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-200/80">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-0 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors break-all"
                >
                  <span>linkedin.com/company/mk-labs-2026</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </div>
            </div>

            {/* Email Card */}
            <div className="p-5 sm:p-6 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-md bg-slate-200/80 flex items-center justify-center text-slate-700">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Direct Email
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Direct Studio Inbox
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {SITE_CONFIG.contact.note}
                </p>
              </div>

              {/* Email Address with Copy Button */}
              <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-md bg-white border border-slate-200 text-sm min-w-0">
                <span className="font-mono text-slate-800 text-xs sm:text-sm truncate min-w-0">
                  {contactEmail}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 px-3 min-h-[38px] text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors shrink-0 cursor-pointer"
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Contact Message Form */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-8 rounded-lg border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Send a Message
            </h3>
            <p className="text-sm text-slate-600 mb-5 sm:mb-6">
              Fill out the form below to initiate a conversation directly with our team.
            </p>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSent && (
              <div className="mb-5 p-4 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-blue-700">
                  <Check className="w-4 h-4" />
                  <span>Email Client Opened</span>
                </div>
                <p className="text-slate-600">
                  Your mail app was opened with your message addressed to{' '}
                  <span className="font-mono text-slate-800 break-all">{contactEmail}</span>. You can also send directly from your preferred email client anytime.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-white cursor-pointer"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Product Feedback">Product Feedback (FileBatch, Mekit, ImgKit, Certificate Studio)</option>
                  <option value="Collaboration Opportunity">Collaboration Opportunity</option>
                  <option value="New Project Idea">New Project Idea</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist you or collaborate?"
                  required
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors resize-y"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500 break-all">
                  Sends directly to {contactEmail}
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span>Send Message</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
