const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// POST /api/registrations
router.post('/', async (req, res) => {
  try {
    let { rollNo } = req.body || {};
    if (!rollNo) return res.status(400).json({ error: 'rollNo is required' });

    // Normalize input to array
    const rollArr = Array.isArray(rollNo) ? rollNo : [rollNo];
    const normalized = rollArr.map(r => String(r).trim()).filter(Boolean);
    if (normalized.length === 0)
      return res.status(400).json({ error: 'no valid rollNo provided' });

    const added = [];
    const existed = [];

    for (const rn of normalized) {
      // Check if this rollNo already exists in any team
      const team = await Team.findOne({ members: rn });
      if (team) {
        existed.push({ rollNo: rn, teamId: team._id });
        continue;
      }

      // Create single-member team
      try {
        const newTeam = new Team({ members: [rn], score: 0 });
        await newTeam.save();
        added.push({ rollNo: rn, teamId: newTeam._id });
      } catch (err) {
        // Handle duplicate insert race condition
        if (err.code === 11000) {
          const existing = await Team.findOne({ members: rn });
          if (existing) existed.push({ rollNo: rn, teamId: existing._id });
        } else {
          console.error('Error saving team for', rn, err);
        }
      }
    }

    return res.status(200).json({ added, existed });
  } catch (err) {
    console.error('Registration error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
