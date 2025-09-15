import express from 'express';
import { 
  candidates, 
  generateCandidateId 
} from '../models/storage.js';

const router = express.Router();

// Q5: Register a new candidate
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
      platform: req.body.platform || "",
      registered_at: new Date().toISOString()
    };

    candidates.set(candidate_id, newCandidate);

    res.status(225).json({
      candidate_id,
      name: newCandidate.name,
      party: newCandidate.party
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q6: Get candidate details
// GET /api/candidates/{id}
router.get('/:id', (req, res) => {
  try {
    const candidate_id = parseInt(req.params.id);

    if (!candidate_id || isNaN(candidate_id)) {
      return res.status(400).json({ message: "invalid candidate ID" });
    }

    const candidate = candidates.get(candidate_id);
    if (!candidate) {
      return res.status(404).json({ message: "candidate not found" });
    }

    res.status(226).json({
      candidate_id: candidate.candidate_id,
      name: candidate.name,
      party: candidate.party
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q7: List all candidates
// GET /api/candidates
router.get('/', (req, res) => {
  try {
    const allCandidates = Array.from(candidates.values()).map(candidate => ({
      candidate_id: candidate.candidate_id,
      name: candidate.name,
      party: candidate.party
    }));

    res.status(227).json({
      candidates: allCandidates
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q10: Filter candidates by party
// GET /api/candidates/filter?party={party}
router.get('/filter', (req, res) => {
  try {
    const { party } = req.query;

    if (!party || typeof party !== 'string' || party.trim().length === 0) {
      return res.status(400).json({ message: "party parameter required" });
    }

    const filteredCandidates = Array.from(candidates.values())
      .filter(candidate => candidate.party.toLowerCase().includes(party.toLowerCase()))
      .map(candidate => ({
        candidate_id: candidate.candidate_id,
        name: candidate.name,
        party: candidate.party
      }));

    res.status(230).json({
      candidates: filteredCandidates
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
