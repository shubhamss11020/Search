export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface SkillItem {
  name: string;
  category?: string;
  level?: string;
  years?: number;
}

export interface ExperienceItem {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  highlights: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field_of_study?: string;
  graduation_year?: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  tech_stack: string[];
  url?: string;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  headline?: string;
  phone?: string;
  location?: string;
  preferred_roles: string[];
  preferred_locations: string[];
  min_salary?: number;
  work_arrangements: string[];
  employment_types: string[];
  skills: SkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: any[];
  links: Record<string, string>;
  verified_facts: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ResumeFile {
  id: string;
  user_id: string;
  version_name: string;
  target_category?: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  is_primary: boolean;
  created_at: string;
}

export interface JobMatch {
  id: string;
  job_id: string;
  match_score: number;
  is_eligible: boolean;
  summary_explanation: string;
  matched_skills: string[];
  missing_mandatory_skills: string[];
  missing_preferred_skills: string[];
  eligibility_warnings: string[];
  created_at: string;
}

export type ApplicationMethod = 
  | 'WEBSITE_FORM' 
  | 'EMAIL' 
  | 'RECRUITER_MESSAGE' 
  | 'EXTERNAL_PORTAL' 
  | 'AMBIGUOUS';

export type ApplicationStatus = 
  | 'NEW' 
  | 'SHORTLISTED' 
  | 'READY_TO_APPLY' 
  | 'DRAFTED' 
  | 'APPLIED' 
  | 'INTERVIEW' 
  | 'REJECTED' 
  | 'OFFER' 
  | 'WITHDRAWN';

export interface Job {
  id: string;
  user_id: string;
  source_id: string;
  external_job_id?: string;
  dedup_hash: string;
  title: string;
  company: string;
  location?: string;
  employment_type?: string;
  experience_level?: string;
  salary_raw?: string;
  description_text: string;
  skills_required: string[];
  application_url?: string;
  source_posted_at?: string;
  discovered_at: string;
  is_saved: boolean;
  is_dismissed: boolean;
  match?: JobMatch;
  application_status?: ApplicationStatus;
  detected_method?: ApplicationMethod;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_file_id?: string;
  status: ApplicationStatus;
  detected_method: ApplicationMethod;
  method_confidence_pct: number;
  method_explanation?: string;
  recipient_email?: string;
  email_subject_instruction?: string;
  external_portal_url?: string;
  recruiter_name?: string;
  applied_at?: string;
  next_followup_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
}

export interface WorkflowDraftResult {
  application_id: string;
  workflow_type: ApplicationMethod;
  email_draft?: {
    to: string;
    subject: string;
    body: string;
    attachment_resume_id?: string;
    attachment_filename?: string;
    notes?: string;
  };
  form_qa_answers?: Array<{
    field_id: string;
    question: string;
    answer: string;
    grounded_facts: string[];
  }>;
  recruiter_message_draft?: {
    message: string;
    char_count: number;
  };
  unverified_claims_detected: boolean;
  notes?: string;
}

export interface ExtractedJobPayload {
  source_id: string;
  external_job_id?: string;
  title: string;
  company: string;
  location?: string;
  employment_type?: string;
  salary_raw?: string;
  description_text: string;
  skills_required: string[];
  application_url?: string;
  source_posted_at?: string;
  raw_page_snippets: Record<string, any>;
}
