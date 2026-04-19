import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white pt-24 pb-12">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-24">
          
          {/* Brand Col */}
          <div className="lg:col-span-1">
            <h2 className="text-3xl font-black tracking-tight mb-6">OMNISCREEN</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 max-w-2xl">
              Our platform integrates high-dimensional molecular descriptors with a multi-model ensemble architecture (Random Forest, XGBoost, and Logistic Regression). By utilizing Sequential Feature Selection (SFS), Omni Screen distills complex chemical data into actionable insights, significantly reducing the time and cost of traditional drug development.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-800 pt-8 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} OmniScreen Agency. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <span>Iraq</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
