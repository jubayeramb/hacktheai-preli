// In-memory storage for all data
export const members = new Map();
export const books = new Map();
export const transactions = new Map();
export const reservations = new Map();

// Sample books data
const sampleBooks = [
  { 
    book_id: 101, 
    title: "The Great Gatsby", 
    author: "F. Scott Fitzgerald", 
    isbn: "978-0-7432-7356-5", 
    is_available: true, 
    category: "Classic Literature", 
    published_date: "1925-04-10", 
    rating: 4.2, 
    borrowing_count: 45, 
    popularity_score: 7.8 
  },
  { 
    book_id: 102, 
    title: "To Kill a Mockingbird", 
    author: "Harper Lee", 
    isbn: "978-0-06-112008-4", 
    is_available: true, 
    category: "Classic Literature", 
    published_date: "1960-07-11", 
    rating: 4.5, 
    borrowing_count: 67, 
    popularity_score: 8.2 
  },
  { 
    book_id: 103, 
    title: "1984", 
    author: "George Orwell", 
    isbn: "978-0-452-28423-4", 
    is_available: true, 
    category: "Dystopian Fiction", 
    published_date: "1949-06-08", 
    rating: 4.6, 
    borrowing_count: 89, 
    popularity_score: 9.1 
  },
  { 
    book_id: 104, 
    title: "Pride and Prejudice", 
    author: "Jane Austen", 
    isbn: "978-0-14-143951-8", 
    is_available: true, 
    category: "Romance", 
    published_date: "1813-01-28", 
    rating: 4.3, 
    borrowing_count: 34, 
    popularity_score: 7.5 
  },
  { 
    book_id: 105, 
    title: "The Catcher in the Rye", 
    author: "J.D. Salinger", 
    isbn: "978-0-316-76948-0", 
    is_available: true, 
    category: "Coming of Age", 
    published_date: "1951-07-16", 
    rating: 3.8, 
    borrowing_count: 23, 
    popularity_score: 6.9 
  }
];

// Initialize sample books
export function initializeData() {
  sampleBooks.forEach(book => books.set(book.book_id, book));
}
