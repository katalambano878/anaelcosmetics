"use client";

import { useState } from 'react';

// Newsletter Component
export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setEmail('');
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 max-w-[85rem] mx-auto px-4 sm:px-6 mb-12">
      <div className="bg-gradient-to-r from-[#060e25] via-[#081a43] to-[#061237] rounded-[2.5rem] overflow-hidden shadow-[0_14px_50px_-16px_rgba(2,8,25,0.75)] relative border border-[#1c2a55] group transition-all duration-700 hover:shadow-[0_20px_70px_-18px_rgba(2,8,25,0.85)]">

        {/* Subtle Background Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80 transition-opacity duration-1000 group-hover:opacity-100">
          <div className="absolute top-0 right-1/4 w-[45rem] h-[45rem] bg-[#1b5cff]/20 rounded-full blur-[120px] transform -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-1/4 w-[45rem] h-[45rem] bg-[#1ed0ff]/20 rounded-full blur-[120px] transform translate-y-1/2"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-10 md:p-14 lg:p-16 xl:px-24 xl:py-20 gap-12 lg:gap-16">

          {/* Left Content */}
          <div className="w-full lg:w-1/2 text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0d1f47]/80 border border-[#2b5ca7]/40 text-[#d4e5ff] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-sm transition-all duration-500 hover:bg-[#11285a]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ac8ff] shadow-[0_0_10px_rgba(42,200,255,0.8)] animate-pulse"></span>
              The Insider Club
            </div>

            <h3 className="text-4xl md:text-5xl lg:text-[56px] font-serif text-white mb-6 leading-[1.12] tracking-tight">
              Unlock <span className="italic font-light text-[#2ac8ff]">10% Off</span> <br /> Your First Order
            </h3>

            <p className="text-[#c2d0ea]/90 text-[15.5px] leading-relaxed max-w-[27rem]">
              Be the first to know about new arrivals, restocks, and exclusive deals. From dresses to electronics, we keep you updated on the latest products.
            </p>
          </div>

          {/* Right Form */}
          <div className="w-full lg:w-1/2 flex justify-start lg:justify-end">
            <div className="w-full max-w-[28rem] bg-[#0a1536]/75 backdrop-blur-2xl p-2 rounded-[1.25rem] border border-[#1f396f] transition-all duration-500 focus-within:bg-[#0d1b43] focus-within:border-[#2f5ea8] focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-[#2b4f95]">
              <form onSubmit={handleSubmit} className="flex gap-2 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-transparent border-none text-white placeholder-[#94a3c4] px-6 py-4 focus:ring-0 text-[15px] outline-none w-full transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative bg-[#2ac8ff] overflow-hidden text-[#031735] font-semibold px-8 py-4 rounded-xl transition-all duration-500 disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap text-[15px] flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(42,200,255,0.3)] hover:shadow-[0_10px_30px_rgba(42,200,255,0.4)] hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  {isSubmitting ? (
                    <i className="ri-loader-4-line animate-spin text-lg relative z-10"></i>
                  ) : (
                    <>
                      <span className="relative z-10">Join</span>
                      <i className="ri-arrow-right-line transition-transform duration-500 group-hover:translate-x-1 relative z-10"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

        {submitStatus === 'success' && (
          <div className="absolute top-6 right-6 lg:right-10 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3 border border-gray-800">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <i className="ri-check-line text-blue-400 text-sm"></i>
            </div>
            <span className="text-[14px] tracking-wide">Welcome to the club!</span>
          </div>
        )}
      </div>
    </div>
  );
}
