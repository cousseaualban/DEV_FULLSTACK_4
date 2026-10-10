export interface TextChange {
  position: number;
  deleteCount: number;
  insertText: string;
}

export interface SavedChange {
  operationId: string;
  version: number;

  // Les positions suivent l'ordre d'application des opérations.
  operations: TextChange[];
}

interface DeleteRange {
  start: number;
  end: number;
}

function moveAfterDelete(
  position: number,
  start: number,
  count: number
): number {
  if (position <= start) {
    return position;
  }

  if (position >= start + count) {
    return position - count;
  }

  // Cette position était dans le texte supprimé.
  return start;
}

export function transformTextChange(
  change: TextChange,
  history: SavedChange[]
): TextChange[] {
  // La position d'insertion et les zones à supprimer sont ajustées
  // séparément. Cela permet aussi de traiter un remplacement.
  let insertPosition = change.position;

  let ranges: DeleteRange[] = change.deleteCount > 0
    ? [{
        start: change.position,
        end: change.position + change.deleteCount
      }]
    : [];

  for (const saved of history) {
    for (const previous of saved.operations) {
      const position = previous.position;

      if (previous.deleteCount > 0) {
        insertPosition = moveAfterDelete(
          insertPosition,
          position,
          previous.deleteCount
        );

        ranges = ranges
          .map((range) => ({
            start: moveAfterDelete(
              range.start,
              position,
              previous.deleteCount
            ),
            end: moveAfterDelete(
              range.end,
              position,
              previous.deleteCount
            )
          }))
          .filter((range) => range.start < range.end);
      }

      const addedLength = previous.insertText.length;

      if (addedLength === 0) {
        continue;
      }

      // À position égale, l'insertion déjà acceptée reste devant.
      if (position <= insertPosition) {
        insertPosition += addedLength;
      }

      const adjustedRanges: DeleteRange[] = [];

      for (const range of ranges) {
        if (position <= range.start) {
          // L'ajout est avant notre zone : déplacer les deux limites.
          adjustedRanges.push({
            start: range.start + addedLength,
            end: range.end + addedLength
          });
        } else if (position >= range.end) {
          adjustedRanges.push(range);
        } else {
          // L'ajout est au milieu de notre zone.
          // Séparer la suppression pour garder le nouveau texte.
          adjustedRanges.push(
            {
              start: range.start,
              end: position
            },
            {
              start: position + addedLength,
              end: range.end + addedLength
            }
          );
        }
      }

      ranges = adjustedRanges;
    }
  }

  const operations: TextChange[] = [];

  // Supprimer de droite à gauche pour ne pas déplacer
  // les positions des zones qui restent à traiter.
  ranges.sort((first, second) => second.start - first.start);

  for (const range of ranges) {
    const count = range.end - range.start;

    operations.push({
      position: range.start,
      deleteCount: count,
      insertText: ""
    });

    // Notre insertion aura lieu après nos propres suppressions.
    insertPosition = moveAfterDelete(
      insertPosition,
      range.start,
      count
    );
  }

  if (change.insertText !== "") {
    operations.push({
      position: insertPosition,
      deleteCount: 0,
      insertText: change.insertText
    });
  }

  // Une liste vide est possible si tout le texte demandé
  // a déjà été supprimé par un autre utilisateur.
  return operations;
}

export function applyChangesToText(
  content: string,
  operations: TextChange[]
): string {
  let result = content;

  for (const operation of operations) {
    if (
      !Number.isSafeInteger(operation.position) ||
      !Number.isSafeInteger(operation.deleteCount) ||
      operation.position < 0 ||
      operation.deleteCount < 0 ||
      typeof operation.insertText !== "string" ||
      operation.position > result.length ||
      operation.deleteCount > result.length - operation.position
    ) {
      throw new Error("Position de modification invalide.");
    }

    result =
      result.slice(0, operation.position) +
      operation.insertText +
      result.slice(operation.position + operation.deleteCount);
  }

  return result;
}