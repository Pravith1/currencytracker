const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

const MAX_SCORE = 240; // Maximum score limit

// GET /score_display?rollNo=123
router.get('/score_display', async (req, res) => {
  try {
    const rollNo = req.query.rollNo;
    if (!rollNo) return res.status(400).json({ error: "query param 'rollNo' required" });

    // Accept either a single rollNo string or an array of rollNos; use the first element
    const rollNoValue = Array.isArray(rollNo) ? rollNo[0] : rollNo;

    // Normalize to uppercase (registration stores members as uppercase)
    const normalizedRollNo = String(rollNoValue).trim().toUpperCase();

    // Check if rollNo belongs to a team (members is an array of roll numbers)
    const team = await Team.findOne({ members: normalizedRollNo });
    if (team) {
      return res.json({ teamId: team._id, score: team.score, members: team.members });
    }

    return res.status(404).json({ error: 'rollNo not found in any team' });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// PUT /score_add
// body: { "rollNo": "123", "change": 5 }
router.put('/score_add', async (req, res) => {
  try {
  const rollNo = req.body.rollNo;
  const change = parseInt(req.body.change, 10);
  if (!rollNo || Number.isNaN(change)) return res.status(400).json({ error: 'invalid payload' });

  // Accept either a single rollNo string or an array of rollNos; use the first element
  const rollNoValue = Array.isArray(rollNo) ? rollNo[0] : rollNo;

  // Normalize to uppercase (registration stores members as uppercase)
  const normalizedRollNo = String(rollNoValue).trim().toUpperCase();

  // If rollNo belongs to a team, update team score
  const team = await Team.findOne({ members: normalizedRollNo });
    if (!team) return res.status(404).json({ error: 'rollNo not found in any team' });

    const newScore = team.score + change;
    
    // Enforce maximum score limit
    if (newScore > MAX_SCORE) {
      return res.status(400).json({ 
        error: `Score cannot exceed ${MAX_SCORE}`,
        currentScore: team.score,
        maxScore: MAX_SCORE 
      });
    }

    team.score = newScore;
    await team.save();
  return res.json({ teamId: team._id, score: team.score });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// PUT /score_subtract
router.put('/score_subtract', async (req, res) => {
  try {
  const rollNo = req.body.rollNo;
  const change = parseInt(req.body.change, 10);
  if (!rollNo || Number.isNaN(change)) return res.status(400).json({ error: 'invalid payload' });

  // Accept either a single rollNo string or an array of rollNos; use the first element
  const rollNoValue = Array.isArray(rollNo) ? rollNo[0] : rollNo;

  // Normalize to uppercase (registration stores members as uppercase)
  const normalizedRollNo = String(rollNoValue).trim().toUpperCase();

  // If rollNo belongs to a team, update team score
  const team = await Team.findOne({ members: normalizedRollNo });
    if (!team) return res.status(404).json({ error: 'rollNo not found in any team' });

    team.score -= Math.abs(change);
    // Score can go below 0 if needed, or add: team.score = Math.max(0, team.score);
    await team.save();  
  return res.json({ teamId: team._id, score: team.score });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// GET /teams - fetch all teams with their members and scores
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find({}).select('members score').lean();
    return res.json({ teams, count: teams.length });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;