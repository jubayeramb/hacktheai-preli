import express from 'express';
import { members, books, transactions } from '../models/storage.js';
import { generateTransactionId, calculateDueDate, calculateDaysOverdue } from '../utils/helpers.js';

const router = express.Router();

// PROBLEM 5: POST /api/borrow - Borrow book
router.post('/', (req, res) => {
  const { member_id, book_id } = req.body;

  // Check if member exists
  if (!members.has(member_id)) {
    return res.status(404).json({
      message: `member with id: ${member_id} was not found`
    });
  }

  // Check if book exists
  if (!books.has(book_id)) {
    return res.status(404).json({
      message: `book with id: ${book_id} was not found`
    });
  }

  const member = members.get(member_id);
  const book = books.get(book_id);

  // Check if member already has borrowed a book
  if (member.has_borrowed) {
    return res.status(400).json({
      message: `member with id: ${member_id} has already borrowed a book`
    });
  }

  // Check if book is available
  if (!book.is_available) {
    return res.status(400).json({
      message: `book with id: ${book_id} is not available`
    });
  }

  // Create transaction
  const transaction_id = generateTransactionId();
  const borrowed_at = new Date().toISOString();
  const due_date = calculateDueDate(borrowed_at);

  const transaction = {
    transaction_id,
    member_id,
    book_id,
    borrowed_at,
    due_date,
    returned_at: null,
    status: "active"
  };

  // Update member and book status
  member.has_borrowed = true;
  book.is_available = false;
  book.borrowing_count = (book.borrowing_count || 0) + 1;

  // Store transaction
  transactions.set(transaction_id, transaction);
  members.set(member_id, member);
  books.set(book_id, book);

  res.json({
    transaction_id,
    member_id,
    book_id,
    borrowed_at,
    status: "active"
  });
});

export default router;
