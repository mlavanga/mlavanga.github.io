import { SkillItem } from '../data/content';

export default function Skills({ items }: { items: SkillItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div key={index} className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 text-center hover:border-blue-500/30 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{item.level}</p>
        </div>
      ))}
    </div>
  );
}
