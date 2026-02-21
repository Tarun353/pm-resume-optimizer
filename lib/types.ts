// ─── Input Mode ────────────────────────────────────────────────────────────────
export type InputMode = 'paste' | 'upload';

// ─── Career Stage ──────────────────────────────────────────────────────────────
export type CareerStage = 'fresher' | 'experienced' | 'career-change';

// ─── Personal Info ─────────────────────────────────────────────────────────────
export interface PersonalInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: string[];
}

// ─── Experience ────────────────────────────────────────────────────────────────
export interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

// ─── Internship ────────────────────────────────────────────────────────────────
export interface InternshipEntry {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

// ─── Education ─────────────────────────────────────────────────────────────────
export interface EducationEntry {
  degree: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  notes?: string;
}

// ─── Certification ─────────────────────────────────────────────────────────────
export interface CertificationEntry {
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
}

// ─── Award ─────────────────────────────────────────────────────────────────────
export interface AwardEntry {
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

// ─── Publication ───────────────────────────────────────────────────────────────
export interface PublicationEntry {
  title: string;
  publisher?: string;
  date?: string;
  link?: string;
  description?: string;
}

// ─── Project ───────────────────────────────────────────────────────────────────
export interface ProjectEntry {
  name: string;
  description?: string;
  link?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

// ─── Additional Section ────────────────────────────────────────────────────────
export interface AdditionalSection {
  heading: string;
  items?: string[];
  rawContent?: string;
}

// ─── Main Resume Data ──────────────────────────────────────────────────────────
export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  internships?: InternshipEntry[];
  education: EducationEntry[];
  certifications?: CertificationEntry[];
  awards?: AwardEntry[];
  publications?: PublicationEntry[];
  projects?: ProjectEntry[];
  skills: string[];
  softSkills?: string[];
  additionalSections?: AdditionalSection[];
  sectionOrder: string[];
}

// ─── Parse Response ────────────────────────────────────────────────────────────
export interface ParseResponse {
  resume: ResumeData;
  rawText?: string;
}
