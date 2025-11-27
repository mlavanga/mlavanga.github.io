export interface ExperienceItem {
  title: string;
  sub_title?: string;
  caption: string;
  link?: string;
  link_text?: string;
  description: string;
}

export interface ProjectItem {
  title: string; // Mapped from description bold part or title
  description: string;
  link?: string;
  link_text?: string;
  tags: string[];
  date?: string;
  quote?: string;
}

export interface SkillItem {
  name: string;
  level: string;
}

export interface MediaItem {
  title: string;
  video_id?: string;
  channel_id?: string;
  description: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string[];
  phone: string;
  website: string;
  cv: string;
  socials: {
    github: string;
    linkedin: string;
    scholar: string;
    orcid: string;
    youtube: string;
  };
  about: string;
}

export const personalInfo: PersonalInfo = {
  name: "Mario Lavanga",
  title: "Senior research engineer | Biomedical Signal Processing & AI Scientist",
  email: ["m.lavanga@gmail.com"],
  phone: "+33 6 52 93 31 80",
  website: "https://mlavanga.github.io",
  cv: "/documents/LAVANGA_CV.pdf",
  socials: {
    github: "mlavanga",
    linkedin: "mario-lavanga-87a0a7a3",
    scholar: "oM1rUeIAAAAJ&hl",
    orcid: "0000-0002-3615-033X",
    youtube: "UCPGcAPYLko6G6p-1ZfM8CvQ",
  },
  about: `Born in Italy and raised by a medical doctor and a housewife, since his childhood Mario has developed an early interest in human physiology and biology. Doubtful to seek a clinical career, he went on to study Biomedical engineering at Polytechnic university of Milan, where he delved into the intertwined realities of physics and biology. During his studies, he had the opportunity to build a strong background in the field of biomedical signal processing. Furthermore, he joined a top-level students program organized by the two main Italian technical universities, known as Alta Scuola Politecnica (ASP), which provided opportunity to learn a multidisciplinary approach to solving problems. The skills he acquired have been useful in his career, which has been characterized by frequent interactions with clinical doctors. 
  
  Immediately after graduating, he moved to KU Leuven, Belgium, where he started focusing on mental health and neurodevelopment as part of his PhD studies. In January 2017, he received a strategic basic research grant from the Flemish scientific research fund (FWO). The goal of his research was to quantify stress in premature babies by means of EEG and ECG signal processing and to understand its impact on the infants’ development. After its graduation, he moved to Aix-Marseille University, France, for a postdoc position. Within the framework of the Human Brain Project, he developed a new modelling pipeline to explain the drivers of healthy aging and virtually reproduce them thanks to the Virtual Brain technology by Prof. Viktor Jirsa. The pipeline has been recognised as successful showcase by the European and its available at following link (https://github.com/ins-amu/virtual_aging_brain).

  After many years in academia, he decided to move to Switzerland for a new position as research engineer - data scientist at Hamilton Medical, where he focuses on the reduction of the asynchronies between patients and ICU ventilators.

  His main research interests are time-series analysis, digital signal processing, nonlinear dynamics and graph theory applied to the biomedical world. Commonly nicknamed as AI evangelist by his colleagues, he pioneers AI coding tools among his pioneers, especially agentic program like Claude Code, Qwen Code and Gemini CLI.  Besides science, Mario enjoys playing theatre in multiple languages (currently in German). He does also enjoys long-distance running, learning new languages and travelling in Asia.`
};

export const experience: ExperienceItem[] = [
  {
    title: "HAMILTON MEDICAL AG",
    sub_title: "Project Manager",
    caption: "December 2024 - Present",
    link: "https://www.hamilton-medical.com/",
    link_text: "Hamilton Medical Website",
    description: "Leading the development of AI-driven and signal-processing cloud solutions for ventilation management. Orchestrating the lifecycle of advanced signal processing features from ideation, simulation to IP protection and regulatory approval."
  },
  {
    title: "HAMILTON MEDICAL AG",
    sub_title: "Senior Research Engineer",
    caption: "June 2022 - Present",
    link: "https://www.hamilton-medical.com/",
    link_text: "Hamilton Medical Website",
    description: "Optimized real-time algorithms for the company’s flagship devices to monitor and alleviate patient-ventilator interactions. Pioneered Deep Learning and rule-based systems to estimate respiratory mechanics and patient effort. Working on patent applications."
  },
  {
    title: "TNG - INSTITUT DE NEUROSCIENCES DES SYSTÈMES",
    sub_title: "Postdoctoral Researcher",
    caption: "October 2020 - Present",
    link: "https://ins-amu.fr/members",
    link_text: "INS Website",
    description: "Postdoctoral researcher at the INS focusing on functional connectivity in the context of healthy ageing. Part of the theoretical neuroscience group working on resting state brain dynamics using Python, Jupyter-lab, Slurm, and SnakeMake."
  },
  {
    title: "Flemish scientific research fund (FWO)",
    sub_title: "S.B. PhD Fellow at ESAT departement, STADIUS group, KU Leuven",
    caption: "January 2017 - September 2020",
    link: "https://www.fwo.be/en/news/results/phd-fellowships-and-postdoctoral-fellowships/results-sb-fellowships-call-2016/",
    link_text: "FWO website",
    description: "Developed a model to quantify stress and pain in premature infants. Investigated scalp-EEG connectivity, nonlinear properties of neonatal EEG, and heart-rate variability fractality. Codes developed in Matlab."
  },
  {
    title: "KU LEUVEN",
    sub_title: "PhD Fellow at ESAT departement, STADIUS group",
    caption: "January 2016 - December 2016",
    link: "https://www.esat.kuleuven.be/stadius/",
    link_text: "STADIUS website",
    description: "First year PhD research dedicated to neonatal physiology, development, machine learning, and graph theory."
  }
];

export const education: ExperienceItem[] = [
  {
    title: "KU Leuven",
    sub_title: "Doctor of Engineering Science (PhD) - Electrical Engineering",
    caption: "2016 - 2020",
    description: "Perfectioned research and communication skills to deliver clinical sounding results based on mathematical and data science knowledge."
  },
  {
    title: "Alta Scuola Politecnica",
    sub_title: "Double Degree Program",
    caption: "2013 - 2015",
    description: "Multidisciplinary program organized by Politecnico di Milano and Politecnico di Torino."
  },
  {
    title: "Politecnico di Milano",
    sub_title: "MSc in Biomedical Engineering",
    caption: "2013 - 2015",
    description: "Focus on biomedical signal processing and biophysical models. Master thesis on mathematical theories combining programming with data analysis."
  },
  {
    title: "Politecnico di Milano",
    sub_title: "BA in Biomedical Engineering",
    caption: "2010 - 2013",
    description: "Basis of engineering science, chemistry, continuum mechanics, electronics, and economics."
  }
];

export const projects: ProjectItem[] = [
  {
    title: "The Virtual Aging Brain",
    description: "Modelling aging and neurodevelopment with The Virtual Brain. Creating a virtual aging cohort based on the 1000 brains study dataset using Python, JupyterLab, Git, SnakeMake, and Slurm.",
    link: "https://github.com/ins-amu/virtual_aging_brain",
    tags: ["Neuroscience", "Python", "HPC", "Modeling"],
    quote: "Modelling aging and neurodevelopment with The Virtual Brain"
  },
  {
    title: "The Perinatal Stress Calculator",
    description: "PhD research focused on the detection of early-life pain and stress in premature infants by means of physiological signal processing (EEG, ECG). Developed in Matlab.",
    link: "https://mlavanga.github.io/documents/LAVANGA_Mario_Thesis_Sep2020.pdf",
    tags: ["Biomedical Engineering", "Matlab", "Signal Processing"],
    quote: "Modeling early-life and pain in premature infants"
  },
  {
    title: "Vote-chain project",
    description: "Possible scenarios to introduce a blockchain system for e-voting to improve democratic engagement.",
    link: "https://yezers.it/collegi-elettorali/",
    tags: ["Blockchain", "Society"],
    quote: "Possible scenarios to introduce a blockchain system for e-voting"
  }
];

export const publications: ProjectItem[] = [
  {
    title: "The virtual aging brain",
    description: "The virtual aging brain: Causal inference supports interhemispheric dedifferentiation in healthy aging. NeuroImage, 2023",
    link: "https://www.sciencedirect.com/science/article/pii/S1053811923005542?via%3Dihub",
    tags: ["Publication", "Aging", "Brain"],
    date: "Feb 2022"
  },
  {
    title: "Quantitative EEG analysis in TSC",
    description: "Results associated with autism spectrum disorder and development abnormalities in infants with tuberous sclerosis complex. Biomed. Signal Process. Control, 2021.",
    link: "https://www.sciencedirect.com/science/article/abs/pii/S174680942100255X",
    tags: ["Publication", "EEG", "Autism"],
    date: "July 2021"
  },
  {
    title: "Stress detection in preterm infants",
    description: "The effect of early procedural pain on the maturation of EEG and heart rate variability. PAIN, 2021.",
    link: "https://journals.lww.com/pain/Fulltext/2021/05000/The_effect_of_early_procedural_pain_in_preterm.27.aspx",
    tags: ["Publication", "Pain", "Preterm"],
    date: "May 2021"
  },
  {
    title: "Maturation of the Autonomic Nervous System",
    description: "Estimating Development Based on Heart-Rate Variability Analysis. Front Physiol., 2021.",
    link: "https://www.frontiersin.org/articles/10.3389/fphys.2020.581250/full",
    tags: ["Publication", "HRV", "Development"],
    date: "Jan 2021"
  }
];

export const skills: SkillItem[] = [
  { name: "Python", level: "Advanced" },
  { name: "Matlab", level: "Expert" },
  { name: "C#", level: "Advanced" },
  { name: "Bash", level: "Advanced" },
  { name: "Powershell", level: "Advanced" },
  { name: "HTML", level: "Advanced" },
  { name: "JavaScript", level: "Advanced" },
  { name: "React", level: "Advanced" },
  { name: "Azure", level: "Advanced" },
  { name: "Azure AI Foundry", level: "Advanced" },
  { name: "Azure DevOps", level: "Advanced" },
  { name: "Tensorflow", level: "Advanced" },
  { name: "ASP.NET", level: "Advanced" },
  { name: "Git", level: "Advanced" },
  { name: "Agile", level: "Expert" },
  { name: "Scrum", level: "Expert" },
  { name: "Claude Code", level: "Advanced" },
  { name: "Gemini CLI", level: "Advanced" },
  { name: "Qwen Code", level: "Advanced" }
];

export const media: MediaItem[] = [
    {
        title: "PhD Graduation Video",
        description: "Video recording of the PhD graduation ceremony.",
        video_id: "qyrnEi6g_2E" 
    },
    {
        title: "Talk at University of Virginia",
        description: "Invited talk at the University of Virginia.",
        video_id: "g5aOjIj49X4"
    }
];
