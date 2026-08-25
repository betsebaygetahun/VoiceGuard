const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
// Standard logging to track latency and requests
app.use(morgan('dev'));

// Routes
const streamRoutes = require('./routes/stream');
const demoRoutes = require('./routes/demo');
app.use('/api', streamRoutes);
app.use('/api', demoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🛡️  VoiceGuard Backend Server running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Test endpoint: http://localhost:${PORT}/health\n`);
});
