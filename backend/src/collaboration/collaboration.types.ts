export interface User {
  id: string;
  name: string;
}

export type DocumentPermission = "read" | "write";

export interface DocumentMember {
  userId: string;
  permission: DocumentPermission;
}

export interface TextDocument {
  id: string;
  title: string;
  content: string;
  members: DocumentMember[];
  updatedAt: string;
  updatedBy: string;
  version: number; 
}