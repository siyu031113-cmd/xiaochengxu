
export type Role = 'student' | 'admin';
export type AppStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  role: Role;
  phone?: string;
  school?: string;
  score: number; // 0-10, immutable by student
  avatar: string;
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
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  status: AppStatus;
  timestamp: string;
}

export interface DbState {
  users: User[];
  jobs: Job[];
  applications: Application[];
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
