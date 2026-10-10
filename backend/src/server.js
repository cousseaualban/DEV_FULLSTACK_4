require('dotenv').config();

const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = require('./app');
const {
    registerCollaborationHandlers
} = require('./collaboration/collaboration.socket.js');

const PORT = process.env.PORT || 5000;

// Créer un serveur HTTP partagé par Express et Socket.IO.
const httpServer = createServer(app);

// Initialiser Socket.IO sur le même serveur.
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
});

// Enregistrer les événements de collaboration.
registerCollaborationHandlers(io);

httpServer.listen(PORT, () => {
    console.log(`Serveur backend démarré sur le port ${PORT}`);
});