'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useContactDrawer } from './ContactDrawerContext';

const BUSINESS_TYPES = [
  'E-Commerce',
  'Retail / In-Store',
  'Service Provider',
  'Freelancer',
  'Healthcare',
  'Education',
  'Government',
  'BFSI / Finance',
  'Hospitality',
  'Other',
];

interface FormState {
  name: string;
  org: string;
  business: string;
  email: string;
  mobile: string;
}

const EMPTY: FormState = { name: '', org: '', business: '', email: '', mobile: '' };

export default function ContactDrawer() {
  const { open, closeDrawer } = useContactDrawer();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Drive CSS transition
  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible && !open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleClose = () => {
    closeDrawer();
    setTimeout(() => {
      setForm(EMPTY);
      setSubmitted(false);
    }, 350);
  };

  const field = (id: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [id]: value }));

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${open ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid lg:grid-cols-[1fr_1.2fr]">

          {/* ── Left info panel ── */}
          <div className="bg-linear-to-br from-[#f5f0fd] to-white p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full border border-[#7B4DB5]/25 bg-white/70 text-[#7B4DB5] text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7B4DB5] animate-pulse" />
                Get in touch
              </div>

              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-4">
                Let's Build Something<br />
                <span className="text-[#7B4DB5]">Great Together</span>
              </h2>

              <p className="text-sm text-slate-500 leading-relaxed mb-10 max-w-xs">
                Tell us about your business and our team will get back to you within one business day with a tailored solution for your payment needs.
              </p>

              {/* Contact details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#7B4DB5]/10 flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-[#7B4DB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Email us</div>
                    <div className="text-sm font-semibold text-slate-700">support@indypay.in</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#7B4DB5]/10 flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-[#7B4DB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Office</div>
                    <div className="text-sm font-semibold text-slate-700">Bengaluru, Karnataka, India</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="p-8 lg:p-10 bg-white overflow-y-auto max-h-[85vh]">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Request Received!</h3>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
                  Our team will review your details and get back to you within one business day.
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-[#7B4DB5] text-white text-sm font-bold rounded-xl hover:bg-[#6A3BA0] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black text-slate-900 mb-1">Send us a message</h3>
                <p className="text-sm text-slate-400 mb-7">We typically respond within 24 hours.</p>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                      Full Name <span className="text-[#7B4DB5]">*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <input
                        required
                        type="text"
                        placeholder="Rahul Sharma"
                        value={form.name}
                        onChange={(e) => field('name', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#7B4DB5] focus:bg-white focus:ring-2 focus:ring-[#7B4DB5]/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Organisation Name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                      Organisation Name <span className="text-[#7B4DB5]">*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <input
                        required
                        type="text"
                        placeholder="Acme Pvt. Ltd."
                        value={form.org}
                        onChange={(e) => field('org', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#7B4DB5] focus:bg-white focus:ring-2 focus:ring-[#7B4DB5]/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Type of Business */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                      Type of Business <span className="text-[#7B4DB5]">*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <select
                        required
                        value={form.business}
                        onChange={(e) => field('business', e.target.value)}
                        className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-[#7B4DB5] focus:bg-white focus:ring-2 focus:ring-[#7B4DB5]/15 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select business type</option>
                        {BUSINESS_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Company Email */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                      Company Email <span className="text-[#7B4DB5]">*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        required
                        type="email"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={(e) => field('email', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#7B4DB5] focus:bg-white focus:ring-2 focus:ring-[#7B4DB5]/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                      Mobile Number <span className="text-[#7B4DB5]">*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <input
                        required
                        type="tel"
                        placeholder="9876543210"
                        value={form.mobile}
                        onChange={(e) => field('mobile', e.target.value)}
                        pattern="[0-9]{10}"
                        maxLength={10}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#7B4DB5] focus:bg-white focus:ring-2 focus:ring-[#7B4DB5]/15 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#7B4DB5] text-white text-sm font-bold rounded-xl hover:bg-[#6A3BA0] transition-all shadow-lg shadow-[#7B4DB5]/25 hover:-translate-y-0.5 active:translate-y-0 mt-2"
                  >
                    Submit Request
                  </button>

                  <p className="text-center text-[10px] text-slate-400 leading-relaxed">
                    By submitting you agree to our{' '}
                    <a href="/policies/terms" className="text-[#7B4DB5] hover:underline">Terms of Service</a>
                    {' & '}
                    <a href="/policies/cookies" className="text-[#7B4DB5] hover:underline">Privacy Policy</a>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
