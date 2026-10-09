const express = require('express');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const folderRoutes = require('./routes/folderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
