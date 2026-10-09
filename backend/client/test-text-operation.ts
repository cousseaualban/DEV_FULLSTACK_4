import {
  adjustInsertPosition,
  type SavedOperation
} from "../src/collaboration/text-operation.service.js";

// Nguyen a déjà ajouté X entre A et B.
// Le document est passé de AB à AXB.
const history: SavedOperation[] = [
  {
    operationId: "operation-nguyen",
    version: 1,
    position: 1,
    deleteCount: 0,
    insertText: "X"
  }
];

// Alban voulait ajouter Y au même endroit dans la version initiale.
const result = adjustInsertPosition(
  {
    position: 1,
    deleteCount: 0,
    insertText: "Y"
  },
  history
);

if (result === null || result.position !== 2) {
  throw new Error("La position attendue est 2.");
}

const currentContent = "AXB";

const finalContent =
  currentContent.slice(0, result.position) +
  result.insertText +
  currentContent.slice(result.position);

if (finalContent !== "AXYB") {
  throw new Error("Le contenu attendu est AXYB.");
}

console.log("Test réussi :", finalContent);