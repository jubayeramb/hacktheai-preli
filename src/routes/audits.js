import express from 'express';
import { audits, generateId } from '../models/storage.js';

const router = express.Router();

// Q20: Risk-Limiting Audit (RLA) - Produce audit plan
router.post('/plan', (req, res) => {
  try {
    const { 
      election_id, 
      reported_tallies, 
      risk_limit_alpha = 0.05, 
      audit_type = 'ballot_polling',
      stratification 
    } = req.body;

    // Validate required fields
    if (!election_id || !reported_tallies) {
      return res.status(400).json({
        error: 'Missing required fields: election_id, reported_tallies'
      });
    }

    // Validate reported_tallies structure
    if (!Array.isArray(reported_tallies) || reported_tallies.length === 0) {
      return res.status(400).json({
        error: 'reported_tallies must be a non-empty array'
      });
    }

    // Validate each tally entry
    for (const tally of reported_tallies) {
      if (typeof tally.candidate_id === 'undefined' || typeof tally.votes !== 'number') {
        return res.status(400).json({
          error: 'Each tally must have candidate_id and votes (number)'
        });
      }
    }

    // Validate risk limit
    if (risk_limit_alpha <= 0 || risk_limit_alpha >= 1) {
      return res.status(400).json({
        error: 'risk_limit_alpha must be between 0 and 1'
      });
    }

    // Calculate total votes
    const total_votes = reported_tallies.reduce((sum, tally) => sum + tally.votes, 0);
    
    // Calculate margin (difference between top two candidates)
    const sortedTallies = [...reported_tallies].sort((a, b) => b.votes - a.votes);
    const margin = sortedTallies.length >= 2 ? 
      (sortedTallies[0].votes - sortedTallies[1].votes) / total_votes : 
      0.5; // If only one candidate, assume large margin

    // Calculate initial sample size using simplified formula
    // Real RLA would use more complex statistical calculations
    const base_sample_size = Math.ceil(
      -Math.log(risk_limit_alpha) / (2 * Math.pow(margin, 2))
    );
    
    // Adjust for stratification if provided
    let initial_sample_size = base_sample_size;
    if (stratification && stratification.counties) {
      // Distribute sample across counties
      initial_sample_size = Math.ceil(base_sample_size * 1.2); // 20% increase for stratification
    }

    // Ensure minimum sample size
    initial_sample_size = Math.max(initial_sample_size, 100);
    initial_sample_size = Math.min(initial_sample_size, total_votes); // Can't exceed total votes

    // Generate audit ID
    const audit_id = `rla_${generateId().toString(16)}`;

    // Generate sampling plan (simplified base64 encoded CSV)
    let sampling_plan_data = 'county,proportion,random_seed\n';
    if (stratification && stratification.counties) {
      const counties = stratification.counties;
      counties.forEach((county, index) => {
        const proportion = (1 / counties.length).toFixed(3);
        const random_seed = Math.random().toString(16).substr(2, 8);
        sampling_plan_data += `${county},${proportion},${random_seed}\n`;
      });
    } else {
      sampling_plan_data += 'ALL,1.000,12345678\n';
    }
    
    const sampling_plan = Buffer.from(sampling_plan_data).toString('base64');

    // Store audit plan
    const auditPlan = {
      audit_id,
      election_id,
      reported_tallies,
      risk_limit_alpha,
      audit_type,
      stratification,
      initial_sample_size,
      sampling_plan,
      margin,
      total_votes,
      status: 'planned',
      created_at: new Date().toISOString()
    };

    audits.set(audit_id, auditPlan);

    // Response with status 240 Audited
    res.status(240).json({
      audit_id,
      initial_sample_size,
      sampling_plan,
      test: 'kaplan-markov',
      status: 'planned'
    });

  } catch (error) {
    console.error('Error creating audit plan:', error);
    res.status(500).json({
      error: 'Internal server error during audit planning'
    });
  }
});

export default router;
