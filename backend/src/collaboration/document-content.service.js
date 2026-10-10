const { mockDocuments } = require('../mocks/documents.mock.js');

function findDocument(documentId) {
    return mockDocuments.find((document) => document.id === documentId);
}

function getDocumentPermission(documentId, userId) {
    const document = findDocument(documentId);

    return document?.members.find(
        (member) => member.userId === userId
    )?.permission;
}

function saveDocumentContent(documentId, content, userId) {
    const document = findDocument(documentId);

    if (!document) {
        return undefined;
    }

    document.content = content;
    document.updatedAt = new Date().toISOString();
    document.updatedBy = userId;

    return document;
}

module.exports = {
    findDocument,
    getDocumentPermission,
    saveDocumentContent
};