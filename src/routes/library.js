import express from 'express';
import { members, books, transactions } from '../models/storage.js';
import { calculateDaysOverdue } from '../utils/helpers.js';

const router = express.Router();

// PROBLEM 7: GET /api/borrowed - List borrowed books
router.get('/borrowed', (req, res) => {
  const borrowedBooks = [];

  for (const transaction of transactions.values()) {
    if (transaction.status === "active") {
      const member = members.get(transaction.member_id);
      const book = books.get(transaction.book_id);
      
      borrowedBooks.push({
        transaction_id: transaction.transaction_id,
        member_id: transaction.member_id,
        member_name: member ? member.name : "Unknown",
        book_id: transaction.book_id,
        book_title: book ? book.title : "Unknown",
        borrowed_at: transaction.borrowed_at,
        due_date: transaction.due_date
      });
    }
  }

  res.json({
    borrowed_books: borrowedBooks
  });
});

// PROBLEM 10: GET /api/overdue - Get overdue books
router.get('/overdue', (req, res) => {
  const overdueBooks = [];
  const now = new Date();

  for (const transaction of transactions.values()) {
    if (transaction.status === "active") {
      const dueDate = new Date(transaction.due_date);
      if (now > dueDate) {
        const member = members.get(transaction.member_id);
        const book = books.get(transaction.book_id);
        const daysOverdue = calculateDaysOverdue(transaction.due_date);
        
        overdueBooks.push({
          transaction_id: transaction.transaction_id,
          member_id: transaction.member_id,
          member_name: member ? member.name : "Unknown",
          book_id: transaction.book_id,
          book_title: book ? book.title : "Unknown",
          borrowed_at: transaction.borrowed_at,
          due_date: transaction.due_date,
          days_overdue: daysOverdue
        });
      }
    }
  }

  res.json({
    overdue_books: overdueBooks
  });
});

export default router;
