import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Section from './components/Section';
import ExperienceCard from './components/ExperienceCard';
import ProjectCard from './components/ProjectCard';
import Skills from './components/Skills';
import Media from './components/Media';
import Footer from './components/Footer';
import { personalInfo, experience, education, projects, publications, skills, media } from './data/content';

export default function Home() {
  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      <Hero info={personalInfo} />
      
      <Section id="experience" title="Experience" className="bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto">
          {experience.map((item, index) => (
            <ExperienceCard key={index} item={item} />
          ))}
        </div>
      </Section>

       <Section id="education" title="Education" className="bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-3xl mx-auto">
          {education.map((item, index) => (
            <ExperienceCard key={index} item={item} />
          ))}
        </div>
      </Section>
      
      <Section id="projects" title="Featured Projects">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((item, index) => (
            <ProjectCard key={index} item={item} />
          ))}
        </div>
      </Section>

      <Section id="publications" title="Recent Publications" className="bg-white dark:bg-slate-900">
        <div className="grid md:grid-cols-2 gap-6">
          {publications.map((item, index) => (
            <ProjectCard key={index} item={item} />
          ))}
        </div>
      </Section>

      <Section id="skills" title="Skills & Proficiency" className="bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <Skills items={skills} />
        </div>
      </Section>

      <Section id="media" title="Media" className="bg-white dark:bg-slate-900">
         <Media items={media} />
      </Section>

      <Section id="contact" title="Get in Touch" className="bg-blue-600 text-white">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xl mb-8 opacity-90">
            I'm always open to discussing new research opportunities, collaborations, or just chatting about AI coding tools.
          </p>
          <a href={`mailto:${personalInfo.email[0]}`} className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:bg-blue-50 transition-transform hover:scale-105">
            Say Hello
          </a>
        </div>
      </Section>

      <Footer info={personalInfo} />
    </main>
  );
}