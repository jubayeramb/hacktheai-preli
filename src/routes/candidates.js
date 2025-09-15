import express from 'express';
import { 
  candidates, 
  votes,
  generateCandidateId 
} from '../models/storage.js';

const router = express.Router();

// Q6: Register a new candidate
// POST /api/candidates
router.post('/', (req, res) => {
  try {
    const { name, party } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: "name required and must be non-empty string" });
    }

    if (!party || typeof party !== 'string' || party.trim().length === 0) {
      return res.status(400).json({ message: "party required and must be non-empty string" });
    }

    // Check if candidate already exists (by name)
    const existingCandidate = Array.from(candidates.values()).find(c => c.name === name.trim());
    if (existingCandidate) {
      return res.status(409).json({ message: "candidate already exists" });
    }

    // Create new candidate
    const candidate_id = generateCandidateId();
    const newCandidate = {
      candidate_id,
      name: name.trim(),
      party: party.trim(),
      votes: 0,
      registered_at: new Date().toISOString()
    };

    candidates.set(candidate_id, newCandidate);

    res.status(226).json({
      candidate_id,
      name: newCandidate.name,
      party: newCandidate.party,
      votes: newCandidate.votes
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q7: List all candidates
// Q10: Filter candidates by party (with ?party= query parameter)
// GET /api/candidates
router.get('/', (req, res) => {
  try {
    const { party } = req.query;
    
    let allCandidates = Array.from(candidates.values()).map(candidate => ({
      candidate_id: candidate.candidate_id,
      name: candidate.name,
      party: candidate.party
    }));

    // Q10: Filter by party if party query parameter is provided
    if (party && typeof party === 'string' && party.trim().length > 0) {
      const filteredCandidates = allCandidates.filter(candidate => 
        candidate.party.toLowerCase().includes(party.toLowerCase())
      );
      
      return res.status(230).json({
        candidates: filteredCandidates
      });
    }

    // Q7: Return all candidates if no filter
    res.status(227).json({
      candidates: allCandidates
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q9: Get Candidate Votes
// GET /api/candidates/{candidate_id}/votes
router.get('/:id/votes', (req, res) => {
  try {
    const candidate_id = parseInt(req.params.id);

    if (!candidate_id || isNaN(candidate_id)) {
      return res.status(400).json({ message: "invalid candidate ID" });
    }

    // Check if candidate exists
    const candidate = candidates.get(candidate_id);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }

    // Count votes for this candidate
    const voteCount = Array.from(votes.values())
      .filter(vote => vote.candidate_id === candidate_id)
      .reduce((sum, vote) => sum + (vote.weight || 1), 0);

    res.status(229).json({
      candidate_id,
      votes: voteCount
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
