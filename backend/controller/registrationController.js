const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// POST /api/registrations
router.post('/', async (req, res) => {
  try {
    let { rollNo } = req.body || {};
    if (!rollNo) return res.status(400).json({ error: 'rollNo is required' });

    // Normalize input to array and convert to lowercase
    const rollArr = Array.isArray(rollNo) ? rollNo : [rollNo];
    const normalized = rollArr.map(r => String(r).trim().toLowerCase()).filter(Boolean);
    if (normalized.length === 0)
      return res.status(400).json({ error: 'no valid rollNo provided' });

    const added = [];
    const existed = [];

    for (const rn of normalized) {
  try {
    const result = await Team.updateOne(
      { members: rn },                  // filter: find any team with this member
      { $setOnInsert: { members: [rn], score: 0 } }, // insert if not exists
      { upsert: true }
    );

    if (result.upsertedCount || result.upserted) {
      added.push({ rollNo: rn, teamId: result.upsertedId?._id || null });
    } else {
      const existing = await Team.findOne({ members: rn });
      existed.push({ rollNo: rn, teamId: existing._id });
    }

  } catch (err) {
    console.error('Error adding rollNo', rn, err);
  }
}
    return res.status(200).json({ added, existed });
  } catch (err) {
    console.error('Registration error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
