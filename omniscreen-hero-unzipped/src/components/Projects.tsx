import { ArrowUpRight } from 'lucide-react';

const projects = [
  { img: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&q=80', title: 'Novartis Pulse', tag: 'UI/UX Design' },
  { img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80', title: 'Gilead Portal', tag: 'Web Platform' },
  { img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80', title: 'Pfizer Connect', tag: 'Brand Identity' },
  { img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80', title: 'Roche Analytics', tag: 'Data Visualisation' }
];

export default function Projects() {
  return (
    <div className="bg-white py-24 md:py-32">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h3 className="text-[#0033A0] font-bold tracking-widest uppercase text-sm mb-6">Selected Work</h3>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              FEATURED <br/> PROJECTS
            </h2>
          </div>
          <button className="flex shrink-0 items-center justify-center gap-3 bg-white border border-gray-200 text-[#0F172A] rounded-full pl-6 pr-2 py-2 text-[15px] font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group self-start md:self-auto">
            View All Work
            <div className="bg-slate-100 group-hover:bg-[#0033A0] transition-colors text-slate-600 group-hover:text-white w-10 h-10 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((proj, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-6 shadow-sm border border-gray-100">
                <img 
                  src={proj.img} 
                  alt={proj.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors duration-500" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-black text-slate-900 mb-1">{proj.title}</h4>
                  <p className="text-slate-500 font-medium">{proj.tag}</p>
                </div>
                <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-slate-400 group-hover:bg-[#0033A0] group-hover:border-[#0033A0] group-hover:text-white transition-all">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
