const { verifyToken } = require('../services/tokenService');
const { getUserById } = require('../services/userService');

const {
    getDocumentAccess,
    hasPermission
} = require('../services/documentService');

const {
    getTextDocumentState,
    applyTextOperations,
    runDocumentTask,
    getOperationsSince
} = require('./text-document.service.js');

const {
    transformTextChange
} = require('./text-operation.service.js');

function parseDocumentId(value) {
    const documentId = Number(value);

    return Number.isSafeInteger(documentId) && documentId > 0
        ? documentId
        : null;
}

function registerCollaborationHandlers(io) {
    // Authentifier chaque connexion Socket.IO avec le JWT existant.
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (typeof token !== 'string' || !token) {
                return next(new Error('Token d’authentification manquant.'));
            }

            const decodedToken = verifyToken(token);

            // Un token en attente de validation 2FA ne donne pas accès
            // aux fonctionnalités collaboratives.
            if (decodedToken.twoFactorPending) {
                return next(new Error('Authentification à deux facteurs incomplète.'));
            }

            const userId = Number(decodedToken.userId);

            if (!Number.isSafeInteger(userId) || userId <= 0) {
                return next(new Error('Token d’authentification invalide.'));
            }

            const user = await getUserById(userId);

            if (!user || user.isBlocked) {
                return next(new Error('Utilisateur introuvable ou bloqué.'));
            }

            socket.data.user = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName
            };

            return next();
        } catch (_error) {
            return next(new Error('Token d’authentification invalide ou expiré.'));
        }
    });

    io.on('connection', (socket) => {
        const joinedDocuments = new Set();

        socket.on('document:join', async (payload = {}, callback) => {
            const respond = typeof callback === 'function' ? callback : () => {};
            const documentId = parseDocumentId(payload.documentId);
            const userId = socket.data.user.id;

            if (!documentId) {
                return respond({
                    success: false,
                    message: 'Identifiant de document invalide.'
                });
            }

            try {
                const access = await getDocumentAccess(documentId, userId);

                if (!access || !hasPermission(access, 'READ')) {
                    return respond({
                        success: false,
                        message: 'Vous n’avez pas accès à ce document.'
                    });
                }

                const state = await getTextDocumentState(documentId);
                const room = `document:${documentId}`;

                await socket.join(room);
                joinedDocuments.add(documentId);

                respond({
                    success: true,
                    document: {
                        ...state,
                        name: access.document.name,
                        permission: access.level
                    }
                });
            } catch (error) {
                console.error('Erreur lors de la connexion au document :', error);

                respond({
                    success: false,
                    message: 'Impossible de rejoindre ce document.'
                });
            }
        });

        socket.on('document:leave', async (payload = {}, callback) => {
            const respond = typeof callback === 'function' ? callback : () => {};
            const documentId = parseDocumentId(payload.documentId);

            if (!documentId) {
                return respond({
                    success: false,
                    message: 'Identifiant de document invalide.'
                });
            }

            await socket.leave(`document:${documentId}`);
            joinedDocuments.delete(documentId);

            respond({ success: true });
        });

        socket.on('document:update', async (payload = {}, callback) => {
            const respond = typeof callback === 'function' ? callback : () => {};
            const documentId = parseDocumentId(payload.documentId);
            const userId = socket.data.user.id;

            if (!documentId || !joinedDocuments.has(documentId)) {
                return respond({
                    success: false,
                    message: 'Vous devez rejoindre le document avant de le modifier.'
                });
            }

            if (
                typeof payload.operationId !== 'string' ||
                !payload.operationId ||
                !Number.isSafeInteger(payload.baseVersion) ||
                !Number.isSafeInteger(payload.position) ||
                !Number.isSafeInteger(payload.deleteCount) ||
                payload.position < 0 ||
                payload.deleteCount < 0 ||
                typeof payload.insertText !== 'string'
            ) {
                return respond({
                    success: false,
                    message: 'Opération de modification invalide.'
                });
            }

            try {
                // Revérifier les droits à chaque modification.
                const access = await getDocumentAccess(documentId, userId);

                if (!access || !hasPermission(access, 'WRITE')) {
                    return respond({
                        success: false,
                        message: 'Vous n’avez pas le droit de modifier ce document.'
                    });
                }

                const result = await runDocumentTask(documentId, async () => {
                    const state = await getTextDocumentState(documentId);

                    if (payload.baseVersion > state.version || payload.baseVersion < 0) {
                        return {
                            conflict: true,
                            state
                        };
                    }

                    const history = await getOperationsSince(
                        documentId,
                        payload.baseVersion
                    );

                    if (history === null) {
                        return {
                            conflict: true,
                            state
                        };
                    }

                    const operations = transformTextChange(
                        {
                            position: payload.position,
                            deleteCount: payload.deleteCount,
                            insertText: payload.insertText
                        },
                        history
                    );

                    const nextState = await applyTextOperations(
                        documentId,
                        operations,
                        userId,
                        payload.operationId
                    );

                    return {
                        conflict: false,
                        state: nextState,
                        operations
                    };
                });

                if (result.conflict) {
                    return respond({
                        success: false,
                        conflict: true,
                        message: 'Le document a changé. Synchronisez son contenu avant de réessayer.',
                        state: result.state
                    });
                }

                const update = {
                    operationId: payload.operationId,
                    operations: result.operations,
                    state: result.state,
                    updatedBy: {
                        id: userId,
                        firstName: socket.data.user.firstName,
                        lastName: socket.data.user.lastName
                    }
                };

                io.to(`document:${documentId}`).emit('document:updated', update);

                respond({
                    success: true,
                    ...update
                });
            } catch (error) {
                console.error('Erreur lors de la modification collaborative :', error);

                respond({
                    success: false,
                    message: 'Impossible d’enregistrer la modification.'
                });
            }
        });

        socket.on('disconnect', () => {
            joinedDocuments.clear();
        });
    });
}

module.exports = {
    registerCollaborationHandlers
};