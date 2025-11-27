export default function Section({ id, title, children, className = "" }: { id: string; title: string; children: React.ReactNode; className?: string }) {
    return (
      <section id={id} className={`py-20 ${className}`}>
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-slate-900 dark:text-white relative inline-block">
            {title}
            <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-blue-500 rounded-full"></span>
          </h2>
          {children}
        </div>
      </section>
    );
  }
