export interface Contract {
  id: string;
  title: string;
  type: 'license' | 'consulting' | 'sla' | 'maintenance' | 'support';
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  client: string;
  startDate: string;
  endDate: string;
  description: string;
  tags?: string[];
  attachments?: string[];
  lastModified?: string;
  projectId?: string;
}

export interface ContractProject {
  id: string;
  name: string;
  client: string;
  documentCount: number;
  uploadDate: string;
  lastUpdated: string;
  contractEffectiveStart: string;
  contractEffectiveEnd: string;
  tags: string[];
  baseContract: Contract;
  amendments: Contract[];
  totalDocuments: number;
  status?: 'processing' | 'complete' | 'error';
}

interface ContractTemplate {
  id: string;
  name: string;
  type: Contract['type'];
  description: string;
  sections: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
}

interface ProjectData {
  id: string;
  name: string;
  client: string | null;
  upload_date: string;
  tags: string[];
  documents_count: number;
  status: 'processing' | 'complete' | 'error';
  created_at: string;
  updated_at: string;
}

interface FileData {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  upload_status: 'pending' | 'uploading' | 'complete' | 'error';
  file_path: string | null;
  created_at: string;
  updated_at: string;
}