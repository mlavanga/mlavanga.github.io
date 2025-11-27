import { MediaItem } from '../data/content';

export default function Media({ items }: { items: MediaItem[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {items.map((item, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
           <div className="p-6">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
             <p className="text-slate-600 dark:text-slate-300 mb-4">{item.description}</p>
             
             {item.video_id && item.video_id !== "PLACEHOLDER_VIDEO_ID" ? (
               <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                 <iframe 
                   width="100%" 
                   height="100%" 
                   src={`https://www.youtube.com/embed/${item.video_id}`} 
                   title={item.title}
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 ></iframe>
               </div>
             ) : item.channel_id ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-col p-6 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <div className="text-red-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Watch videos on my channel</p>
                    <a 
                        href={`https://youtube.com/channel/${item.channel_id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
                    >
                        Visit Channel
                    </a>
                </div>
             ) : (
                <div className="aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    Video content coming soon
                </div>
             )}
           </div>
        </div>
      ))}
    </div>
  );
}
