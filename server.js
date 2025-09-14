import express from 'express';
import { initializeData } from './src/models/storage.js';

// Import routes
import membersRouter from './src/routes/members.js';
import booksRouter from './src/routes/books.js';
import borrowRouter from './src/routes/borrow.js';
import returnRouter from './src/routes/return.js';
import libraryRouter from './src/routes/library.js';
import reservationsRouter from './src/routes/reservations.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// Initialize data
initializeData();

// Routes
app.use('/api/members', membersRouter);
app.use('/api/books', booksRouter);
app.use('/api/borrow', borrowRouter);
app.use('/api/return', returnRouter);
app.use('/api', libraryRouter); // This handles /api/borrowed and /api/overdue
app.use('/api/reservations', reservationsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Library Management API',
    version: '1.0.0',
    endpoints: {
      members: '/api/members',
      books: '/api/books',
      borrow: '/api/borrow',
      return: '/api/return',
      borrowed: '/api/borrowed',
      overdue: '/api/overdue',
      reservations: '/api/reservations'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
