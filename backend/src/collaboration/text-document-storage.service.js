// Responsable de la lecture et de l'écriture sur le disque.
const {
    mkdirSync,
    readFileSync,
    writeFileSync,
    renameSync
} = require('node:fs');
const { resolve, join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const dataDirectory = resolve('data');

function getDocumentPath(documentId) {
    if (!/^[a-zA-Z0-9_-]+$/.test(documentId)) {
        throw new Error('Identifiant de document invalide.');
    }

    return join(dataDirectory, `${documentId}.text.json`);
}

function readStoredTextDocument(documentId) {
    let raw;

    try {
        raw = readFileSync(getDocumentPath(documentId), 'utf8');
    } catch (error) {
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
        !('documentId' in data) ||
        !('content' in data) ||
        !('version' in data) ||
        !('updatedAt' in data) ||
        !('updatedBy' in data) ||
        data.documentId !== documentId ||
        typeof data.content !== 'string' ||
        typeof data.version !== 'number' ||
        !Number.isSafeInteger(data.version) ||
        data.version < 0 ||
        typeof data.updatedAt !== 'string' ||
        typeof data.updatedBy !== 'string'
    ) {
        throw new Error('Fichier de document invalide.');
    }

    return {
        documentId,
        content: data.content,
        version: data.version,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy
    };
}

// Ancienne version synchrone conservée en commentaire dans le fichier d'origine.
// Elle n'est pas nécessaire dans cette version JavaScript.

// async pour permettre les nouvelles tentatives si le fichier est temporairement verrouillé.
async function writeStoredTextDocument(data) {
    // Activer seulement pour tester une erreur de sauvegarde.
    // if (process.env.TEST_SAVE_FAILURE === '1') {
    //   throw new Error('Erreur de sauvegarde simulée.');
    // }

    const filePath = getDocumentPath(data.documentId);
    const temporaryPath = `${filePath}.tmp`;

    mkdirSync(dataDirectory, { recursive: true });

    writeFileSync(
        temporaryPath,
        JSON.stringify(data, null, 2),
        'utf8'
    );

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            renameSync(temporaryPath, filePath);
            return;
        } catch (error) {
            const retryable =
                error instanceof Error &&
                'code' in error &&
                (error.code === 'EPERM' || error.code === 'EBUSY');

            if (!retryable || attempt === 4) {
                throw error;
            }

            await delay(50 * (attempt + 1));
        }
    }
}

module.exports = {
    readStoredTextDocument,
    writeStoredTextDocument
};