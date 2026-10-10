const prisma = require('../config/prisma');

const {
    applyChangesToText
} = require('./text-operation.service.js');

// Une file d'attente par document pour éviter les écritures simultanées.
const documentQueues = new Map();

// Les versions et historiques servent à gérer les modifications concurrentes.
// Le contenu lui-même reste enregistré dans MySQL.
const documentVersions = new Map();
const operationHistory = new Map();

function runDocumentTask(documentId, task) {
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

async function getTextDocumentState(documentId) {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
            id: true,
            content: true,
            updatedAt: true,
            lastModifiedById: true
        }
    });

    if (!document) {
        throw new Error('Document introuvable.');
    }

    if (!documentVersions.has(documentId)) {
        documentVersions.set(documentId, 0);
        operationHistory.set(documentId, []);
    }

    return {
        documentId: document.id,
        content: document.content,
        version: documentVersions.get(documentId),
        updatedAt: document.updatedAt.toISOString(),
        updatedBy: document.lastModifiedById
    };
}

async function getOperationsSince(documentId, baseVersion) {
    const state = await getTextDocumentState(documentId);

    if (
        !Number.isSafeInteger(baseVersion) ||
        baseVersion < 0 ||
        baseVersion > state.version
    ) {
        return null;
    }

    if (baseVersion === state.version) {
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

    return expectedVersion === state.version + 1 ? changes : null;
}

// Cette fonction doit être appelée depuis runDocumentTask().
async function applyTextOperations(
    documentId,
    operations,
    userId,
    operationId
) {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
            id: true,
            content: true
        }
    });

    if (!document) {
        throw new Error('Document introuvable.');
    }

    const content = applyChangesToText(document.content, operations);

    // Enregistrer d'abord le contenu dans MySQL.
    const savedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
            content,
            lastModifiedById: userId
        },
        select: {
            id: true,
            content: true,
            updatedAt: true,
            lastModifiedById: true
        }
    });

    const nextVersion = (documentVersions.get(documentId) ?? 0) + 1;
    documentVersions.set(documentId, nextVersion);

    const history = operationHistory.get(documentId) ?? [];

    history.push({
        operationId,
        version: nextVersion,
        operations: operations.map((operation) => ({ ...operation }))
    });

    operationHistory.set(documentId, history);

    return {
        documentId: savedDocument.id,
        content: savedDocument.content,
        version: nextVersion,
        updatedAt: savedDocument.updatedAt.toISOString(),
        updatedBy: savedDocument.lastModifiedById
    };
}

module.exports = {
    runDocumentTask,
    getTextDocumentState,
    getOperationsSince,
    applyTextOperations
};