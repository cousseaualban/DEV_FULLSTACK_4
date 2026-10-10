// Chaque caractère possède une référence locale.
// Cela permet de le retrouver quand les positions changent.
function tokensFor(text, id) {
  return text.split("").map((text, index) => ({
    id: `${id}:${index}`,
    text,
  }));
}

function textOf(tokens) {
  return tokens.map((token) => token.text).join("");
}

// Comparer la saisie avec le texte affiché avant la modification.
function captureChange(tokens, value, id) {
  const oldText = textOf(tokens);

  if (oldText === value) {
    return null;
  }

  let start = 0;

  while (
    start < oldText.length &&
    start < value.length &&
    oldText[start] === value[start]
  ) {
    start++;
  }

  let oldEnd = oldText.length;
  let newEnd = value.length;

  while (
    oldEnd > start &&
    newEnd > start &&
    oldText[oldEnd - 1] === value[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  return {
    id,
    deletedIds: tokens.slice(start, oldEnd).map((token) => token.id),
    inserted: tokensFor(value.slice(start, newEnd), id),

    // Garder les voisins de droite pour retrouver l'endroit de l'ajout.
    rightIds: tokens.slice(oldEnd).map((token) => token.id),
  };
}

function insertionPosition(tokens, change) {
  const positions = new Map(tokens.map((token, index) => [token.id, index]));

  for (const id of change.rightIds) {
    if (positions.has(id)) {
      return positions.get(id);
    }
  }

  // Sans voisin à droite, ajouter à la fin.
  // Les ajouts déjà acceptés à cette extrémité restent devant.
  return tokens.length;
}

// Afficher une modification locale sans attendre le serveur.
function previewChange(tokens, change) {
  const deleted = new Set(change.deletedIds);
  const result = tokens.filter((token) => !deleted.has(token.id));

  result.splice(insertionPosition(result, change), 0, ...change.inserted);

  return result;
}

// Préparer la prochaine petite opération à envoyer au serveur.
function nextRequest(tokens, change) {
  const deleted = new Set(change.deletedIds);

  // Supprimer de droite à gauche.
  // Les lettres ajoutées par les autres utilisateurs restent intactes.
  let end = tokens.length;

  while (end > 0 && !deleted.has(tokens[end - 1].id)) {
    end--;
  }

  if (end > 0) {
    let start = end - 1;

    while (start > 0 && deleted.has(tokens[start - 1].id)) {
      start--;
    }

    return {
      position: start,
      deleteCount: end - start,
      insertText: "",
    };
  }

  // Faire l'insertion après les suppressions.
  if (change.inserted.length > 0) {
    return {
      position: insertionPosition(tokens, change),
      deleteCount: 0,
      insertText: textOf(change.inserted),
    };
  }

  return null;
}

function applyServerOperations(tokens, operations, operationId) {
  const result = [...tokens];
  let offset = 0;

  for (const operation of operations) {
    if (
      operation.position < 0 ||
      operation.deleteCount < 0 ||
      operation.position + operation.deleteCount > result.length
    ) {
      throw new Error("Position reçue invalide.");
    }

    const inserted = operation.insertText.split("").map((text) => ({
      id: `${operationId}:${offset++}`,
      text,
    }));

    result.splice(operation.position, operation.deleteCount, ...inserted);
  }

  return result;
}

const socket = io();

const status = document.getElementById("status");
const documentStatus = document.getElementById("document-status");
const editor = document.getElementById("editor");

let currentDocumentId = null;
let currentVersion = null;
let permission = null;
let documentLabel = "";
let joinedSession = null;
let requestedSession = null;
let ready = false;
let composing = false;
let pendingOperation = null;
let pendingTimer = null;

// Texte confirmé par le serveur.
let serverTokens = [];

// Texte affiché, avec les modifications locales non confirmées.
let displayedTokens = [];

// Saisies locales à traiter dans l'ordre.
let localChanges = [];

function updateEditorAccess() {
  editor.disabled = !ready || !socket.connected;

  // Une opération en attente ne bloque plus la saisie.
  editor.readOnly = permission !== "write";
}

function showDocumentStatus(message) {
  documentStatus.textContent = `${documentLabel} — version : ${currentVersion} — ${message}`;
}

function clearPending() {
  clearTimeout(pendingTimer);
  pendingTimer = null;
  pendingOperation = null;
}

function hasDraft() {
  return pendingOperation !== null || localChanges.length > 0 || composing;
}

function savePendingDraft() {
  if (!currentDocumentId || !hasDraft()) {
    return true;
  }

  try {
    // Garder le texte visible, y compris la dernière saisie.
    localStorage.setItem(
      `collaboration-draft:${currentDocumentId}`,
      editor.value,
    );

    return true;
  } catch (error) {
    console.error("Impossible de conserver le brouillon :", error);
    return false;
  }
}

function stopEditing(message) {
  const hadDraft = hasDraft();
  const saved = savePendingDraft();

  ready = false;
  composing = false;
  clearPending();
  updateEditorAccess();

  let draftMessage = "";

  if (hadDraft) {
    draftMessage = saved
      ? " Brouillon conservé localement."
      : " Copiez votre texte avant de rouvrir.";
  }

  documentStatus.textContent = message + draftMessage;
}

function resetDocument() {
  clearPending();

  currentDocumentId = null;
  currentVersion = null;
  permission = null;
  documentLabel = "";
  ready = false;
  composing = false;
  serverTokens = [];
  displayedTokens = [];
  localChanges = [];

  editor.value = "";
  updateEditorAccess();
}

function renderDocument() {
  // Ne pas remplacer le champ pendant la composition d'un caractère.
  if (composing) {
    return;
  }

  const oldTokens = displayedTokens;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  // Repartir du texte du serveur et réappliquer les saisies locales.
  let tokens = serverTokens;

  for (const change of localChanges) {
    tokens = previewChange(tokens, change);
  }

  const positions = new Map(tokens.map((token, index) => [token.id, index]));

  function moveCursor(position) {
    // Retrouver le caractère à droite du curseur.
    for (let index = position; index < oldTokens.length; index++) {
      if (positions.has(oldTokens[index].id)) {
        return positions.get(oldTokens[index].id);
      }
    }

    return tokens.length;
  }

  displayedTokens = tokens;
  editor.value = textOf(tokens);

  editor.setSelectionRange(moveCursor(start), moveCursor(end));
}

function sendNextChange() {
  if (
    !ready ||
    !socket.connected ||
    composing ||
    pendingOperation ||
    permission !== "write"
  ) {
    return;
  }

  while (localChanges.length > 0) {
    const change = localChanges[0];
    const operation = nextRequest(serverTokens, change);

    if (!operation) {
      // Les caractères demandés peuvent avoir déjà été supprimés.
      localChanges.shift();
      continue;
    }

    // Une insertion garde l'identifiant de la saisie locale.
    // Ses caractères auront les mêmes références après confirmation.
    const operationId =
      operation.insertText !== "" ? change.id : crypto.randomUUID();

    pendingOperation = {
      operationId,
      change,
      isInsertion: operation.insertText !== "",
    };

    pendingTimer = setTimeout(() => {
      stopEditing("Confirmation trop longue. Rouvrez le document.");
    }, 15000);

    showDocumentStatus("Enregistrement... Vous pouvez continuer à saisir.");

    socket.emit("document:update", {
      documentId: currentDocumentId,
      operationId,
      baseVersion: currentVersion,
      ...operation,
    });

    // Attendre la confirmation avant le prochain envoi.
    return;
  }

  showDocumentStatus("Enregistré");
}

function captureInput() {
  if (!ready || !socket.connected || permission !== "write" || composing) {
    return;
  }

  const change = captureChange(
    displayedTokens,
    editor.value,
    crypto.randomUUID(),
  );

  if (!change) {
    return;
  }

  localChanges.push(change);
  displayedTokens = previewChange(displayedTokens, change);

  renderDocument();
  sendNextChange();
}

editor.addEventListener("input", captureInput);

editor.addEventListener("compositionstart", () => {
  composing = true;
});

editor.addEventListener("compositionend", () => {
  composing = false;
  captureInput();
  renderDocument();
  sendNextChange();
});

socket.on("connect", () => {
  status.textContent = "Connecté — Socket ID : " + socket.id;

  // Réessayer aussi une ouverture interrompue avant sa réponse.
  const session = joinedSession ?? requestedSession;

  if (!session) {
    return;
  }

  const hadDraft = hasDraft();

  if (!savePendingDraft()) {
    stopEditing("Copiez votre texte avant de recharger la page.");
    return;
  }

  resetDocument();
  requestedSession = { ...session };

  documentStatus.textContent = hadDraft
    ? "Réouverture. Brouillon conservé localement."
    : "Réouverture du document...";

  // Une ancienne demande a peut-être déjà été enregistrée.
  // Ne pas la renvoyer automatiquement.
  socket.emit("document:join", requestedSession);
});

socket.on("disconnect", () => {
  status.textContent = "Déconnecté";

  stopEditing("Connexion interrompue. Reconnectez-vous pour rouvrir.");
});

socket.on("connect_error", (error) => {
  status.textContent = "Erreur : " + error.message;
});

document.getElementById("disconnect").onclick = () => {
  socket.disconnect();
};

document.getElementById("connect").onclick = () => {
  socket.connect();
};

document.getElementById("join").onclick = () => {
  if (!socket.connected) {
    documentStatus.textContent = "Reconnectez-vous d'abord.";
    return;
  }

  if (requestedSession || (ready && hasDraft())) {
    return;
  }

  if (!savePendingDraft()) {
    documentStatus.textContent = "Copiez votre texte avant de rouvrir.";
    return;
  }

  joinedSession = null;
  resetDocument();

  requestedSession = {
    userId: document.getElementById("user").value,
    documentId: document.getElementById("document").value,
  };

  documentStatus.textContent = "Ouverture du document...";
  socket.emit("document:join", requestedSession);
};

socket.on("document:joined", (data) => {
  if (!requestedSession || requestedSession.documentId !== data.documentId) {
    return;
  }

  joinedSession = { ...requestedSession };
  requestedSession = null;

  currentDocumentId = data.documentId;
  permission = data.permission;

  documentLabel = `${data.userName} — ${data.title} — droit : ${permission}`;
});

socket.on("document:state", (state) => {
  if (state.documentId !== currentDocumentId || ready || hasDraft()) {
    return;
  }

  currentVersion = state.version;

  serverTokens = tokensFor(state.content, `initial-${state.version}`);

  displayedTokens = [];
  ready = true;

  renderDocument();
  editor.setSelectionRange(0, 0);
  updateEditorAccess();
  showDocumentStatus("Document chargé");
});

socket.on("document:updated", (data) => {
  if (data.state.documentId !== currentDocumentId || !ready) {
    return;
  }

  if (data.state.version <= currentVersion) {
    return;
  }

  try {
    // Les opérations exactes permettent de distinguer
    // les caractères locaux des caractères ajoutés à distance.
    if (
      data.state.version !== currentVersion + 1 ||
      !Array.isArray(data.operations)
    ) {
      throw new Error("Mise à jour incomplète. Rouvrez le document.");
    }

    const nextTokens = applyServerOperations(
      serverTokens,
      data.operations,
      data.operationId,
    );

    if (textOf(nextTokens) !== data.state.content) {
      throw new Error("Le contenu reçu ne correspond pas aux opérations.");
    }

    serverTokens = nextTokens;
    currentVersion = data.state.version;

    if (pendingOperation?.operationId === data.operationId) {
      // Une saisie peut demander plusieurs suppressions,
      // puis une insertion finale.
      if (pendingOperation.isInsertion) {
        if (localChanges[0] !== pendingOperation.change) {
          throw new Error("File locale incohérente.");
        }

        localChanges.shift();
      }

      clearPending();
    }

    renderDocument();
    sendNextChange();
  } catch (error) {
    stopEditing(error.message);
  }
});

socket.on("document:conflict", (data) => {
  if (
    data.state.documentId !== currentDocumentId ||
    data.operationId !== pendingOperation?.operationId
  ) {
    return;
  }

  stopEditing("Conflit : rouvrez le document pour lire la version du serveur.");
});

socket.on("document:error", (data) => {
  requestedSession = null;
  stopEditing("Erreur : " + data.message);
});

updateEditorAccess();
