import { findDocument } from "./document-content.service.js";

import {
  applyChangesToText,
  type TextChange,
  type SavedChange
} from "./text-operation.service.js";

import {
  readStoredTextDocument,
  writeStoredTextDocument
} from "./text-document-storage.service.js";

const loadedDocuments = new Set<string>();
const documentQueues = new Map<string, Promise<void>>();

// Une entrée correspond à une requête acceptée et à une version.
// Elle peut contenir plusieurs petites opérations.
const operationHistory = new Map<string, SavedChange[]>();

export function runDocumentTask<T>(
  documentId: string,
  task: () => Promise<T>
): Promise<T> {
  const previous = documentQueues.get(documentId) ?? Promise.resolve();
  const result = previous.then(task);

  // Une erreur ne doit pas bloquer les requêtes suivantes.
  const tail = result.then(
    () => undefined,
    () => undefined
  );

  documentQueues.set(documentId, tail);

  void tail.then(() => {
    if (documentQueues.get(documentId) === tail) {
      documentQueues.delete(documentId);
    }
  });

  return result;
}

export function getTextDocument(documentId: string) {
  const document = findDocument(documentId);

  if (!document) {
    throw new Error("Document introuvable.");
  }

  // Lire le fichier une seule fois pendant cette exécution.
  if (!loadedDocuments.has(documentId)) {
    const stored = readStoredTextDocument(documentId);

    if (stored) {
      document.content = stored.content;
      document.version = stored.version;
      document.updatedAt = stored.updatedAt;
      document.updatedBy = stored.updatedBy;
    }

    loadedDocuments.add(documentId);
  }

  return document;
}

export function getTextDocumentState(documentId: string) {
  const document = getTextDocument(documentId);

  return {
    documentId: document.id,
    content: document.content,
    version: document.version,
    updatedAt: document.updatedAt,
    updatedBy: document.updatedBy
  };
}

export function getOperationsSince(
  documentId: string,
  baseVersion: number
): SavedChange[] | null {
  const currentVersion = getTextDocument(documentId).version;

  if (
    !Number.isSafeInteger(baseVersion) ||
    baseVersion < 0 ||
    baseVersion > currentVersion
  ) {
    return null;
  }

  if (baseVersion === currentVersion) {
    return [];
  }

  const history = operationHistory.get(documentId) ?? [];

  const changes = history.filter(
    (change) => change.version > baseVersion
  );

  let expectedVersion = baseVersion + 1;

  for (const change of changes) {
    if (change.version !== expectedVersion) {
      return null;
    }

    expectedVersion++;
  }

  // Après un redémarrage, l'historique nécessaire peut manquer.
  return expectedVersion === currentVersion + 1 ? changes : null;
}

export function persistTextDocument(
  documentId: string
): Promise<void> {
  return runDocumentTask(documentId, async () => {
    await writeStoredTextDocument(getTextDocumentState(documentId));
  });
}

// Appeler cette fonction dans runDocumentTask.
// Ne pas ouvrir une deuxième file d'attente ici.
export async function applyTextOperations(
  documentId: string,
  operations: TextChange[],
  userId: string,
  operationId: string
) {
  const document = getTextDocument(documentId);

  // Préparer le résultat sans modifier le document en mémoire.
  const content = applyChangesToText(document.content, operations);

  const nextState = {
    documentId: document.id,
    content,
    version: document.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: userId
  };

  // Toutes les petites opérations sont enregistrées ensemble.
  // Si la sauvegarde échoue, la mémoire et l'historique restent intacts.
  await writeStoredTextDocument(nextState);

  document.content = nextState.content;
  document.version = nextState.version;
  document.updatedAt = nextState.updatedAt;
  document.updatedBy = nextState.updatedBy;

  const history = operationHistory.get(documentId) ?? [];

  history.push({
    operationId,
    version: nextState.version,
    operations: operations.map((operation) => ({ ...operation }))
  });

  operationHistory.set(documentId, history);

  return nextState;
}