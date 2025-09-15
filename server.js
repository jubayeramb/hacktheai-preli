import express from 'express';
import { initializeData } from './src/models/storage.js';

// Import voting system routes
import votersRouter from './src/routes/voters.js';
import candidatesRouter from './src/routes/candidates.js';
import votesRouter from './src/routes/votes.js';
import resultsRouter from './src/routes/results.js';
import ballotsRouter from './src/routes/ballots.js';
import analyticsRouter from './src/routes/analytics.js';
import auditsRouter from './src/routes/audits.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// Initialize voting system data
initializeData();

// Voting system routes
app.use('/api/voters', votersRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/votes', votesRouter);
app.use('/api/results', resultsRouter);
app.use('/api/ballots', ballotsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audits', auditsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Voting System API',
    version: '1.0.0',
    description: 'HackTheAI Mock Preliminary - Voting System Implementation',
    endpoints: {
      voters: '/api/voters',
      candidates: '/api/candidates',
      votes: '/api/votes',
      results: '/api/results',
      ballots: '/api/ballots',
      analytics: '/api/analytics',
      audits: '/api/audits'
    },
    problems_implemented: 20
  });
});

app.listen(PORT, () => {
  console.log(`Voting System API running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API information`);
});
