/// <reference types="node" />

import { strict as assert } from "node:assert";

import {
  applyChangesToText,
  transformTextChange,
  type TextChange,
  type SavedChange
} from "../src/collaboration/text-operation.service.js";

function check(
  name: string,
  initial: string,
  first: TextChange,
  second: TextChange,
  expected: string
) {
  const firstOperations = transformTextChange(first, []);
  const current = applyChangesToText(initial, firstOperations);

  const history: SavedChange[] = [{
    operationId: "first",
    version: 1,
    operations: firstOperations
  }];

  const secondOperations = transformTextChange(second, history);
  const result = applyChangesToText(current, secondOperations);

  assert.equal(result, expected, name);
  console.log("OK :", name);
}

check(
  "Deux insertions au même endroit",
  "AB",
  { position: 1, deleteCount: 0, insertText: "X" },
  { position: 1, deleteCount: 0, insertText: "Y" },
  "AXYB"
);

check(
  "Suppressions qui se chevauchent",
  "ABCDE",
  { position: 1, deleteCount: 2, insertText: "" },
  { position: 2, deleteCount: 2, insertText: "" },
  "AE"
);

check(
  "Même suppression deux fois",
  "ABCDE",
  { position: 1, deleteCount: 2, insertText: "" },
  { position: 1, deleteCount: 2, insertText: "" },
  "ADE"
);

check(
  "Garder une insertion au milieu de la suppression",
  "ABCDE",
  { position: 2, deleteCount: 0, insertText: "X" },
  { position: 1, deleteCount: 2, insertText: "" },
  "AXDE"
);

check(
  "Insérer dans une zone déjà supprimée",
  "ABCDE",
  { position: 1, deleteCount: 2, insertText: "" },
  { position: 2, deleteCount: 0, insertText: "X" },
  "AXDE"
);

check(
  "Remplacer en gardant une insertion concurrente",
  "ABCDE",
  { position: 2, deleteCount: 0, insertText: "X" },
  { position: 1, deleteCount: 2, insertText: "Y" },
  "AYXDE"
);

check(
  "Insérer après un remplacement",
  "ABCDE",
  { position: 1, deleteCount: 2, insertText: "Y" },
  { position: 2, deleteCount: 0, insertText: "X" },
  "AYXDE"
);

check(
  "Deux remplacements sur la même zone",
  "ABCDE",
  { position: 1, deleteCount: 2, insertText: "X" },
  { position: 1, deleteCount: 2, insertText: "Y" },
  "AXYDE"
);

// Vérifier aussi plusieurs entrées d'historique et une suppression découpée.
const initial = "ABCDE";
const history: SavedChange[] = [];
let content = initial;

const changes: TextChange[] = [
  { position: 2, deleteCount: 0, insertText: "X" },
  { position: 1, deleteCount: 2, insertText: "" },
  { position: 3, deleteCount: 0, insertText: "Y" }
];

// Ces trois demandes utilisent toutes la version initiale.
for (const [index, change] of changes.entries()) {
  const operations = transformTextChange(change, history);
  content = applyChangesToText(content, operations);

  history.push({
    operationId: `change-${index}`,
    version: index + 1,
    operations
  });
}

assert.equal(content, "AXYDE");
console.log("OK : plusieurs modifications depuis la même version");
console.log("Tous les tests de transformation ont réussi.");