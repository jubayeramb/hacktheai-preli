import express from 'express';
import { members, transactions, books } from '../models/storage.js';
import { validateMemberData, validateAgeForUpdate } from '../utils/helpers.js';

const router = express.Router();

// PROBLEM 1: POST /api/members - Create a new member
router.post('/', (req, res) => {
  const { member_id, name, age } = req.body;

  // Validation
  const errors = validateMemberData(member_id, name, age);
  if (errors.length > 0) {
    return res.status(400).json({
      message: errors[0]
    });
  }

  // Check for duplicate ID
  if (members.has(member_id)) {
    return res.status(409).json({
      message: `member with id: ${member_id} already exists`
    });
  }

  // Create new member
  const newMember = {
    member_id,
    name,
    age,
    has_borrowed: false
  };

  members.set(member_id, newMember);

  res.status(201).json(newMember);
});

// PROBLEM 2: GET /api/members/{member_id} - Get member info
router.get('/:member_id', (req, res) => {
  const member_id = parseInt(req.params.member_id);
  
  if (!members.has(member_id)) {
    return res.status(404).json({
      message: `member with id: ${member_id} was not found`
    });
  }

  res.json(members.get(member_id));
});

// PROBLEM 3: GET /api/members - List all members
router.get('/', (req, res) => {
  const membersList = Array.from(members.values()).map(member => ({
    member_id: member.member_id,
    name: member.name,
    age: member.age
  }));

  res.json({
    members: membersList
  });
});

// PROBLEM 4: PUT /api/members/{member_id} - Update member info
router.put('/:member_id', (req, res) => {
  const member_id = parseInt(req.params.member_id);
  const { name, age } = req.body;

  if (!members.has(member_id)) {
    return res.status(404).json({
      message: `member with id: ${member_id} was not found`
    });
  }

  // Age validation
  const ageError = validateAgeForUpdate(age);
  if (ageError) {
    return res.status(400).json({
      message: ageError
    });
  }

  const member = members.get(member_id);
  
  // Update fields if provided
  if (name !== undefined) member.name = name;
  if (age !== undefined) member.age = age;

  members.set(member_id, member);

  res.json(member);
});

// PROBLEM 8: GET /api/members/{member_id}/history - Get borrowing history
router.get('/:member_id/history', (req, res) => {
  const member_id = parseInt(req.params.member_id);

  if (!members.has(member_id)) {
    return res.status(404).json({
      message: `member with id: ${member_id} was not found`
    });
  }

  const member = members.get(member_id);
  const history = [];

  for (const transaction of transactions.values()) {
    if (transaction.member_id === member_id) {
      const book = books.get(transaction.book_id);
      
      history.push({
        transaction_id: transaction.transaction_id,
        book_id: transaction.book_id,
        book_title: book ? book.title : "Unknown",
        borrowed_at: transaction.borrowed_at,
        returned_at: transaction.returned_at,
        status: transaction.status
      });
    }
  }

  res.json({
    member_id,
    member_name: member.name,
    borrowing_history: history
  });
});

// PROBLEM 9: DELETE /api/members/{member_id} - Delete member
router.delete('/:member_id', (req, res) => {
  const member_id = parseInt(req.params.member_id);

  if (!members.has(member_id)) {
    return res.status(404).json({
      message: `member with id: ${member_id} was not found`
    });
  }

  const member = members.get(member_id);

  // Check if member has active borrowing
  if (member.has_borrowed) {
    return res.status(400).json({
      message: `cannot delete member with id: ${member_id}, member has an active book borrowing`
    });
  }

  members.delete(member_id);

  res.json({
    message: `member with id: ${member_id} has been deleted successfully`
  });
});

export default router;
