import { ExperienceItem } from '../data/content';

export default function ExperienceCard({ item }: { item: ExperienceItem }) {
  return (
    <div className="relative pl-8 pb-12 border-l-2 border-slate-200 dark:border-slate-700 last:pb-0 group">
      <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 group-hover:bg-blue-500 transition-colors"></div>
      
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
            <p className="text-blue-600 dark:text-blue-400 font-medium">{item.sub_title}</p>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400 mt-1 sm:mt-0 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap">
            {item.caption}
          </span>
        </div>
        
        <div className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.description }} />
        
        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            {item.link_text || "Visit Website"} 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
        )}
      </div>
    </div>
  );
}
