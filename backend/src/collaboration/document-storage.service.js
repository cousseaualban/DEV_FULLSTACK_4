const {
    mkdirSync,
    readFileSync,
    writeFileSync,
    renameSync
} = require('node:fs');
const { resolve, join } = require('node:path');

// Lors de l'exécution depuis le backend, les données se trouvent dans backend/data.
const dataDirectory = resolve('data');

function getDocumentPath(documentId) {
    // id le chemin
    if (!/^[a-zA-Z0-9_-]+$/.test(documentId)) {
        throw new Error('Identifiant de document invalide.');
    }

    return join(dataDirectory, `${documentId}.json`);
}

function readStoredDocument(documentId) {
    const filePath = getDocumentPath(documentId);

    let raw;

    try {
        raw = readFileSync(filePath, 'utf8');
    } catch (error) {
        // Aucun fichier présent : première ouverture du document.
        if (
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
        ) {
            return undefined;
        }

        throw error;
    }

    const data = JSON.parse(raw);

    if (
        typeof data !== 'object' ||
        data === null ||
        !('state' in data) ||
        !('updatedAt' in data) ||
        !('updatedBy' in data) ||
        typeof data.state !== 'string' ||
        typeof data.updatedAt !== 'string' ||
        typeof data.updatedBy !== 'string'
    ) {
        throw new Error('Fichier de document invalide.');
    }

    return {
        state: data.state,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy
    };
}

function writeStoredDocument(documentId, data) {
    const filePath = getDocumentPath(documentId);
    const temporaryPath = `${filePath}.tmp`;

    mkdirSync(dataDirectory, { recursive: true });

    // Enregistrez d'abord le fichier temporaire, puis remplacez-le par le fichier principal.
    writeFileSync(
        temporaryPath,
        JSON.stringify(data, null, 2),
        'utf8'
    );

    renameSync(temporaryPath, filePath);
}

module.exports = {
    readStoredDocument,
    writeStoredDocument
};