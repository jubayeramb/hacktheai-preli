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

// Initialize voting system data
export function initializeData() {
  // Clear all data structures - start with empty state
  voters.clear();
  candidates.clear();
  votes.clear();
  elections.clear();
  ballots.clear();
  audits.clear();
  privacyBudgets.clear();
  nullifiers.clear();
  voteTimeline.length = 0; // Clear array

  // Reset ID counters to default starting values
  voterIdCounter = 1000;
  candidateIdCounter = 1000;
  voteIdCounter = 1000;

  console.log('Voting system data initialized successfully');
}
