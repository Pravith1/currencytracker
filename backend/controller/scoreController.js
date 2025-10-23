const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// GET /score_display?rollNo=123
router.get('/score_display', async (req, res) => {
  try {
    const rollNo = req.query.rollNo;
    if (!rollNo) return res.status(400).json({ error: "query param 'rollNo' required" });

    // Check if rollNo belongs to a team
    const team = await Team.findOne({ members: rollNo });
    if (team) {
      return res.json({ teamId: team._id, score: team.score, members: team.members });
    }

    return res.status(404).json({ error: 'rollNo not found in any team' });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// PUT /score_add
// body: { "roll.no": "123", "change": 5 }
router.put('/score_add', async (req, res) => {
  try {
    const rollNo = req.body.rollNo;
    const change = parseInt(req.body.change, 10);
    if (!rollNo || Number.isNaN(change)) return res.status(400).json({ error: 'invalid payload' });

    // If rollNo belongs to a team, update team score
    const team = await Team.findOne({ members: rollNo });
    if (!team) return res.status(404).json({ error: 'rollNo not found in any team' });

    team.score += change;
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

    // If rollNo belongs to a team, update team score
    const team = await Team.findOne({ members: rollNo });
    if (!team) return res.status(404).json({ error: 'rollNo not found in any team' });

    team.score -= Math.abs(change);
    await team.save();
  return res.json({ teamId: team._id, score: team.score });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
