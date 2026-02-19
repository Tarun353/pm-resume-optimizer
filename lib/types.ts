// ─────────────────────────────────────────────────────────────────────────────
// Core resume data model
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  notes?: string;
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  date?: string;
  credentialId?: string;
}

export interface AwardEntry {
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface PublicationEntry {
  title: string;
  publisher?: string;
  date?: string;
  description?: string;
  link?: string;
}

export interface InternshipEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdditionalSection {
  heading: string;
  rawContent: string;
  items: string[];
}

export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  awards: AwardEntry[];
  publications: PublicationEntry[];
  internships: InternshipEntry[];
  projects: ProjectEntry[];
  skills: string[];
  softSkills: string[];
  additionalSections: AdditionalSection[];
  sectionOrder: string[];
}

// ─── Career Stage (NEW) ───────────────────────────────────────────────────────

export type CareerStage = 'fresher' | 'experienced' | 'career-change';

// ─── API types ────────────────────────────────────────────────────────────────

export interface OptimizeRequest {
  resume: ResumeData;
  jobDescription: string;
}

export interface OptimizeResponse {
  optimizedResume: ResumeData;
  changes: string[];
  keywordsInjected: string[];
}

export interface ParseResponse {
  resume: ResumeData;
  rawText: string;
}

export type InputMode = 'upload' | 'paste';

export type SectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'internships'
  | 'projects'
  | 'skills'
  | 'softSkills'
  | string;
