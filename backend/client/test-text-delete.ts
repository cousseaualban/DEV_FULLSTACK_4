import { strict as assert } from "node:assert";

import {
  adjustTextOperation,
  type SavedOperation
} from "../src/collaboration/text-operation.service.js";

// Dans ABCDE, Nguyen a supprimé BC.
// Le document actuel est donc ADE.
const history: SavedOperation[] = [
  {
    operationId: "delete-nguyen",
    version: 1,
    position: 1,
    deleteCount: 2,
    insertText: ""
  }
];

// Alban voulait supprimer CD dans l'ancienne version.
// C est déjà supprimé : il reste seulement D à retirer.
const overlap = adjustTextOperation(
  { position: 2, deleteCount: 2, insertText: "" },
  history
);

assert.deepEqual(overlap, {
  position: 1,
  deleteCount: 1,
  insertText: ""
});

const currentContent = "ADE";

const finalContent =
  currentContent.slice(0, overlap!.position) +
  currentContent.slice(overlap!.position + overlap!.deleteCount);

assert.equal(finalContent, "AE");

// Supprimer deux fois BC ne doit pas supprimer les caractères voisins.
const sameDeletion = adjustTextOperation(
  { position: 1, deleteCount: 2, insertText: "" },
  history
);

assert.deepEqual(sameDeletion, {
  position: 1,
  deleteCount: 0,
  insertText: ""
});

// Une suppression située après BC doit simplement reculer.
const laterDeletion = adjustTextOperation(
  { position: 4, deleteCount: 1, insertText: "" },
  history
);

assert.deepEqual(laterDeletion, {
  position: 2,
  deleteCount: 1,
  insertText: ""
});

console.log("Tests réussis : suppressions simultanées.");