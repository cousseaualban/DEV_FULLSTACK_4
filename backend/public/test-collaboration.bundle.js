"use strict";
(() => {
  // client/test-collaboration.js
  function tokensFor(text, id) {
    return text.split("").map((text2, index) => ({
      id: `${id}:${index}`,
      text: text2
    }));
  }
  function textOf(tokens) {
    return tokens.map((token) => token.text).join("");
  }
  function captureChange(tokens, value, id) {
    const oldText = textOf(tokens);
    if (oldText === value) {
      return null;
    }
    let start = 0;
    while (start < oldText.length && start < value.length && oldText[start] === value[start]) {
      start++;
    }
    let oldEnd = oldText.length;
    let newEnd = value.length;
    while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === value[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }
    return {
      id,
      deletedIds: tokens.slice(start, oldEnd).map((token) => token.id),
      inserted: tokensFor(value.slice(start, newEnd), id),
      // Garder les voisins de droite pour retrouver l'endroit de l'ajout.
      rightIds: tokens.slice(oldEnd).map((token) => token.id)
    };
  }
  function insertionPosition(tokens, change) {
    const positions = new Map(tokens.map((token, index) => [token.id, index]));
    for (const id of change.rightIds) {
      if (positions.has(id)) {
        return positions.get(id);
      }
    }
    return tokens.length;
  }
  function previewChange(tokens, change) {
    const deleted = new Set(change.deletedIds);
    const result = tokens.filter((token) => !deleted.has(token.id));
    result.splice(insertionPosition(result, change), 0, ...change.inserted);
    return result;
  }
  function nextRequest(tokens, change) {
    const deleted = new Set(change.deletedIds);
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
        insertText: ""
      };
    }
    if (change.inserted.length > 0) {
      return {
        position: insertionPosition(tokens, change),
        deleteCount: 0,
        insertText: textOf(change.inserted)
      };
    }
    return null;
  }
  function applyServerOperations(tokens, operations, operationId) {
    const result = [...tokens];
    let offset = 0;
    for (const operation of operations) {
      if (operation.position < 0 || operation.deleteCount < 0 || operation.position + operation.deleteCount > result.length) {
        throw new Error("Position re\xE7ue invalide.");
      }
      const inserted = operation.insertText.split("").map((text) => ({
        id: `${operationId}:${offset++}`,
        text
      }));
      result.splice(operation.position, operation.deleteCount, ...inserted);
    }
    return result;
  }
  var socket = io();
  var status = document.getElementById("status");
  var documentStatus = document.getElementById("document-status");
  var editor = document.getElementById("editor");
  var currentDocumentId = null;
  var currentVersion = null;
  var permission = null;
  var documentLabel = "";
  var joinedSession = null;
  var requestedSession = null;
  var ready = false;
  var composing = false;
  var pendingOperation = null;
  var pendingTimer = null;
  var serverTokens = [];
  var displayedTokens = [];
  var localChanges = [];
  function updateEditorAccess() {
    editor.disabled = !ready || !socket.connected;
    editor.readOnly = permission !== "write";
  }
  function showDocumentStatus(message) {
    documentStatus.textContent = `${documentLabel} \u2014 version : ${currentVersion} \u2014 ${message}`;
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
      localStorage.setItem(
        `collaboration-draft:${currentDocumentId}`,
        editor.value
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
      draftMessage = saved ? " Brouillon conserv\xE9 localement." : " Copiez votre texte avant de rouvrir.";
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
    if (composing) {
      return;
    }
    const oldTokens = displayedTokens;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    let tokens = serverTokens;
    for (const change of localChanges) {
      tokens = previewChange(tokens, change);
    }
    const positions = new Map(tokens.map((token, index) => [token.id, index]));
    function moveCursor(position) {
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
    if (!ready || !socket.connected || composing || pendingOperation || permission !== "write") {
      return;
    }
    while (localChanges.length > 0) {
      const change = localChanges[0];
      const operation = nextRequest(serverTokens, change);
      if (!operation) {
        localChanges.shift();
        continue;
      }
      const operationId = operation.insertText !== "" ? change.id : crypto.randomUUID();
      pendingOperation = {
        operationId,
        change,
        isInsertion: operation.insertText !== ""
      };
      pendingTimer = setTimeout(() => {
        stopEditing("Confirmation trop longue. Rouvrez le document.");
      }, 15e3);
      showDocumentStatus("Enregistrement... Vous pouvez continuer \xE0 saisir.");
      socket.emit("document:update", {
        documentId: currentDocumentId,
        operationId,
        baseVersion: currentVersion,
        ...operation
      });
      return;
    }
    showDocumentStatus("Enregistr\xE9");
  }
  function captureInput() {
    if (!ready || !socket.connected || permission !== "write" || composing) {
      return;
    }
    const change = captureChange(
      displayedTokens,
      editor.value,
      crypto.randomUUID()
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
    status.textContent = "Connect\xE9 \u2014 Socket ID : " + socket.id;
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
    documentStatus.textContent = hadDraft ? "R\xE9ouverture. Brouillon conserv\xE9 localement." : "R\xE9ouverture du document...";
    socket.emit("document:join", requestedSession);
  });
  socket.on("disconnect", () => {
    status.textContent = "D\xE9connect\xE9";
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
    if (requestedSession || ready && hasDraft()) {
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
      documentId: document.getElementById("document").value
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
    documentLabel = `${data.userName} \u2014 ${data.title} \u2014 droit : ${permission}`;
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
    showDocumentStatus("Document charg\xE9");
  });
  socket.on("document:updated", (data) => {
    if (data.state.documentId !== currentDocumentId || !ready) {
      return;
    }
    if (data.state.version <= currentVersion) {
      return;
    }
    try {
      if (data.state.version !== currentVersion + 1 || !Array.isArray(data.operations)) {
        throw new Error("Mise \xE0 jour incompl\xE8te. Rouvrez le document.");
      }
      const nextTokens = applyServerOperations(
        serverTokens,
        data.operations,
        data.operationId
      );
      if (textOf(nextTokens) !== data.state.content) {
        throw new Error("Le contenu re\xE7u ne correspond pas aux op\xE9rations.");
      }
      serverTokens = nextTokens;
      currentVersion = data.state.version;
      if (pendingOperation?.operationId === data.operationId) {
        if (pendingOperation.isInsertion) {
          if (localChanges[0] !== pendingOperation.change) {
            throw new Error("File locale incoh\xE9rente.");
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
    if (data.state.documentId !== currentDocumentId || data.operationId !== pendingOperation?.operationId) {
      return;
    }
    stopEditing("Conflit : rouvrez le document pour lire la version du serveur.");
  });
  socket.on("document:error", (data) => {
    requestedSession = null;
    stopEditing("Erreur : " + data.message);
  });
  updateEditorAccess();
})();
