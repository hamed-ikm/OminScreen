export default function Testimonial() {
  return (
    <div className="bg-[#0033A0] py-24 md:py-32 relative overflow-hidden">
      {/* Decorative background grid for the testimonial */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.1]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>

      <div className="max-w-[1800px] mx-auto px-6 lg:px-16 relative z-10 flex flex-col md:flex-row items-center gap-16 justify-end">
        {/* Abstract illustrative element for client side */}
        <div className="hidden lg:block w-1/3 aspect-square relative">
          <div className="absolute inset-0 border border-white/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
          <div className="absolute inset-4 border border-white/30 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
          <div className="absolute inset-8 border border-white/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 font-mono text-sm tracking-widest">
            OMNI // DATA
          </div>
        </div>
      </div>
    </div>
  );
}
