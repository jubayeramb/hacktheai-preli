import express from 'express';
import { members, books, transactions } from '../models/storage.js';

const router = express.Router();

// PROBLEM 6: POST /api/return - Return book
router.post('/', (req, res) => {
  const { member_id, book_id } = req.body;

  // Find active transaction
  let activeTransaction = null;
  for (const [id, transaction] of transactions.entries()) {
    if (transaction.member_id === member_id && 
        transaction.book_id === book_id && 
        transaction.status === "active") {
      activeTransaction = transaction;
      break;
    }
  }

  if (!activeTransaction) {
    return res.status(400).json({
      message: `member with id: ${member_id} has not borrowed book with id: ${book_id}`
    });
  }

  // Update transaction
  const returned_at = new Date().toISOString();
  activeTransaction.returned_at = returned_at;
  activeTransaction.status = "returned";

  // Update member and book status
  const member = members.get(member_id);
  const book = books.get(book_id);
  
  member.has_borrowed = false;
  book.is_available = true;

  members.set(member_id, member);
  books.set(book_id, book);

  res.json({
    transaction_id: activeTransaction.transaction_id,
    member_id,
    book_id,
    returned_at,
    status: "returned"
  });
});

export default router;
