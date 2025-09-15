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
  console.log('🚀 Starting Voting System API Tests...\n');
  console.log('=' .repeat(50));

  // Test 1: Create Voter (Q1)
  await runTest('Create Voter - Success', async () => {
    const voterData = {
      voter_id: 1,
      name: "Alice",
      age: 22
    };
    const response = await makeRequest('POST', '/api/voters', voterData);
    if (response.status !== 218) {
      throw new Error(`Expected status 218, got ${response.status}`);
    }
    if (response.data.voter_id !== 1 || response.data.name !== "Alice" || !('has_voted' in response.data)) {
      throw new Error('Voter data mismatch');
    }
  });

  // Test 2: Create Voter - Duplicate ID
  await runTest('Create Voter - Duplicate ID', async () => {
    const voterData = {
      voter_id: 1,
      name: "Bob",
      age: 30
    };
    const response = await makeRequest('POST', '/api/voters', voterData);
    if (response.status !== 409) {
      throw new Error(`Expected status 409, got ${response.status}`);
    }
    if (!response.data.message.includes('already exists')) {
      throw new Error('Expected duplicate error message');
    }
  });

  // Test 3: Get Voter Info (Q2)
  await runTest('Get Voter Info - Success', async () => {
    const response = await makeRequest('GET', '/api/voters/1');
    if (response.status !== 222) {
      throw new Error(`Expected status 222, got ${response.status}`);
    }
    if (response.data.voter_id !== 1 || response.data.name !== "Alice") {
      throw new Error('Voter data mismatch');
    }
  });

  // Test 4: Get Voter Info - Not Found
  await runTest('Get Voter Info - Not Found', async () => {
    const response = await makeRequest('GET', '/api/voters/999');
    if (response.status !== 417) {
      throw new Error(`Expected status 417, got ${response.status}`);
    }
    if (!response.data.message.includes('was not found')) {
      throw new Error('Expected not found error message');
    }
  });

  // Test 5: Create another voter for testing
  await runTest('Create Second Voter', async () => {
    const voterData = {
      voter_id: 2,
      name: "Bob",
      age: 30
    };
    const response = await makeRequest('POST', '/api/voters', voterData);
    if (response.status !== 218) {
      throw new Error(`Expected status 218, got ${response.status}`);
    }
  });

  // Test 6: List All Voters (Q3)
  await runTest('List All Voters', async () => {
    const response = await makeRequest('GET', '/api/voters');
    if (response.status !== 223) {
      throw new Error(`Expected status 223, got ${response.status}`);
    }
    if (!response.data.voters || response.data.voters.length < 2) {
      throw new Error('Expected at least 2 voters');
    }
  });

  // Test 7: Update Voter Info (Q4)
  await runTest('Update Voter Info - Success', async () => {
    const updateData = {
      name: "Alice Smith",
      age: 25
    };
    const response = await makeRequest('PUT', '/api/voters/1', updateData);
    if (response.status !== 224) {
      throw new Error(`Expected status 224, got ${response.status}`);
    }
    if (response.data.name !== "Alice Smith" || response.data.age !== 25) {
      throw new Error('Voter update failed');
    }
  });

  // Test 8: Update Voter Info - Invalid Age
  await runTest('Update Voter Info - Invalid Age', async () => {
    const updateData = {
      name: "Alice Smith",
      age: 16
    };
    const response = await makeRequest('PUT', '/api/voters/1', updateData);
    if (response.status !== 422) {
      throw new Error(`Expected status 422, got ${response.status}`);
    }
    if (!response.data.message.includes('must be 18 or older')) {
      throw new Error('Expected age validation error');
    }
  });

  // Test 9: Register Candidate (Q6)
  await runTest('Register Candidate - Success', async () => {
    const candidateData = {
      candidate_id: 1,
      name: "John Doe",
      party: "Green Party"
    };
    const response = await makeRequest('POST', '/api/candidates', candidateData);
    if (response.status !== 226) {
      throw new Error(`Expected status 226, got ${response.status}`);
    }
    if (response.data.candidate_id !== 1 || response.data.name !== "John Doe") {
      throw new Error('Candidate data mismatch');
    }
  });

  // Test 10: List Candidates (Q7)
  await runTest('List Candidates', async () => {
    const response = await makeRequest('GET', '/api/candidates');
    if (response.status !== 227) {
      throw new Error(`Expected status 227, got ${response.status}`);
    }
    if (!response.data.candidates || response.data.candidates.length === 0) {
      throw new Error('Expected candidates array');
    }
  });

  // Test 11: Cast Vote (Q8)
  await runTest('Cast Vote - Success', async () => {
    const voteData = {
      voter_id: 1,
      candidate_id: 1
    };
    const response = await makeRequest('POST', '/api/votes', voteData);
    if (response.status !== 228) {
      throw new Error(`Expected status 228, got ${response.status}`);
    }
    if (!response.data.vote_id || !response.data.timestamp) {
      throw new Error('Vote data incomplete');
    }
  });

  // Test 12: Cast Vote - Already Voted
  await runTest('Cast Vote - Already Voted', async () => {
    const voteData = {
      voter_id: 1,
      candidate_id: 1
    };
    const response = await makeRequest('POST', '/api/votes', voteData);
    if (response.status !== 423) {
      throw new Error(`Expected status 423, got ${response.status}`);
    }
    if (!response.data.message.includes('has already voted')) {
      throw new Error('Expected already voted error message');
    }
  });

  // Test 13: Get Candidate Votes (Q9)
  await runTest('Get Candidate Votes', async () => {
    const response = await makeRequest('GET', '/api/candidates/1/votes');
    if (response.status !== 229) {
      throw new Error(`Expected status 229, got ${response.status}`);
    }
    if (!('votes' in response.data)) {
      throw new Error('Expected vote count');
    }
  });

  // Test 14: Filter Candidates by Party (Q10)
  await runTest('Filter Candidates by Party', async () => {
    const response = await makeRequest('GET', '/api/candidates?party=Green%20Party');
    if (response.status !== 230) {
      throw new Error(`Expected status 230, got ${response.status}`);
    }
    if (!response.data.candidates || response.data.candidates.length === 0) {
      throw new Error('Expected filtered candidates');
    }
  });

  // Test 15: Voting Results (Q11)
  await runTest('Get Voting Results', async () => {
    const response = await makeRequest('GET', '/api/results');
    if (response.status !== 231) {
      throw new Error(`Expected status 231, got ${response.status}`);
    }
    if (!response.data.results) {
      throw new Error('Expected results array');
    }
  });

  // Test 16: Get Winner (Q12)
  await runTest('Get Winner', async () => {
    const response = await makeRequest('GET', '/api/results/winner');
    if (response.status !== 232) {
      throw new Error(`Expected status 232, got ${response.status}`);
    }
    if (!response.data.winners) {
      throw new Error('Expected winners array');
    }
  });

  // Test 17: Vote Timeline (Q13)
  await runTest('Get Vote Timeline', async () => {
    const response = await makeRequest('GET', '/api/votes/timeline?candidate_id=1');
    if (response.status !== 233) {
      throw new Error(`Expected status 233, got ${response.status}`);
    }
    if (!response.data.timeline) {
      throw new Error('Expected timeline array');
    }
  });

  // Test 18: Weighted Vote (Q14)
  await runTest('Cast Weighted Vote', async () => {
    const voteData = {
      voter_id: 2,
      candidate_id: 1
    };
    const response = await makeRequest('POST', '/api/votes/weighted', voteData);
    if (response.status !== 234) {
      throw new Error(`Expected status 234, got ${response.status}`);
    }
    if (!response.data.weight) {
      throw new Error('Expected vote weight');
    }
  });

  // Test 19: Range Vote Query (Q15)
  await runTest('Range Vote Query - Success', async () => {
    const response = await makeRequest('GET', '/api/votes/range?candidate_id=1&from=2025-09-10T10:00:00Z&to=2025-09-10T12:00:00Z');
    if (response.status !== 235) {
      throw new Error(`Expected status 235, got ${response.status}`);
    }
    if (!('votes_gained' in response.data)) {
      throw new Error('Expected votes_gained in response');
    }
  });

  // Test 20: Range Vote Query - Invalid Interval
  await runTest('Range Vote Query - Invalid Interval', async () => {
    const response = await makeRequest('GET', '/api/votes/range?candidate_id=1&from=2025-09-10T12:00:00Z&to=2025-09-10T10:00:00Z');
    if (response.status !== 424) {
      throw new Error(`Expected status 424, got ${response.status}`);
    }
    if (!response.data.message.includes('invalid interval')) {
      throw new Error('Expected invalid interval error message');
    }
  });

  // Test 21: Submit Encrypted Ballot (Q16)
  await runTest('Submit Encrypted Ballot', async () => {
    const ballotData = {
      election_id: "nat-2025",
      ciphertext: "base64(Paillier_or_ElGamal_cipher)",
      zk_proof: "base64(Groth16_or_Plonk_proof)",
      voter_pubkey: "hex(P-256)",
      nullifier: "hex(keccak256(signal))",
      signature: "base64(Ed25519 signature over payload)"
    };
    const response = await makeRequest('POST', '/api/ballots/encrypted', ballotData);
    if (response.status !== 236) {
      throw new Error(`Expected status 236, got ${response.status}`);
    }
    if (!response.data.ballot_id || !response.data.nullifier) {
      throw new Error('Expected ballot ID and nullifier');
    }
  });

  // Test 22: Submit Invalid Encrypted Ballot
  await runTest('Submit Invalid Encrypted Ballot', async () => {
    const ballotData = {
      election_id: "nat-2025",
      ciphertext: "invalid_cipher",
      zk_proof: "invalid_proof",
      voter_pubkey: "invalid_key",
      nullifier: "invalid_nullifier",
      signature: "invalid_signature"
    };
    const response = await makeRequest('POST', '/api/ballots/encrypted', ballotData);
    if (response.status !== 425) {
      throw new Error(`Expected status 425, got ${response.status}`);
    }
    if (!response.data.message.includes('invalid zk proof')) {
      throw new Error('Expected invalid proof error message');
    }
  });

  // Test 23: Homomorphic Tally (Q17)
  await runTest('Compute Homomorphic Tally', async () => {
    const tallyData = {
      election_id: "nat-2025",
      trustee_decrypt_shares: [
        { trustee_id: "T1", share: "base64(...)", proof: "base64(NIZK)" },
        { trustee_id: "T3", share: "base64(...)", proof: "base64(NIZK)" },
        { trustee_id: "T5", share: "base64(...)", proof: "base64(NIZK)" }
      ]
    };
    const response = await makeRequest('POST', '/api/results/homomorphic', tallyData);
    if (response.status !== 237) {
      throw new Error(`Expected status 237, got ${response.status}`);
    }
    if (!response.data.candidate_tallies || !response.data.transparency) {
      throw new Error('Expected tally results and transparency data');
    }
  });

  // Test 24: Differential Privacy Analytics (Q18)
  await runTest('Differential Privacy Analytics', async () => {
    const queryData = {
      election_id: "nat-2025",
      query: {
        type: "histogram",
        dimension: "voter_age_bucket",
        buckets: [ "18-24", "25-34", "35-44", "45-64", "65+" ],
        filter: { has_voted: true }
      },
      epsilon: 0.5,
      delta: 1e-6
    };
    const response = await makeRequest('POST', '/api/analytics/dp', queryData);
    if (response.status !== 238) {
      throw new Error(`Expected status 238, got ${response.status}`);
    }
    if (!response.data.answer || !response.data.remaining_privacy_budget) {
      throw new Error('Expected DP results and privacy budget');
    }
  });

  // Test 25: Submit Ranked Choice Ballot (Q19)
  await runTest('Submit Ranked Choice Ballot', async () => {
    const rankingData = {
      election_id: "city-rcv-2025",
      voter_id: 123,
      ranking: [3, 1, 2, 5, 4],
      timestamp: "2025-09-10T10:15:00Z"
    };
    const response = await makeRequest('POST', '/api/ballots/ranked', rankingData);
    if (response.status !== 239) {
      throw new Error(`Expected status 239, got ${response.status}`);
    }
    if (!response.data.ballot_id || !response.data.status) {
      throw new Error('Expected ballot ID and status');
    }
  });

  // Test 26: Risk-Limiting Audit Plan (Q20)
  await runTest('Create Risk-Limiting Audit Plan', async () => {
    const auditData = {
      election_id: "nat-2025",
      reported_tallies: [
        { candidate_id: 1, votes: 40321 },
        { candidate_id: 2, votes: 39997 }
      ],
      risk_limit_alpha: 0.05,
      audit_type: "ballot_polling",
      stratification: { counties: ["A","B","C"] }
    };
    const response = await makeRequest('POST', '/api/audits/plan', auditData);
    if (response.status !== 240) {
      throw new Error(`Expected status 240, got ${response.status}`);
    }
    if (!response.data.audit_id || !response.data.sampling_plan) {
      throw new Error('Expected audit ID and sampling plan');
    }
  });

  // Test 27: Delete Voter (Q5)
  await runTest('Delete Voter - Success', async () => {
    const response = await makeRequest('DELETE', '/api/voters/2');
    if (response.status !== 225) {
      throw new Error(`Expected status 225, got ${response.status}`);
    }
    if (!response.data.message.includes('deleted successfully')) {
      throw new Error('Expected successful deletion message');
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
