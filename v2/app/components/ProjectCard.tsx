import { ProjectItem } from '../data/content';

export default function ProjectCard({ item }: { item: ProjectItem }) {
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{item.title}</h3>
            {item.date && <span className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">{item.date}</span>}
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 line-clamp-4">
          {item.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {item.tags.map((tag, idx) => (
            <span key={idx} className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
        <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2 group-hover:gap-3 transition-all">
          View Project 
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </a>
      </div>
    </div>
  );
}
