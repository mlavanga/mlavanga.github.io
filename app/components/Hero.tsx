import { PersonalInfo } from '../data/content';

export default function Hero({ info }: { info: PersonalInfo }) {
  return (
    <section id="about" className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
            Senior Research <Engineer></Engineer> & Project Manager
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Hi, I'm <span className="text-blue-600 dark:text-blue-400">{info.name}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
            {info.title}
          </p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
            Deciphering the brain's complexity through code and data. Specializing in multimodal sensor fusion, brain modeling, and real-time patient monitoring.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <a href={info.cv} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
              Download CV
            </a>
            <a href="#contact" className="px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Contact Me
            </a>
          </div>

          <div className="flex gap-4 pt-4">
            <SocialLink href={`https://github.com/${info.socials.github}`} icon="github" />
            <SocialLink href={`https://linkedin.com/in/${info.socials.linkedin}`} icon="linkedin" />
            <SocialLink href={`https://scholar.google.com/citations?user=${info.socials.scholar}`} icon="scholar" />
            <SocialLink href={`https://youtube.com/channel/${info.socials.youtube}`} icon="youtube" />
          </div>
        </div>

        <div className="relative flex justify-center">
            {/* Placeholder for 3D Brain or Neural Network Visual */}
            <div className="w-80 h-80 md:w-96 md:h-96 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full opacity-20 blur-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 rotate-3 hover:rotate-0 transition-all duration-500">
                <img src="/images/profile.jpg" alt={info.name} className="w-full h-full object-cover" />
            </div>
        </div>
      </div>
    </section>
  );
}

function SocialLink({ href, icon }: { href: string; icon: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
      <span className="sr-only">{icon}</span>
      {icon === 'github' && (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      )}
      {icon === 'linkedin' && (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
      )}
      {icon === 'scholar' && (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/></svg>
      )}
      {icon === 'youtube' && (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      )}
    </a>
  );
}
