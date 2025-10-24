const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const { spawnSync } = require('child_process');

// Usage:
//   node importTeamsFromExcel.js           -> writes backend/data/teams.json
//   node importTeamsFromExcel.js --seed    -> writes teams.json and runs seedTeams.js to insert into DB

const workbookPath = path.join(__dirname, 'sample.xlsx');
const outPath = path.join(__dirname, 'data', 'teams.json');

function readExcel(filePath) {
	if (!fs.existsSync(filePath)) throw new Error(`Excel file not found: ${filePath}`);
	const wb = xlsx.readFile(filePath, { cellText: false, cellDates: true });
	const sheetName = wb.SheetNames[0];
	const sheet = wb.Sheets[sheetName];
	const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true });
	return rows;
}

function rowsToTeams(rows) {
	const teams = [];
	for (const row of rows) {
		if (!Array.isArray(row)) continue;
		// collect non-empty cells as strings
		const members = row
			.map((cell) => {
				if (cell === null || cell === undefined) return null;
				const s = String(cell).trim();
				return s === '' ? null : s;
			})
			.filter(Boolean);

		if (members.length === 0) continue;
		teams.push({ members, score: 0 });
	}
	return teams;
}

function writeTeamsFile(teams, filePath) {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(teams, null, 2), 'utf8');
}

function normalizeMembers(members) {
	return members.map((m) => String(m).trim()).filter(Boolean).sort();
}

async function seedIfRequested(teams) {
	const shouldSeed = process.argv.includes('--seed');
	if (!shouldSeed) return;

	// load env
	require('dotenv').config({ path: path.join(__dirname, '.env') });
	const Team = require('./models/Team');

	if (!process.env.MONGODB_URI) {
		console.error('MONGODB_URI not set in backend/.env — cannot seed DB');
		process.exit(1);
	}

	console.log('Connecting to MongoDB for upsert seeding...');
	try {
		await mongoose.connect(process.env.MONGODB_URI);
	} catch (err) {
		console.error('MongoDB connection error:', err.message || err);
		process.exit(1);
	}

	let inserted = 0;
	let updated = 0;

	for (const t of teams) {
		const members = normalizeMembers(t.members || []);
		if (members.length === 0) continue;

		// filter matches exact set: members contains all and length equals
		const filter = {
			$and: [
				{ members: { $all: members } },
				{ $expr: { $eq: [{ $size: '$members' }, members.length] } },
			],
		};

		const res = await Team.updateOne(filter, { $set: { members, score: t.score || 0 } }, { upsert: true });
		if (res.upsertedCount || res.upsertedId) inserted += 1;
		else if (res.matchedCount && res.modifiedCount) updated += 1;
		else if (res.matchedCount && !res.modifiedCount) {
			// matched but no change
		}
	}

	console.log(`Seeding complete — inserted: ${inserted}, updated: ${updated}`);
	await mongoose.disconnect();
}

function loadExistingTeams(filePath) {
	if (!fs.existsSync(filePath)) return [];
	try {
		const raw = fs.readFileSync(filePath, 'utf8');
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed;
	} catch (err) {
		// ignore and return empty
	}
	return [];
}

async function main() {
	try {
		console.log('Reading Excel:', workbookPath);
		const rows = readExcel(workbookPath);
		const imported = rowsToTeams(rows);
		console.log(`Found ${imported.length} teams in Excel`);

		// merge with existing teams.json by exact members set
		const existing = loadExistingTeams(outPath);
		const map = new Map();

		// helper key: normalized members joined
		const keyFor = (members) => normalizeMembers(members).join('|');

		for (const t of existing) {
			const key = keyFor(t.members || []);
			if (!key) continue;
			map.set(key, { members: normalizeMembers(t.members || []), score: t.score || 0 });
		}

		for (const t of imported) {
			const members = normalizeMembers(t.members || []);
			if (members.length === 0) continue;
			const key = members.join('|');
			// upsert: override score if present in import, otherwise keep existing
			map.set(key, { members, score: t.score || 0 });
		}

		const merged = Array.from(map.values());
		writeTeamsFile(merged, outPath);
		console.log(`Wrote ${merged.length} teams to`, outPath);

		await seedIfRequested(merged);
	} catch (err) {
		console.error('Error importing teams from Excel:', err.message);
		process.exit(1);
	}
}

if (require.main === module) main();

