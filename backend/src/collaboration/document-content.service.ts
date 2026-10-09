import { mockDocuments } from "../mocks/documents.mock.js";

export function findDocument(documentId: string) {
  return mockDocuments.find((document) => document.id === documentId);
}

export function getDocumentPermission(
  documentId: string,
  userId: string
) {
  const document = findDocument(documentId);

  return document?.members.find(
    (member) => member.userId === userId
  )?.permission;
}
export function saveDocumentContent(
  documentId: string,
  content: string,
  userId: string
) {
  const document = findDocument(documentId);

  if (!document) {
    return undefined;
  }

  document.content = content;
  document.updatedAt = new Date().toISOString();
  document.updatedBy = userId;

  return document;
}