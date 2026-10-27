import React, { useState } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';
import { Mail, Send, Check, Copy, ArrowUpRight, MessageSquare, AlertCircle } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Collaborative Idea Exploration');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'opened' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const studioEmail = SITE_CONFIG.contact.email;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(studioEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please provide your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!message.trim() || message.length < 10) {
      setErrorMessage('Please enter a message of at least 10 characters.');
      return;
    }

    setStatus('preparing');

    // Honest mailto transmission encoding
    const fullSubject = `${SITE_CONFIG.contact.subjectPrefix} ${subject} from ${name}`;
    const fullBody = `Hello MK Labs Team,

${message}

---
Sender Details:
Name: ${name}
Email: ${email}
Project Concept: ${subject}
Origin: MK Labs Internet Projects Studio Direct Portal`;

    const mailtoUrl = `mailto:${studioEmail}?subject=${encodeURIComponent(
      fullSubject
    )}&body=${encodeURIComponent(fullBody)}`;

    // Trigger local email client
    window.location.href = mailtoUrl;
    setStatus('opened');
  };

  return (
    <section id="contact" className="relative py-28 border-t border-[#1E2638] bg-[#07090D] z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Direct Studio Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#4D8DFF] uppercase font-semibold">
                <span>06 / OPEN CHANNEL</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
                Have an Idea Worth Exploring?
              </h2>
              <p className="text-base sm:text-lg text-[#9AA6B5] leading-relaxed">
                We are interested in useful internet ideas, thoughtful experiments, and opportunities
                to build something meaningful.
              </p>
            </div>

            {/* Direct Studio Desk Card */}
            <div className="p-6 rounded-2xl border border-[#1E2638] bg-[#0D1118] space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono text-[#9AA6B5]">
                <span>STUDIO INBOX DIRECT</span>
                <span className="text-[#55F2E3] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55F2E3]" />
                  Active Desk
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#07090D] border border-[#1E2638]">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Mail className="w-4 h-4 text-[#4D8DFF] shrink-0" />
                  <span className="font-mono text-xs sm:text-sm text-[#F5F7FA] truncate">
                    {studioEmail}
                  </span>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1E2638] text-xs font-mono text-[#F5F7FA] hover:bg-[#4D8DFF] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Copy email to clipboard"
                  aria-label="Copy studio email address"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#55F2E3]" />
                      <span className="text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-[#9AA6B5] leading-relaxed">
                {SITE_CONFIG.contact.note}
              </p>
            </div>

            {/* Quick Action Button */}
            <div>
              <a
                href={`mailto:${studioEmail}?subject=${encodeURIComponent(
                  SITE_CONFIG.contact.subjectPrefix + ' General Inquiry'
                )}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D1118] border border-[#1E2638] text-sm font-semibold text-[#F5F7FA] hover:border-[#4D8DFF] hover:bg-[#1E2638]/40 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF]"
              >
                <span>Start a Conversation</span>
                <ArrowUpRight className="w-4 h-4 text-[#4D8DFF]" />
              </a>
            </div>
          </div>

          {/* Right Column: Honest Transmission Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-10 rounded-2xl border border-[#1E2638] bg-[#0D1118] shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1E2638]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#4D8DFF]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[#F5F7FA]">
                    Dispatch Transmission to Studio
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#9AA6B5]">DIRECT DISPATCH</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {status === 'opened' && (
                  <div className="p-4 rounded-xl bg-[#4D8DFF]/10 border border-[#4D8DFF] text-xs text-[#F5F7FA] space-y-2">
                    <div className="flex items-center gap-2 text-[#55F2E3] font-semibold">
                      <Check className="w-4 h-4" />
                      <span>Email Client Launch Triggered</span>
                    </div>
                    <p className="text-[#9AA6B5]">
                      Your mail client was opened with the formatted transmission addressed to{' '}
                      <span className="font-mono text-[#F5F7FA]">{studioEmail}</span>. If your mail client did not open automatically, you can send your message directly to that address.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#9AA6B5] uppercase mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Mercer"
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-[#07090D] border border-[#1E2638] text-sm text-[#F5F7FA] placeholder-[#9AA6B5]/40 focus:outline-none focus:border-[#4D8DFF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#9AA6B5] uppercase mb-1.5">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@domain.com"
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-[#07090D] border border-[#1E2638] text-sm text-[#F5F7FA] placeholder-[#9AA6B5]/40 focus:outline-none focus:border-[#4D8DFF] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9AA6B5] uppercase mb-1.5">
                    Concept / Topic
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#07090D] border border-[#1E2638] text-sm text-[#F5F7FA] focus:outline-none focus:border-[#4D8DFF] transition-colors cursor-pointer"
                  >
                    <option value="Browser Tool Proposal">Browser Tool Proposal</option>
                    <option value="FileBatch / Mekit / SayHola Feedback">
                      Existing Product Feedback
                    </option>
                    <option value="Technical Collaboration">Technical Collaboration</option>
                    <option value="Experimental Concept">Experimental Concept</option>
                    <option value="General Studio Inquiry">General Studio Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9AA6B5] uppercase mb-1.5">
                    Idea or Message *
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the tool, question, or problem worth exploring..."
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-[#07090D] border border-[#1E2638] text-sm text-[#F5F7FA] placeholder-[#9AA6B5]/40 focus:outline-none focus:border-[#4D8DFF] transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[11px] font-mono text-[#9AA6B5]">
                    Transmits directly via verified mail client to MK Labs.
                  </p>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#4D8DFF] hover:bg-[#3d7ae6] text-white text-xs font-semibold transition-all shadow-[0_0_20px_rgba(77,141,255,0.25)] cursor-pointer"
                  >
                    <span>Transmit Message</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
