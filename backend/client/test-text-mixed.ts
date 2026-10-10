//Une personne insère, l'autre supprime.
/// <reference types="node" />

import { strict as assert } from "node:assert";

import {
  adjustTextOperation,
  type SavedOperation
} from "../src/collaboration/text-operation.service.js";

const deletion: SavedOperation = {
  operationId: "delete-bc",
  version: 1,
  position: 1,
  deleteCount: 2,
  insertText: ""
};

// ABCDE devient ADE.
// Une insertion prévue avant D doit maintenant être à la position 1.
assert.deepEqual(
  adjustTextOperation(
    { position: 3, deleteCount: 0, insertText: "X" },
    [deletion]
  ),
  { position: 1, deleteCount: 0, insertText: "X" }
);

// Une insertion prévue dans BC revient au début de la zone supprimée.
assert.deepEqual(
  adjustTextOperation(
    { position: 2, deleteCount: 0, insertText: "X" },
    [deletion]
  ),
  { position: 1, deleteCount: 0, insertText: "X" }
);

const insertion: SavedOperation = {
  operationId: "insert-x",
  version: 1,
  position: 1,
  deleteCount: 0,
  insertText: "X"
};

// ABCDE devient AXBCDE.
// Supprimer BC doit préserver X et commencer à la position 2.
assert.deepEqual(
  adjustTextOperation(
    { position: 1, deleteCount: 2, insertText: "" },
    [insertion]
  ),
  { position: 2, deleteCount: 2, insertText: "" }
);

// X a été ajouté au milieu de BC.
// Refuser pour le moment plutôt que supprimer aussi X.
assert.equal(
  adjustTextOperation(
    { position: 1, deleteCount: 2, insertText: "" },
    [{ ...insertion, position: 2 }]
  ),
  null
);

console.log("Tests réussis : insertions et suppressions mélangées.");