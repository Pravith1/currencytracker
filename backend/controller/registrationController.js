const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// POST /api/registrations
router.post('/', async (req, res) => {
  try {
    const { rollNo } = req.body;

    // Validate input
    if (!rollNo || !Array.isArray(rollNo) || rollNo.length === 0) {
      return res.status(400).json({ error: 'rollNo array is required' });
    }

    // Normalize roll numbers
    const teamMembers = rollNo
      .map(r => String(r).trim().toUpperCase()) // normalize
      .filter(Boolean);

    if (teamMembers.length === 0) {
      return res.status(400).json({ error: 'No valid roll numbers provided' });
    }

    // Compute a unique key for the team (sorted members concatenated)
    const membersKey = teamMembers.sort().join('_');

    // Check if a team with any of these members already exists
    const existing = await Team.findOne({
      $or: [
        { membersKey }, // exact same team
        { members: { $in: teamMembers } } // any member already in another team
      ]
    });

    if (existing) {
      return res.status(200).json({
        added: [],
        existed: teamMembers
      });
    }

    // Create new team
    const newTeam = new Team({
      members: teamMembers,
      membersKey,
      score: 40
    });

    await newTeam.save();

    return res.status(200).json({
      added: [{ members: teamMembers, teamId: newTeam._id }],
      existed: []
    });

  } catch (err) {
    console.error('Registration error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
