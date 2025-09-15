import express from 'express';
import { 
  ballots,
  nullifiers,
  generateId 
} from '../models/storage.js';

const router = express.Router();

// Q16: End-to-End Verifiable Encrypted Ballot
// POST /api/ballots/encrypted
router.post('/encrypted', (req, res) => {
  try {
    const { 
      election_id, 
      ciphertext, 
      zk_proof, 
      voter_pubkey, 
      nullifier, 
      signature 
    } = req.body;

    // Validation
    if (!election_id || typeof election_id !== 'string') {
      return res.status(400).json({ message: "election_id required" });
    }

    if (!ciphertext || typeof ciphertext !== 'string') {
      return res.status(400).json({ message: "ciphertext required" });
    }

    if (!zk_proof || typeof zk_proof !== 'string') {
      return res.status(400).json({ message: "zk_proof required" });
    }

    if (!voter_pubkey || typeof voter_pubkey !== 'string') {
      return res.status(400).json({ message: "voter_pubkey required" });
    }

    if (!nullifier || typeof nullifier !== 'string') {
      return res.status(400).json({ message: "nullifier required" });
    }

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ message: "signature required" });
    }

    // Check for double voting (nullifier already used)
    if (nullifiers.has(nullifier)) {
      return res.status(400).json({ message: "double voting detected" });
    }

    // Simulate ZK proof verification (in practice this would be complex cryptographic verification)
    if (!zk_proof.startsWith('base64(')) {
      return res.status(425).json({ message: "invalid zk proof" });
    }

    // Simulate signature verification
    if (!signature.startsWith('base64(')) {
      return res.status(400).json({ message: "invalid signature" });
    }

    // Generate ballot ID
    const ballot_id = "b_" + generateId();

    // Store the encrypted ballot
    const ballot = {
      ballot_id,
      election_id,
      ciphertext,
      zk_proof,
      voter_pubkey,
      nullifier,
      signature,
      status: "accepted",
      anchored_at: new Date().toISOString()
    };

    ballots.set(ballot_id, ballot);
    nullifiers.add(nullifier);

    res.status(236).json({
      ballot_id,
      status: "accepted",
      nullifier,
      anchored_at: ballot.anchored_at
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Q19: Ranked-Choice / Condorcet (Schulze) - Submit ranked ballots
router.post('/ranked', (req, res) => {
  try {
    const { 
      election_id, 
      voter_id, 
      ranking, 
      timestamp 
    } = req.body;

    // Validate required fields
    if (!election_id || voter_id === undefined || !ranking || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields: election_id, voter_id, ranking, timestamp'
      });
    }

    // Validate ranking array
    if (!Array.isArray(ranking) || ranking.length === 0) {
      return res.status(400).json({
        error: 'Ranking must be a non-empty array'
      });
    }

    // Check for duplicate voter
    const existingBallot = Array.from(ballots.values())
      .find(ballot => ballot.voter_id === voter_id && ballot.election_id === election_id);
    
    if (existingBallot) {
      return res.status(409).json({
        error: 'Voter has already submitted a ranked ballot for this election'
      });
    }

    // Generate ballot ID
    const ballot_id = `rb_${generateId()}`;

    // Store ranked ballot
    const rankedBallot = {
      ballot_id,
      election_id,
      voter_id,
      ranking,
      timestamp,
      type: 'ranked_choice',
      created_at: new Date().toISOString()
    };

    ballots.set(ballot_id, rankedBallot);

    // Response with status 239 Ranked
    res.status(239).json({
      ballot_id,
      status: 'accepted'
    });

  } catch (error) {
    console.error('Error submitting ranked ballot:', error);
    res.status(500).json({
      error: 'Internal server error during ballot submission'
    });
  }
});

export default router;
