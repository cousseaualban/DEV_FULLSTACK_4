import type {
  TextDocument
} from "../collaboration/collaboration.types.js";

export const mockDocuments: TextDocument[] = [
  {
    id: "doc-1",
    title: "Présentation du projet",
    content: "Bienvenue dans notre projet collaboratif.",
    members: [
      { userId: "user-nguyen", permission: "write" },
      { userId: "user-alban", permission: "write" },
      { userId: "user-ilef", permission: "read" }
    ],
    updatedAt: "2026-10-06T07:00:00.000Z",
    updatedBy: "user-nguyen",
    version: 0,
  },
  {
    id: "doc-2",
    title: "Notes de réunion",
    content: "Voici les premières notes de notre équipe.",
    members: [
      { userId: "user-alban", permission: "write" },
      { userId: "user-ilef", permission: "write" },
      { userId: "user-sam", permission: "read" }
    ],
    updatedAt: "2026-10-06T07:00:00.000Z",
    updatedBy: "user-alban",
    version: 0,
  }
];