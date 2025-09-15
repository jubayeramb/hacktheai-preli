// In-memory storage for the voting system
export const voters = new Map();
export const candidates = new Map();
export const votes = new Map();
export const ballots = new Map();
export const nullifiers = new Set();
export const elections = new Map();
export const privacyBudgets = new Map();
export const audits = new Map();
export const voteTimeline = [];

// ID counters for consistent ID generation
let voterIdCounter = 1000;
let candidateIdCounter = 1000;
let voteIdCounter = 1000;

// Helper functions to generate unique IDs
export function generateVoterId() {
  return voterIdCounter++;
}

export function generateCandidateId() {
  return candidateIdCounter++;
}

export function generateVoteId() {
  return voteIdCounter++;
}

export function generateId() {
  return Math.floor(Math.random() * 9000) + 1000;
}

// Sample data for initial testing
const sampleVoters = [
  {
    voter_id: 1,
    name: "Alice Johnson",
    age: 28,
    has_voted: false,
    profile_updated: true,
    registered_at: "2025-01-01T10:00:00Z"
  },
  {
    voter_id: 2,
    name: "Bob Smith",
    age: 35,
    has_voted: false,
    profile_updated: false,
    registered_at: "2025-01-02T11:30:00Z"
  },
  {
    voter_id: 3,
    name: "Carol Brown",
    age: 42,
    has_voted: false,
    profile_updated: true,
    registered_at: "2025-01-03T09:15:00Z"
  }
];

const sampleCandidates = [
  {
    candidate_id: 1,
    name: "John Doe",
    party: "Green Party",
    platform: "Environmental sustainability and renewable energy",
    registered_at: "2024-12-01T08:00:00Z"
  },
  {
    candidate_id: 2,
    name: "Jane Roe",
    party: "Innovation Party",
    platform: "Technology advancement and digital governance",
    registered_at: "2024-12-02T10:30:00Z"
  },
  {
    candidate_id: 3,
    name: "Alex Turner",
    party: "Unity Coalition",
    platform: "Social unity and economic equality",
    registered_at: "2024-12-03T14:20:00Z"
  }
];

const sampleElections = [
  {
    election_id: "nat-2025",
    name: "National Election 2025",
    start_date: "2025-09-10T00:00:00Z",
    end_date: "2025-09-11T00:00:00Z",
    status: "active",
    type: "general"
  },
  {
    election_id: "city-rcv-2025",
    name: "City Ranked Choice Election 2025",
    start_date: "2025-09-15T00:00:00Z",
    end_date: "2025-09-16T00:00:00Z",
    status: "upcoming",
    type: "ranked_choice"
  }
];

// Initialize voting system data
export function initializeData() {
  // Clear existing data
  voters.clear();
  candidates.clear();
  votes.clear();
  elections.clear();
  ballots.clear();
  audits.clear();
  privacyBudgets.clear();
  nullifiers.clear();
  voteTimeline.length = 0; // Clear array

  // Initialize sample voters
  sampleVoters.forEach(voter => {
    voters.set(voter.voter_id, voter);
    voterIdCounter = Math.max(voterIdCounter, voter.voter_id + 1);
  });

  // Initialize sample candidates
  sampleCandidates.forEach(candidate => {
    candidates.set(candidate.candidate_id, candidate);
    candidateIdCounter = Math.max(candidateIdCounter, candidate.candidate_id + 1);
  });

  // Initialize sample elections
  sampleElections.forEach(election => {
    elections.set(election.election_id, election);
  });

  // Initialize privacy budgets for analytics
  privacyBudgets.set("nat-2025", {
    epsilon: 2.0,
    delta: 1e-6,
    remaining_epsilon: 2.0,
    queries_count: 0,
    last_query: null
  });

  console.log('Voting system data initialized successfully');
}
