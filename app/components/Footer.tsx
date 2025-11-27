import { PersonalInfo } from '../data/content';

export default function Footer({ info }: { info: PersonalInfo }) {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-6">{info.name}</h2>
        
        <div className="flex justify-center gap-8 mb-8">
           <a href={`mailto:${info.email[0]}`} className="hover:text-blue-400 transition-colors">Email</a>
           <a href={`https://github.com/${info.socials.github}`} className="hover:text-blue-400 transition-colors">GitHub</a>
           <a href={`https://linkedin.com/in/${info.socials.linkedin}`} className="hover:text-blue-400 transition-colors">LinkedIn</a>
           <a href={`https://twitter.com/${info.socials.twitter}`} className="hover:text-blue-400 transition-colors">Twitter</a>
        </div>
        
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} {info.name}. All rights reserved.
          <br />
          Built with Next.js & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
