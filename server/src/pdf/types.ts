export interface CvProject {
  name: string;
  client?: string;
  location?: string;
  sector?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  role: string;
  responsibilities?: string;
}

export interface CvData {
  name: string;
  jobTitle: string;
  yearsOfExperience?: number;
  summary?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  skills: string[];
  projects: CvProject[];
}
