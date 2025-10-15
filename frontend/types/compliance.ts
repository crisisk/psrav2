// Compliance-related type definitions

export interface DocumentationSection {
  id: string;
  title?: string;
  content: string;
  order?: number;
  version?: number;
  lastModified?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export interface ComplianceDocument {
  id: string;
  name: string;
  sections: DocumentationSection[];
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}
