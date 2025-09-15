import express from 'express';
import { 
  voters, 
  generateVoterId 
} from '../models/storage.js';

const router = express.Router();

// Q1: Register a new voter
// POST /api/voters
router.post('/', (req, res) => {
  try {
    const { voter_id, name, age } = req.body;

    // Validation
    if (voter_id === undefined || typeof voter_id !== 'number') {
      return res.status(400).json({ message: "voter_id required and must be number" });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: "name required and must be non-empty string" });
    }

    if (!age || typeof age !== 'number' || age < 18) {
      return res.status(400).json({ message: `invalid age: ${age}, must be 18 or older` });
    }

    // Check if voter already exists
    if (voters.has(voter_id)) {
      return res.status(409).json({ message: `voter with id: ${voter_id} already exists` });
    }

    // Create new voter
    const newVoter = {
      voter_id,
      name: name.trim(),
      age,
      has_voted: false,
      profile_updated: false,
      registered_at: new Date().toISOString()
    };

    voters.set(voter_id, newVoter);

    res.status(218).json({
      voter_id,
      name: newVoter.name,
      age: newVoter.age,
      has_voted: newVoter.has_voted
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q2: Get voter details
// GET /api/voters/{id}
router.get('/:id', (req, res) => {
  try {
    const voter_id = parseInt(req.params.id);

    if (!voter_id || isNaN(voter_id)) {
      return res.status(400).json({ message: "invalid voter ID" });
    }

    const voter = voters.get(voter_id);
    if (!voter) {
      return res.status(417).json({ message: `voter with id: ${voter_id} was not found` });
    }

    res.status(222).json({
      voter_id: voter.voter_id,
      name: voter.name,
      age: voter.age,
      has_voted: voter.has_voted
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q3: List all voters
// GET /api/voters
router.get('/', (req, res) => {
  try {
    const allVoters = Array.from(voters.values()).map(voter => ({
      voter_id: voter.voter_id,
      name: voter.name,
      age: voter.age
    }));

    res.status(223).json({
      voters: allVoters
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q4: Update voter profile
// PUT /api/voters/{id}
router.put('/:id', (req, res) => {
  try {
    const voter_id = parseInt(req.params.id);
    const { name, age } = req.body;

    if (!voter_id || isNaN(voter_id)) {
      return res.status(400).json({ message: "invalid voter ID" });
    }

    const voter = voters.get(voter_id);
    if (!voter) {
      return res.status(417).json({ message: `voter with id: ${voter_id} was not found` });
    }

    if (voter.has_voted) {
      return res.status(423).json({ message: "cannot update profile after voting" });
    }

    // Validate inputs if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "name must be non-empty string" });
      }
      voter.name = name.trim();
    }

    if (age !== undefined) {
      if (typeof age !== 'number' || age < 18) {
        return res.status(422).json({ message: `invalid age: ${age}, must be 18 or older` });
      }
      voter.age = age;
    }

    // Mark profile as updated
    voter.profile_updated = true;

    res.send();
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q5: Delete voter (this was Q4 before)
// DELETE /api/voters/{id}
router.delete('/:id', (req, res) => {
  try {
    const voter_id = parseInt(req.params.id);

    if (!voter_id || isNaN(voter_id)) {
      return res.status(400).json({ message: "invalid voter ID" });
    }

    const voter = voters.get(voter_id);
    if (!voter) {
      return res.status(417).json({ message: `voter with id: ${voter_id} was not found` });
    }

    if (voter.has_voted) {
      return res.status(422).json({ message: "cannot delete voter who has already voted" });
    }

    voters.delete(voter_id);

    res.status(225).json({
      message: `voter with id: ${voter_id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
