import express from 'express';
import { 
  voters, 
  candidates, 
  votes, 
  voteTimeline,
  generateVoteId 
} from '../models/storage.js';

const router = express.Router();

// Q8: Cast a vote
// POST /api/votes
router.post('/', (req, res) => {
  try {
    const { voter_id, candidate_id } = req.body;

    // Validation
    if (!voter_id || typeof voter_id !== 'number') {
      return res.status(400).json({ message: "voter_id required and must be number" });
    }

    if (!candidate_id || typeof candidate_id !== 'number') {
      return res.status(400).json({ message: "candidate_id required and must be number" });
    }

    // Check if voter exists
    const voter = voters.get(voter_id);
    if (!voter) {
      return res.status(404).json({ message: "voter not found" });
    }

    // Check if candidate exists
    const candidate = candidates.get(candidate_id);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }

    // Check if voter has already voted
    if (voter.has_voted) {
      return res.status(423).json({ message: `voter with id: ${voter_id} has already voted` });
    }

    // Create the vote
    const vote_id = generateVoteId();
    const timestamp = new Date().toISOString();
    
    const newVote = {
      vote_id,
      voter_id,
      candidate_id,
      timestamp,
      weight: 1 // Default weight for simple votes
    };

    votes.set(vote_id, newVote);
    voteTimeline.push({
      vote_id,
      timestamp,
      voter_id,
      candidate_id
    });

    // Mark voter as having voted
    voter.has_voted = true;

    res.status(228).json({
      vote_id,
      voter_id,
      candidate_id,
      timestamp
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q13: Vote Timeline - Get timeline of votes for a specific candidate
// GET /api/votes/timeline?candidate_id={id}
router.get('/timeline', (req, res) => {
  try {
    const candidate_id = parseInt(req.query.candidate_id);

    if (!candidate_id || isNaN(candidate_id)) {
      return res.status(400).json({ message: "candidate_id parameter required" });
    }

    // Check if candidate exists
    const candidate = candidates.get(candidate_id);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }

    // Get all votes for this candidate
    const candidateVotes = Array.from(votes.values())
      .filter(vote => vote.candidate_id === candidate_id)
      .map(vote => ({
        vote_id: vote.vote_id,
        timestamp: vote.timestamp
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(233).json({
      candidate_id,
      timeline: candidateVotes
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q14: Conditional Vote Weight - Cast a weighted vote based on voter profile
// POST /api/votes/weighted
router.post('/weighted', (req, res) => {
  try {
    const { voter_id, candidate_id } = req.body;

    // Validation
    if (!voter_id || typeof voter_id !== 'number') {
      return res.status(400).json({ message: "voter_id required and must be number" });
    }

    if (!candidate_id || typeof candidate_id !== 'number') {
      return res.status(400).json({ message: "candidate_id required and must be number" });
    }

    // Check if voter exists
    const voter = voters.get(voter_id);
    if (!voter) {
      return res.status(404).json({ message: "voter not found" });
    }

    // Check if candidate exists
    const candidate = candidates.get(candidate_id);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }

    // Check if voter has already voted
    if (voter.has_voted) {
      return res.status(423).json({ message: `voter with id: ${voter_id} has already voted` });
    }

    // Determine vote weight based on profile update status
    const weight = voter.profile_updated ? 2 : 1;

    // Create the weighted vote
    const vote_id = generateVoteId();
    const timestamp = new Date().toISOString();
    
    const newVote = {
      vote_id,
      voter_id,
      candidate_id,
      timestamp,
      weight
    };

    votes.set(vote_id, newVote);
    voteTimeline.set(vote_id, timestamp);

    // Mark voter as having voted
    voter.has_voted = true;

    res.status(234).json({
      vote_id,
      voter_id,
      candidate_id,
      weight
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q15: Range Vote Queries - Get votes for a candidate within a time range
// GET /api/votes/range?candidate_id={id}&from={t1}&to={t2}
router.get('/range', (req, res) => {
  try {
    const candidate_id = parseInt(req.query.candidate_id);
    const { from, to } = req.query;

    if (!candidate_id || isNaN(candidate_id)) {
      return res.status(400).json({ message: "candidate_id parameter required" });
    }

    if (!from || !to) {
      return res.status(400).json({ message: "from and to parameters required" });
    }

    // Validate timestamps
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: "invalid timestamp format" });
    }

    if (fromDate > toDate) {
      return res.status(424).json({ message: "invalid interval: from > to" });
    }

    // Check if candidate exists
    const candidate = candidates.get(candidate_id);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }

    // Count votes in the time range
    const votesInRange = Array.from(votes.values())
      .filter(vote => {
        if (vote.candidate_id !== candidate_id) return false;
        const voteDate = new Date(vote.timestamp);
        return voteDate >= fromDate && voteDate <= toDate;
      });

    const votes_gained = votesInRange.reduce((sum, vote) => sum + (vote.weight || 1), 0);

    res.status(235).json({
      candidate_id,
      from,
      to,
      votes_gained
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
