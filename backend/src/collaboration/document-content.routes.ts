import { Router } from "express";
import { mockUsers } from "../mocks/users.mock.js";
import {
  findDocument,
  getDocumentPermission
} from "./document-content.service.js";
import {
  getTextDocumentState
} from "./text-document.service.js";

export const documentContentRouter = Router();

documentContentRouter.get("/:documentId/content", (req, res) => {
  const userId = req.query.userId;

  if (
    typeof userId !== "string" ||
    !mockUsers.some((user) => user.id === userId)
  ) {
    res.status(401).json({
      message: "Utilisateur de test invalide ou manquant."
    });
    return;
  }

  const document = findDocument(req.params.documentId);

  if (!document) {
    res.status(404).json({
      message: "Document introuvable."
    });
    return;
  }

  const permission = getDocumentPermission(document.id, userId);

  if (!permission) {
    res.status(403).json({
      message: "Vous n'avez pas accès à ce document."
    });
    return;
  }

  try {
    const state = getTextDocumentState(document.id);

    res.json({
      id: document.id,
      title: document.title,
      content: state.content,
      version: state.version,
      permission,
      updatedAt: state.updatedAt,
      updatedBy: state.updatedBy
    });
  } catch (error) {
    console.error("Erreur de lecture du document :", error);

    res.status(500).json({
      message: "Impossible de lire le document."
    });
  }
});

documentContentRouter.put("/:documentId/content", (_req, res) => {
  res.status(409).json({
    message: "Utilisez le canal collaboratif pour modifier le contenu."
  });
});