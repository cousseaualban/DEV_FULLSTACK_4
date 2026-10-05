const express = require('express');

const app = express();
const PORT = 5000;

// Middleware pour lire les données JSON
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
    res.json({
        message: 'BACKEND Lorenzo/Alban/NUGYEN'
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});