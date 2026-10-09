import type { Server } from "socket.io";
import { mockUsers } from "../mocks/users.mock.js";
import {
    findDocument,
    getDocumentPermission
} from "./document-content.service.js";
// import {
//     getDocumentState,
//     applyDocumentUpdate,
//     getDocumentText,
//     persistDocument
// } from "./yjs-document.service.js";
import {
    getTextDocumentState,
    applyTextOperations,
    runDocumentTask,
    getOperationsSince
} from "./text-document.service.js";

import {
    transformTextChange,
    type TextChange
} from "./text-operation.service.js";

export function registerCollaborationHandlers(io: Server) {
    io.on("connection", (socket) => {
        console.log(`Client connecté : ${socket.id}`);

        socket.emit("connection:ready", {
            socketId: socket.id,
            message: "Connexion temps réel établie."
        });

        socket.on("document:join", async (payload: unknown) => {
            // Kiểm tra dữ liệu nhận từ client.
            if (
                typeof payload !== "object" ||
                payload === null ||
                !("userId" in payload) ||
                !("documentId" in payload) ||
                typeof payload.userId !== "string" ||
                typeof payload.documentId !== "string"
            ) {
                socket.emit("document:error", {
                    message: "Données invalides."
                });
                return;
            }

            const { userId, documentId } = payload;

            const user = mockUsers.find((user) => user.id === userId);

            if (!user) {
                socket.emit("document:error", {
                    message: "Utilisateur de test introuvable."
                });
                return;
            }

            const document = findDocument(documentId);

            if (!document) {
                socket.emit("document:error", {
                    message: "Document introuvable."
                });
                return;
            }

            const permission = getDocumentPermission(documentId, userId);

            if (!permission) {
                socket.emit("document:error", {
                    message: "Vous n'avez pas accès à ce document."
                });
                return;
            }

            let state: ReturnType<typeof getTextDocumentState>;

            try {
                state = getTextDocumentState(documentId);
            } catch (error) {
                console.error("Erreur de lecture du document :", error);

                socket.emit("document:error", {
                    message: "Impossible de lire le document."
                });
                return;
            }
            // page test, ouvrir un seul doc
            const previousDocumentId = socket.data.documentId;

            if (typeof previousDocumentId === "string") {
                await socket.leave(`document:${previousDocumentId}`);
            }

            await socket.join(`document:${documentId}`);

            socket.data.userId = userId;
            socket.data.documentId = documentId;

            socket.emit("document:joined", {
                documentId,
                title: document.title,
                userName: user.name,
                permission
            });

            socket.emit("document:state", state);

            console.log(`${user.name} a rejoint ${documentId} (${permission})`);
        });


        socket.on("document:update", async (payload: unknown) => {
            // Vérifier les données reçues avant de les utiliser.
            if (
                typeof payload !== "object" ||
                payload === null ||
                !("documentId" in payload) ||
                !("operationId" in payload) ||
                !("baseVersion" in payload) ||
                !("position" in payload) ||
                !("deleteCount" in payload) ||
                !("insertText" in payload) ||
                typeof payload.documentId !== "string" ||
                typeof payload.operationId !== "string" ||
                payload.operationId.length === 0 ||
                payload.operationId.length > 100 ||
                typeof payload.baseVersion !== "number" ||
                !Number.isSafeInteger(payload.baseVersion) ||
                payload.baseVersion < 0 ||
                typeof payload.position !== "number" ||
                !Number.isSafeInteger(payload.position) ||
                payload.position < 0 ||
                typeof payload.deleteCount !== "number" ||
                !Number.isSafeInteger(payload.deleteCount) ||
                payload.deleteCount < 0 ||
                typeof payload.insertText !== "string"
            ) {
                socket.emit("document:error", {
                    message: "Modification invalide."
                });
                return;
            }

            const {
                documentId,
                operationId,
                baseVersion,
                position,
                deleteCount,
                insertText
            } = payload;

            const userId = socket.data.userId;

            // Le client doit avoir rejoint le document demandé.
            if (
                typeof userId !== "string" ||
                socket.data.documentId !== documentId ||
                !socket.rooms.has(`document:${documentId}`)
            ) {
                socket.emit("document:error", {
                    message: "Rejoignez d'abord ce document."
                });
                return;
            }

            if (getDocumentPermission(documentId, userId) !== "write") {
                socket.emit("document:error", {
                    message: "Vous n'avez pas le droit de modifier ce document."
                });
                return;
            }

            try {
                // Traiter les demandes du même document une par une.
                await runDocumentTask(documentId, async () => {
                    // Le client peut avoir quitté le document pendant l'attente.
                    if (
                        !socket.connected ||
                        socket.data.userId !== userId ||
                        socket.data.documentId !== documentId ||
                        !socket.rooms.has(`document:${documentId}`)
                    ) {
                        socket.emit("document:error", {
                            message: "Rejoignez d'abord ce document."
                        });
                        return;
                    }

                    if (getDocumentPermission(documentId, userId) !== "write") {
                        socket.emit("document:error", {
                            message: "Vous n'avez pas le droit de modifier ce document."
                        });
                        return;
                    }

                    // Lire l'état après les demandes déjà traitées dans la file.
                    const currentState = getTextDocumentState(documentId);

                    const history = getOperationsSince(
                        documentId,
                        baseVersion
                    );

                    if (history === null) {
                        socket.emit("document:conflict", {
                            operationId,
                            state: currentState,
                            message: "Historique insuffisant pour fusionner."
                        });
                        return;
                    }

                    // Retrouver la longueur dans la version utilisée par le client.
                    // Chaque version peut contenir plusieurs petites opérations.
                    let originalLength = currentState.content.length;

                    for (const saved of history) {
                        for (const previous of saved.operations) {
                            originalLength +=
                                previous.deleteCount - previous.insertText.length;
                        }
                    }

                    // Vérifier la zone demandée dans le texte initial.
                    if (
                        position > originalLength ||
                        deleteCount > originalLength - position
                    ) {
                        socket.emit("document:error", {
                            message: "Position de modification invalide."
                        });
                        return;
                    }

                    const change: TextChange = {
                        position,
                        deleteCount,
                        insertText
                    };

                    // Ajuster la demande et, si nécessaire,
                    // découper la suppression pour garder les ajouts des autres.
                    const operations = transformTextChange(change, history);

                    // Appliquer toutes les opérations et enregistrer une seule fois.
                    const nextState = await applyTextOperations(
                        documentId,
                        operations,
                        userId,
                        operationId
                    );

                    // Envoyer les opérations réellement appliquées.
                    // Le client en a besoin pour conserver ses changements en attente.
                    io.to(`document:${documentId}`).emit("document:updated", {
                        operationId,
                        operations,
                        state: nextState
                    });
                });
            } catch (error) {
                console.error(
                    "Erreur de modification du document :",
                    error
                );

                socket.emit("document:error", {
                    message: "Impossible de modifier ou d'enregistrer le document."
                });
            }
        }); // Fin du handler document:update

        socket.on("disconnect", (reason) => {
            console.log(
                `Client déconnecté : ${socket.id} (${reason})`
            );
        });
    }); // Fin de io.on("connection")
}