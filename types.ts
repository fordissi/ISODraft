
export enum ISODocLevel {
  LEVEL_1 = 'Level 1: Quality Manual (政策與手冊)',
  LEVEL_2 = 'Level 2: Procedures (程序書)',
  LEVEL_3 = 'Level 3: Work Instructions (作業指導書)',
  LEVEL_4 = 'Level 4: Records/Forms (表單與紀錄)'
}

export type ToneType = 'standard' | 'hr' | 'official';

export interface VariableProfile {
  id: string;
  profileName: string; // e.g., "Company A", "Company B"
  variables: Record<string, string>; // e.g., { "COMPANY_NAME": "Tech Corp", "TAX_ID": "123456" }
}

export interface CategoryDef {
  id: string;
  name: string;
  color: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate';
  type: 'system' | 'custom';
}

export interface ApprovalLog {
  reviewerName: string;
  reviewerEmail: string;
  action: 'approve' | 'reject';
  timestamp: string;
  integrityHash: string;
}

export interface RevisionEntry {
  id: string;
  version: string;
  date: string;
  description: string;
  author: string;
}

export interface ISODocument {
  id: string;
  title: string;
  docNumber: string;
  version: string;
  level: ISODocLevel;
  category: string; 
  department: string;
  author: string;
  reviewerEmail?: string;
  createdAt: string;
  status: 'draft' | 'review' | 'approved'; 
  sections: DocSection[];
  revisions: RevisionEntry[];
  approvalLog?: ApprovalLog;
  lockedContentSnapshot?: string;
  isTemplate?: boolean;
}

export interface DocSection {
  id: string;
  title: string;
  content: string;
}

export const getStandardFilename = (doc: ISODocument): string => {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `${doc.docNumber}_${doc.title}_v${doc.version}_${dateStr}.pdf`;
};
