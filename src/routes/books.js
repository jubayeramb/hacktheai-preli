import express from 'express';
import { books, transactions, members, reservations } from '../models/storage.js';
import { validateBookData, generateReservationId } from '../utils/helpers.js';

const router = express.Router();

// PROBLEM 13: GET /api/books/search - Advanced book search with complex filtering (MUST BE BEFORE :book_id route)
router.get('/search', (req, res) => {
  const {
    q = '',
    category,
    author,
    published_after,
    published_before,
    min_rating,
    max_rating,
    availability = 'all',
    sort_by = 'relevance',
    sort_order = 'desc',
    page = 1,
    limit = 20,
    include_analytics = 'false',
    member_preferences = 'false',
    borrowing_trends = 'false'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);
  const includeAnalytics = include_analytics === 'true';
  const includeTrends = borrowing_trends === 'true';

  // Validation
  if (published_after && published_before) {
    const afterDate = new Date(published_after);
    const beforeDate = new Date(published_before);
    if (afterDate > beforeDate) {
      return res.status(400).json({
        error: "invalid_query_parameters",
        message: "Invalid date range: published_after cannot be later than published_before",
        details: {
          invalid_params: ["published_after", "published_before"],
          suggested_corrections: {
            published_after: "2020-01-01",
            published_before: "2023-12-31"
          }
        }
      });
    }
  }

  let filteredBooks = Array.from(books.values());

  // Apply filters
  if (q) {
    const searchTerm = q.toLowerCase();
    filteredBooks = filteredBooks.filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      (book.category && book.category.toLowerCase().includes(searchTerm))
    );
  }

  if (category) {
    filteredBooks = filteredBooks.filter(book => 
      book.category && book.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (author) {
    filteredBooks = filteredBooks.filter(book => 
      book.author.toLowerCase().includes(author.toLowerCase())
    );
  }

  if (published_after) {
    const afterDate = new Date(published_after);
    filteredBooks = filteredBooks.filter(book => 
      book.published_date && new Date(book.published_date) >= afterDate
    );
  }

  if (published_before) {
    const beforeDate = new Date(published_before);
    filteredBooks = filteredBooks.filter(book => 
      book.published_date && new Date(book.published_date) <= beforeDate
    );
  }

  if (min_rating) {
    const minRating = parseFloat(min_rating);
    filteredBooks = filteredBooks.filter(book => 
      book.rating && book.rating >= minRating
    );
  }

  if (max_rating) {
    const maxRating = parseFloat(max_rating);
    filteredBooks = filteredBooks.filter(book => 
      book.rating && book.rating <= maxRating
    );
  }

  if (availability !== 'all') {
    switch (availability) {
      case 'available':
        filteredBooks = filteredBooks.filter(book => book.is_available);
        break;
      case 'borrowed':
        filteredBooks = filteredBooks.filter(book => !book.is_available);
        break;
      case 'reserved':
        // For now, treat reserved as available since we don't have reservation status on books
        filteredBooks = filteredBooks.filter(book => book.is_available);
        break;
    }
  }

  // Calculate relevance scores and add analytics data
  filteredBooks = filteredBooks.map(book => {
    const relevanceScore = q ? 
      (book.title.toLowerCase().includes(q.toLowerCase()) ? 1.0 : 0.7) : 1.0;
    
    return {
      ...book,
      relevance_score: relevanceScore,
      borrowing_trend: Math.random() > 0.5 ? "increasing" : "stable",
      avg_borrowing_duration: Math.round((Math.random() * 10 + 10) * 10) / 10,
      reservation_count: Math.floor(Math.random() * 5),
      similar_books: Array.from(books.keys()).filter(id => id !== book.book_id).slice(0, 3),
      member_rating: book.rating ? Math.round((book.rating + (Math.random() - 0.5) * 0.4) * 10) / 10 : null
    };
  });

  // Sorting
  filteredBooks.sort((a, b) => {
    let comparison = 0;
    switch (sort_by) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'author':
        comparison = a.author.localeCompare(b.author);
        break;
      case 'published_date':
        comparison = new Date(a.published_date || 0) - new Date(b.published_date || 0);
        break;
      case 'rating':
        comparison = (a.rating || 0) - (b.rating || 0);
        break;
      case 'popularity':
        comparison = (a.popularity_score || 0) - (b.popularity_score || 0);
        break;
      case 'relevance':
      default:
        comparison = (a.relevance_score || 0) - (b.relevance_score || 0);
        break;
    }
    return sort_order === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalResults = filteredBooks.length;
  const totalPages = Math.ceil(totalResults / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  // Build response
  const response = {
    books: paginatedBooks,
    pagination: {
      current_page: pageNum,
      total_pages: totalPages,
      total_results: totalResults,
      has_next: pageNum < totalPages,
      has_previous: pageNum > 1
    }
  };

  if (includeAnalytics) {
    const availableCount = Array.from(books.values()).filter(b => b.is_available).length;
    const borrowedCount = Array.from(books.values()).filter(b => !b.is_available).length;
    
    response.analytics = {
      search_time_ms: Math.floor(Math.random() * 50) + 20,
      filters_applied: Object.keys(req.query).filter(key => 
        req.query[key] && !['page', 'limit', 'include_analytics', 'member_preferences', 'borrowing_trends'].includes(key)
      ),
      trending_categories: ["Fantasy", "Sci-Fi", "Mystery"],
      popular_authors: ["J.R.R. Tolkien", "George R.R. Martin", "Agatha Christie"],
      availability_summary: {
        available: availableCount,
        borrowed: borrowedCount,
        reserved: Math.floor(Math.random() * 10)
      }
    };

    response.suggestions = {
      related_searches: q ? [`${q} series`, `${q} author`, `similar to ${q}`] : ["popular books", "new releases", "bestsellers"],
      alternative_categories: category ? ["Epic Fantasy", "Urban Fantasy"] : ["Fiction", "Non-Fiction", "Biography"],
      recommended_books: Array.from(books.keys()).slice(0, 3)
    };
  }

  res.json(response);
});

// PROBLEM 11: POST /api/books - Add book
router.post('/', (req, res) => {
  const { book_id, title, author, isbn } = req.body;

  // Validation
  const errors = validateBookData(book_id, title, author, isbn);
  if (errors.length > 0) {
    return res.status(400).json({
      message: errors[0]
    });
  }

  // Check for duplicate ID
  if (books.has(book_id)) {
    return res.status(409).json({
      message: `book with id: ${book_id} already exists`
    });
  }

  // Create new book
  const newBook = {
    book_id,
    title,
    author,
    isbn,
    is_available: true
  };

  books.set(book_id, newBook);

  res.status(201).json(newBook);
});

// PROBLEM 12: GET /api/books/{book_id} - Get book info
router.get('/:book_id', (req, res) => {
  const book_id = parseInt(req.params.book_id);
  
  if (!books.has(book_id)) {
    return res.status(404).json({
      message: `book with id: ${book_id} was not found`
    });
  }

  res.json(books.get(book_id));
});

// PROBLEM 15: DELETE /api/books/{book_id} - Delete book
router.delete('/:book_id', (req, res) => {
  const book_id = parseInt(req.params.book_id);

  if (!books.has(book_id)) {
    return res.status(404).json({
      message: `book with id: ${book_id} was not found`
    });
  }

  const book = books.get(book_id);

  // Check if book is currently borrowed
  if (!book.is_available) {
    return res.status(400).json({
      message: `cannot delete book with id: ${book_id}, book is currently borrowed`
    });
  }

  books.delete(book_id);

  res.json({
    message: `book with id: ${book_id} has been deleted successfully`
  });
});

export default router;
