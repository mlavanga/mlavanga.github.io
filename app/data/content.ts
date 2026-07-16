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
  title: "Senior Research Engineer & Project Leader · Health AI, Causal Inference & Biosignal Processing",
  email: ["m.lavanga@gmail.com"],
  phone: "+41 79 908 5427",
  website: "https://mlavanga.github.io",
  cv: "/documents/LAVANGA_CV.pdf",
  socials: {
    github: "mlavanga",
    linkedin: "mario-lavanga-87a0a7a3",
    scholar: "oM1rUeIAAAAJ",
    orcid: "0000-0002-3615-033X",
    youtube: "UCPGcAPYLko6G6p-1ZfM8CvQ",
  },
  about: `I build deep-learning and signal-processing models on physiological data, then prove they hold up on real hospital data before they reach a patient. At Hamilton Medical I work on ICU ventilation in a regulated environment. I trained as a biomedical signal-processing engineer (MSc Politecnico di Milano, PhD KU Leuven), but most of my day-to-day work is the statistics: causal inference, time-series modelling, and uncertainty quantification on messy, observational ICU and NICU data.

  Before Hamilton I spent years in academia. As a postdoc at Aix-Marseille University I worked on the drivers of healthy brain aging with The Virtual Brain, published in NeuroImage (2023); during my PhD at KU Leuven I quantified stress and pain in premature infants from EEG and heart-rate variability. Across NICU, aging and ICU work I have published nine first-author papers on multimodal biosignals.

  I work hands-on with modern ML tooling — Python, PyTorch/TensorFlow, and agentic coding tools like Claude Code, Codex, Cline and Gemini CLI, including custom MCP servers. Off the clock I act in amateur theatre (currently in German), run long distances, and keep collecting languages.`
};

export const positioning = {
  headline: "I build deep-learning and signal-processing models on physiological data.",
  subline: "Health AI with statistical rigour — time-series modelling, causal inference, supervised learning and uncertainty quantification, on observational ICU and NICU data under regulated constraints.",
};

export const selectedWork: ProjectItem[] = [
  {
    title: "Signal processing for ICU ventilation",
    description: "I develop signal-processing algorithms for ICU ventilation and deploy them on embedded devices and a cloud platform, in a regulated environment.",
    tags: ["ICU ventilation", "Signal processing", "Embedded + cloud", "Regulated"],
  },
  {
    title: "Causal inference",
    description: "I apply Granger and Bayesian causal discovery to ICU time series to understand what drives ICU events.",
    tags: ["Granger", "Bayesian", "Causal discovery", "Time series"],
  },
  {
    title: "Supervised learning on biosignals",
    description: "Supervised models on physiological signals — for example sleep staging and stress detection.",
    tags: ["Supervised learning", "Sleep staging", "Stress detection", "Biosignals"],
  },
  {
    title: "The virtual aging brain",
    description: "Modelling the virtual aging brain with variational autoencoders and brain-network analysis (Human Brain Project; NeuroImage 2023).",
    tags: ["Variational autoencoders", "Brain networks", "Human Brain Project", "NeuroImage 2023"],
  },
  {
    title: "Multi-endpoint ADMET panel",
    description: "A 13-endpoint ADMET panel (TDC benchmark) predicted from SMILES with calibrated uncertainty and applicability-domain flags, running entirely in the browser (RDKit-JS + ONNX).",
    tags: ["ADMET", "RDKit", "Conformal UQ", "Applicability domain", "ONNX"],
  },
];

export const trustSignals = {
  citations: 612,
  hIndex: 13,
  i10Index: 18,
  firstAuthorPapers: 9,
  note: "Google Scholar, June 2026",
};

export const experience: ExperienceItem[] = [
  {
    title: "HAMILTON MEDICAL AG",
    sub_title: "Project Leader",
    caption: "December 2024 - Present",
    link: "https://www.hamilton-medical.com/",
    link_text: "Hamilton Medical Website",
    description: "Leading cloud ventilation-management features from research through IP protection and regulatory submission."
  },
  {
    title: "HAMILTON MEDICAL AG",
    sub_title: "Senior Research Engineer",
    caption: "June 2022 - December 2024",
    link: "https://www.hamilton-medical.com/",
    link_text: "Hamilton Medical Website",
    description: "Built deep-learning and rule-based models for patient–ventilator asynchrony, respiratory mechanics, and patient effort, and optimized signal-processing algorithms for both embedded devices and a cloud platform. Working on patent applications."
  },
  {
    title: "TNG - INSTITUT DE NEUROSCIENCES DES SYSTÈMES",
    sub_title: "Postdoctoral Researcher",
    caption: "October 2020 - June 2022",
    link: "https://ins-amu.fr/members",
    link_text: "INS Website",
    description: "Studied functional connectivity in healthy aging with the theoretical neuroscience group, using causal inference and variational autoencoders on resting-state brain dynamics (Python, JupyterLab, Slurm, SnakeMake). Work published in NeuroImage (2023)."
  },
  {
    title: "Flemish scientific research fund (FWO)",
    sub_title: "S.B. PhD Fellow at ESAT department, STADIUS group, KU Leuven",
    caption: "January 2017 - September 2020",
    link: "https://www.fwo.be/en/support-programmes/all-calls/phd/phd-fellowship-strategic-basic-research/",
    link_text: "FWO website",
    description: "Developed a model to quantify stress and pain in premature infants. Investigated scalp-EEG connectivity, nonlinear properties of neonatal EEG, and heart-rate variability fractality. Codes developed in Matlab."
  },
  {
    title: "KU LEUVEN",
    sub_title: "PhD Fellow at ESAT department, STADIUS group, Biomed Team",
    caption: "January 2016 - December 2016",
    link: "https://biomed-kuleuven.web.app/",
    link_text: "Biomed Team Website",
    description: "First-year PhD research dedicated to neonatal physiology, development, machine learning, and graph theory."
  }
];

export const education: ExperienceItem[] = [
  {
    title: "KU Leuven",
    sub_title: "Doctor of Engineering Science (PhD) - Electrical Engineering",
    caption: "2016 - 2020",
    description: "Perfected research and communication skills to deliver clinically sound results based on mathematical and data science knowledge."
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
    description: "Focus on biomedical signal processing and biophysical models. Master thesis on the estimation of the baroreflex in an animal model."
  },
  {
    title: "Politecnico di Milano",
    sub_title: "BA in Biomedical Engineering",
    caption: "2010 - 2013",
    description: "Basis of engineering science, continuum mechanics, electronics, and control theory."
  }
];

export const projects: ProjectItem[] = [
  {
    title: "Patient-ventilator asynchronies",
    description: "Optimizing patient-ventilator asynchrony detection in mechanically ventilated patients using advanced signal-processing techniques.",
    link: "https://www.hamilton-medical.com/en_US/Products/Technologies/IntelliSync.html",
    tags: ["Respiratory Mechanics", "Signal Processing", "Python", "C#"],
    quote: "Optimizing patient-ventilator asynchrony detection"
  },
  {
    title: "The Virtual Aging Brain",
    description: "Modelling aging and neurodevelopment with The Virtual Brain. Creating a virtual aging cohort based on the 1000 Brains Study dataset using Python, JupyterLab, Git, SnakeMake, and Slurm.",
    link: "https://github.com/ins-amu/virtual_aging_brain",
    tags: ["Neuroscience", "Python", "HPC", "Modeling"],
    quote: "Modelling aging and neurodevelopment with The Virtual Brain"
  },
  {
    title: "The Perinatal Stress Calculator",
    description: "PhD research focused on the detection of early-life pain and stress in premature infants by means of physiological signal processing (EEG, ECG). Developed in Matlab.",
    link: "https://mlavanga.github.io/documents/LAVANGA_Mario_Thesis_Sep2020.pdf",
    tags: ["Biomedical Engineering", "Matlab", "Signal Processing"],
    quote: "Modelling early-life stress and pain in premature infants"
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
    date: "Dec 2023"
  },
  {
    title: "Quantitative EEG analysis in TSC",
    description: "Results associated with autism spectrum disorder and developmental abnormalities in infants with tuberous sclerosis complex. Biomed. Signal Process. Control, 2021.",
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
  // Languages & frameworks
  { name: "Python", level: "Advanced" },
  { name: "Matlab", level: "Expert" },
  { name: "C#", level: "Intermediate" },
  { name: "Bash", level: "Intermediate" },
  { name: "TensorFlow", level: "Intermediate" },
  { name: "Azure", level: "Intermediate" },
  { name: "Azure AI Foundry", level: "Intermediate" },
  { name: "Git", level: "Advanced" },
  // Agentic AI coding tools
  { name: "Claude Code", level: "Advanced" },
  { name: "Codex", level: "Intermediate" },
  { name: "Cline", level: "Intermediate" },
  { name: "Gemini CLI", level: "Intermediate" },
  { name: "MCP servers", level: "Intermediate" },
  // Statistics & modelling
  { name: "Time-Series Modelling", level: "Advanced" },
  { name: "Causal Inference", level: "Advanced" },
  { name: "Supervised Learning", level: "Advanced" }
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
