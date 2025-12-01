
export type Role = 'student' | 'admin';
export type AppStatus = 'pending' | 'approved' | 'rejected';

export interface CustomContact {
  id: string;
  name: string;
  phone: string;
  role: string; // e.g. 'Friend', 'Insurance'
}

export interface EmergencyInfo {
  contactName: string;
  contactPhone: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  others?: CustomContact[];
}

export interface User {
  id: string;
  name: string;
  role: Role;
  phone?: string;
  school?: string;
  score: number; // 0-10, immutable by student
  avatar: string;
  emergencyInfo?: EmergencyInfo;
}

export interface Job {
  id: string;
  title: string;
  company: string; // Used as Employer Name in SWT
  location: string; // City, State
  salary: string; // Hourly wage
  minScore: number;
  description: string;
  tags: string[]; // e.g., 'Lifeguard', 'Housekeeping'
  image: string; // Cover image URL
  capacity: number; // Max students
  publishDate: string; // ISO String for sorting
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  status: AppStatus;
  timestamp: string;
}

export interface Feedback {
  id: string;
  studentId: string;
  jobId: string;
  option: string; // 'Smooth', 'Housing', 'Work', 'Other'
  timestamp: string;
}

export interface Guide {
  id: string;
  title: string;
  content: string; // Markdown supported
  updateDate: string;
}

export interface DbState {
  users: User[];
  jobs: Job[];
  applications: Application[];
  feedbacks: Feedback[];
  guides: Guide[]; // New: Dynamic guides
  currentUser: User | null;
}

export interface ArticleData {
  title?: string;
  accountName?: string;
  date?: string;
  coverImage?: string;
  digest?: string;
  content?: string;
}

export enum GeneratorStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
