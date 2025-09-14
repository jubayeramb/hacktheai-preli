import http from 'http';

const BASE_URL = 'http://localhost:8000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test counter
let testCount = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  testCount++;
  console.log(`\n🧪 Test ${testCount}: ${testName}`);
  
  return testFn()
    .then(() => {
      passedTests++;
      console.log(`✅ PASSED: ${testName}`);
    })
    .catch((error) => {
      failedTests++;
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
    });
}

async function testAPI() {
  console.log('🚀 Starting Library Management API Tests...\n');
  console.log('=' .repeat(50));

  // Test 1: Health Check
  await runTest('Health Check', async () => {
    const response = await makeRequest('GET', '/health');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.status || response.data.status !== 'OK') {
      throw new Error('Health check failed');
    }
  });

  // Test 2: Create Member (Problem 1)
  await runTest('Create Member - Success', async () => {
    const memberData = {
      member_id: 1,
      name: "Alice",
      age: 22
    };
    const response = await makeRequest('POST', '/api/members', memberData);
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    if (response.data.member_id !== 1 || response.data.name !== "Alice") {
      throw new Error('Member data mismatch');
    }
  });

  // Test 3: Create Member - Duplicate ID
  await runTest('Create Member - Duplicate ID', async () => {
    const memberData = {
      member_id: 1,
      name: "Bob",
      age: 30
    };
    const response = await makeRequest('POST', '/api/members', memberData);
    if (response.status !== 409) {
      throw new Error(`Expected status 409, got ${response.status}`);
    }
    if (!response.data.message.includes('already exists')) {
      throw new Error('Expected duplicate error message');
    }
  });

  // Test 4: Get Member Info (Problem 2)
  await runTest('Get Member Info - Success', async () => {
    const response = await makeRequest('GET', '/api/members/1');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (response.data.member_id !== 1 || response.data.name !== "Alice") {
      throw new Error('Member data mismatch');
    }
  });

  // Test 5: Get Member Info - Not Found
  await runTest('Get Member Info - Not Found', async () => {
    const response = await makeRequest('GET', '/api/members/999');
    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }
    if (!response.data.message.includes('was not found')) {
      throw new Error('Expected not found error message');
    }
  });

  // Test 6: Create another member for testing
  await runTest('Create Second Member', async () => {
    const memberData = {
      member_id: 2,
      name: "Bob",
      age: 30
    };
    const response = await makeRequest('POST', '/api/members', memberData);
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
  });

  // Test 7: List All Members (Problem 3)
  await runTest('List All Members', async () => {
    const response = await makeRequest('GET', '/api/members');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.members || response.data.members.length < 2) {
      throw new Error('Expected at least 2 members');
    }
  });

  // Test 8: Update Member Info (Problem 4)
  await runTest('Update Member Info - Success', async () => {
    const updateData = {
      name: "Alice Smith",
      age: 25
    };
    const response = await makeRequest('PUT', '/api/members/1', updateData);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (response.data.name !== "Alice Smith" || response.data.age !== 25) {
      throw new Error('Member update failed');
    }
  });

  // Test 9: Update Member Info - Invalid Age
  await runTest('Update Member Info - Invalid Age', async () => {
    const updateData = {
      name: "Alice Smith",
      age: 10
    };
    const response = await makeRequest('PUT', '/api/members/1', updateData);
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (!response.data.message.includes('must be 12 or older')) {
      throw new Error('Expected age validation error');
    }
  });

  // Test 10: Add Book (Problem 11)
  await runTest('Add Book - Success', async () => {
    const bookData = {
      book_id: 201,
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "978-0547928227"
    };
    const response = await makeRequest('POST', '/api/books', bookData);
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    if (response.data.book_id !== 201 || response.data.title !== "The Hobbit") {
      throw new Error('Book data mismatch');
    }
  });

  // Test 11: Add Book - Duplicate ID
  await runTest('Add Book - Duplicate ID', async () => {
    const bookData = {
      book_id: 201,
      title: "Another Book",
      author: "Another Author",
      isbn: "978-1234567890"
    };
    const response = await makeRequest('POST', '/api/books', bookData);
    if (response.status !== 409) {
      throw new Error(`Expected status 409, got ${response.status}`);
    }
    if (!response.data.message.includes('already exists')) {
      throw new Error('Expected duplicate error message');
    }
  });

  // Test 12: Get Book Info (Problem 12)
  await runTest('Get Book Info - Success', async () => {
    const response = await makeRequest('GET', '/api/books/201');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (response.data.book_id !== 201 || response.data.title !== "The Hobbit") {
      throw new Error('Book data mismatch');
    }
  });

  // Test 13: Get Book Info - Not Found
  await runTest('Get Book Info - Not Found', async () => {
    const response = await makeRequest('GET', '/api/books/999');
    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }
    if (!response.data.message.includes('was not found')) {
      throw new Error('Expected not found error message');
    }
  });

  // Test 14: Borrow Book (Problem 5)
  await runTest('Borrow Book - Success', async () => {
    const borrowData = {
      member_id: 1,
      book_id: 101  // Using existing book from sample data
    };
    const response = await makeRequest('POST', '/api/borrow', borrowData);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.transaction_id || response.data.status !== "active") {
      throw new Error('Borrow transaction failed');
    }
  });

  // Test 15: Borrow Book - Member Already Borrowed
  await runTest('Borrow Book - Member Already Borrowed', async () => {
    const borrowData = {
      member_id: 1,
      book_id: 102
    };
    const response = await makeRequest('POST', '/api/borrow', borrowData);
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (!response.data.message.includes('already borrowed')) {
      throw new Error('Expected already borrowed error message');
    }
  });

  // Test 16: List Borrowed Books (Problem 7)
  await runTest('List Borrowed Books', async () => {
    const response = await makeRequest('GET', '/api/borrowed');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.borrowed_books || response.data.borrowed_books.length === 0) {
      throw new Error('Expected at least one borrowed book');
    }
  });

  // Test 17: Return Book (Problem 6)
  await runTest('Return Book - Success', async () => {
    const returnData = {
      member_id: 1,
      book_id: 101
    };
    const response = await makeRequest('POST', '/api/return', returnData);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (response.data.status !== "returned") {
      throw new Error('Return transaction failed');
    }
  });

  // Test 18: Return Book - Not Borrowed
  await runTest('Return Book - Not Borrowed', async () => {
    const returnData = {
      member_id: 1,
      book_id: 102
    };
    const response = await makeRequest('POST', '/api/return', returnData);
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (!response.data.message.includes('has not borrowed')) {
      throw new Error('Expected not borrowed error message');
    }
  });

  // Test 19: Get Member Borrowing History (Problem 8)
  await runTest('Get Member Borrowing History', async () => {
    const response = await makeRequest('GET', '/api/members/1/history');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.borrowing_history || response.data.borrowing_history.length === 0) {
      throw new Error('Expected borrowing history');
    }
  });

  // Test 20: Delete Member - With Active Borrowing (should fail)
  await runTest('Delete Member - Setup Active Borrowing', async () => {
    // First borrow a book with member 2
    const borrowData = {
      member_id: 2,
      book_id: 102
    };
    const response = await makeRequest('POST', '/api/borrow', borrowData);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
  });

  await runTest('Delete Member - With Active Borrowing', async () => {
    const response = await makeRequest('DELETE', '/api/members/2');
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (!response.data.message.includes('has an active book borrowing')) {
      throw new Error('Expected active borrowing error message');
    }
  });

  // Test 21: Get Overdue Books (Problem 10)
  await runTest('Get Overdue Books', async () => {
    const response = await makeRequest('GET', '/api/overdue');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    // This might be empty if no books are overdue
    if (!response.data.overdue_books) {
      throw new Error('Expected overdue_books array');
    }
  });

  // Test 22: Advanced Book Search (Problem 13)
  await runTest('Advanced Book Search - Basic Query', async () => {
    const response = await makeRequest('GET', '/api/books/search?q=great&sort_by=title&limit=10');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.books || !response.data.pagination) {
      throw new Error('Expected books array and pagination');
    }
  });

  // Test 23: Advanced Book Search - With Analytics
  await runTest('Advanced Book Search - With Analytics', async () => {
    const response = await makeRequest('GET', '/api/books/search?q=gatsby&include_analytics=true&min_rating=4.0');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.analytics || !response.data.suggestions) {
      throw new Error('Expected analytics and suggestions');
    }
  });

  // Test 24: Advanced Book Search - Invalid Date Range
  await runTest('Advanced Book Search - Invalid Date Range', async () => {
    const response = await makeRequest('GET', '/api/books/search?published_after=2023-01-01&published_before=2020-01-01');
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (!response.data.error || response.data.error !== "invalid_query_parameters") {
      throw new Error('Expected invalid query parameters error');
    }
  });

  // Test 25: Complex Reservation System (Problem 14)
  await runTest('Create Reservation - Success', async () => {
    const reservationData = {
      member_id: 1,
      book_id: 103,
      reservation_type: "standard",
      preferred_pickup_date: "2025-09-20T10:00:00Z",
      max_wait_days: 14,
      notification_preferences: {
        email: true,
        sms: false,
        push: true
      }
    };
    const response = await makeRequest('POST', '/api/reservations', reservationData);
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    if (!response.data.reservation_id || !response.data.priority_score) {
      throw new Error('Expected reservation with ID and priority score');
    }
  });

  // Test 26: Delete Book - Currently Borrowed (should fail)
  await runTest('Delete Book - Currently Borrowed', async () => {
    const response = await makeRequest('DELETE', '/api/books/102');
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (!response.data.message.includes('currently borrowed')) {
      throw new Error('Expected currently borrowed error message');
    }
  });

  // Test 27: Return book for member 2 and then delete member
  await runTest('Return Book for Member 2', async () => {
    const returnData = {
      member_id: 2,
      book_id: 102
    };
    const response = await makeRequest('POST', '/api/return', returnData);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
  });

  // Test 28: Delete Member - Success (Problem 9)
  await runTest('Delete Member - Success', async () => {
    const response = await makeRequest('DELETE', '/api/members/2');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.message.includes('deleted successfully')) {
      throw new Error('Expected successful deletion message');
    }
  });

  // Test 29: Delete Book - Success (Problem 15)
  await runTest('Delete Book - Success', async () => {
    const response = await makeRequest('DELETE', '/api/books/201');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.message.includes('deleted successfully')) {
      throw new Error('Expected successful deletion message');
    }
  });

  // Test 30: Root Endpoint
  await runTest('Root Endpoint', async () => {
    const response = await makeRequest('GET', '/');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.message || !response.data.endpoints) {
      throw new Error('Expected API info with endpoints');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testCount}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The API is working correctly.');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please check the errors above.`);
  }
}

// Run the tests
testAPI().catch(error => {
  console.error('Test suite failed to run:', error);
  process.exit(1);
});
