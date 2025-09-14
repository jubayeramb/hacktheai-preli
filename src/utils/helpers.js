import { v4 as uuidv4 } from 'uuid';

// Helper function to generate transaction IDs
export const generateTransactionId = () => parseInt(Math.random() * 10000) + 500;

// Helper function to generate reservation IDs
export const generateReservationId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `RES-${year}-${month}${day}-${random}`;
};

// Calculate due date (2 weeks from borrow date)
export const calculateDueDate = (borrowedAt) => {
  const dueDate = new Date(borrowedAt);
  dueDate.setDate(dueDate.getDate() + 14); // 2 weeks loan period
  return dueDate.toISOString();
};

// Calculate days overdue
export const calculateDaysOverdue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = now - due;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Validation helpers
export const validateMemberData = (member_id, name, age) => {
  const errors = [];
  
  if (!member_id || !name || age === undefined) {
    errors.push("member_id, name, and age are required");
  }
  
  if (age !== undefined && (age < 0 || age > 150)) {
    errors.push("age must be between 0 and 150");
  }
  
  return errors;
};

export const validateBookData = (book_id, title, author, isbn) => {
  const errors = [];
  
  if (!book_id || !title || !author || !isbn) {
    errors.push("book_id, title, author, and isbn are required");
  }
  
  return errors;
};

export const validateAgeForUpdate = (age) => {
  if (age !== undefined && age < 12) {
    return `invalid age: ${age}, must be 12 or older`;
  }
  return null;
};
