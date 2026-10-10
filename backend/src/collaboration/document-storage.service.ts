import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync
} from "node:fs";
import { resolve, join } from "node:path";

export interface StoredDocument {
  state: string;
  updatedAt: string;
  updatedBy: string;
}

// Lors de l'exécution depuis le backend, les données se trouvent dans backend/data.
const dataDirectory = resolve("data");

function getDocumentPath(documentId: string): string {
  // id le chemin
  if (!/^[a-zA-Z0-9_-]+$/.test(documentId)) {
    throw new Error("Identifiant de document invalide.");
  }

  return join(dataDirectory, `${documentId}.json`);
}

export function readStoredDocument(
  documentId: string
): StoredDocument | undefined {
  const filePath = getDocumentPath(documentId);

  let raw: string;

  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    // Aucun fichier présent : première ouverture du document.
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }

    throw error;
  }

  const data: unknown = JSON.parse(raw);

  if (
    typeof data !== "object" ||
    data === null ||
    !("state" in data) ||
    !("updatedAt" in data) ||
    !("updatedBy" in data) ||
    typeof data.state !== "string" ||
    typeof data.updatedAt !== "string" ||
    typeof data.updatedBy !== "string"
  ) {
    throw new Error("Fichier de document invalide.");
  }

  return {
    state: data.state,
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy
  };
}

export function writeStoredDocument(
  documentId: string,
  data: StoredDocument
): void {
  const filePath = getDocumentPath(documentId);
  const temporaryPath = `${filePath}.tmp`;

  mkdirSync(dataDirectory, { recursive: true });

  // Enregistrez d'abord le fichier temporaire, puis remplacez-le par le fichier principal.
  writeFileSync(
    temporaryPath,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  renameSync(temporaryPath, filePath);
}