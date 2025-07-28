const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());



// Serve frontend (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite
const db = new sqlite3.Database('./diagnosis.db');

// Create the diagnoses table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    userEmail TEXT,
    studyId TEXT,
    questionIndex INTEGER,
    diagnosis TEXT,
    aiRecommendation TEXT,
    timestamp TEXT
  )
`);

// Submit endpoint
app.post("/submit", (req, res) => {
  const { userId, userEmail, studyId, responses } = req.body;

  const stmt = db.prepare(`
    INSERT INTO diagnoses (userId, userEmail, studyId, questionIndex, diagnosis, aiRecommendation, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  responses.forEach((entry, index) => {
    const timestamp = new Date().toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
    });

    stmt.run(
      userId,
      userEmail || null,
      studyId,
      index,
      entry.answer,
      entry.aiRecommendation || null,
      timestamp
    );
  });

  stmt.finalize(err => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

// Get all results
app.get('/results', (req, res) => {
  db.all('SELECT * FROM diagnoses ORDER BY userId, questionIndex', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Filter
app.get('/filter', (req, res) => {
  const { userId, studyId } = req.query;
  let query = 'SELECT * FROM diagnoses WHERE 1=1';
  const params = [];

  if (userId) {
    query += ' AND userId = ?';
    params.push(userId);
  }

  if (studyId) {
    query += ' AND studyId = ?';
    params.push(studyId);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Export CSV
app.get('/export', (req, res) => {
  const filePath = path.join(__dirname, 'diagnosis_export.csv');
  const header = 'userId,userEmail,studyId,questionIndex,diagnosis,aiRecommendation,timestamp\n';

  db.all('SELECT * FROM diagnoses ORDER BY userId, questionIndex', (err, rows) => {
    if (err) return res.status(500).send('Error generating export.');

    const csv = rows.map(row =>
      `${row.userId},${row.userEmail || ''},${row.studyId},${row.questionIndex},"${row.diagnosis}","${row.aiRecommendation || ''}",${row.timestamp}`
    ).join('\n');

    fs.writeFileSync(filePath, header + csv);
    res.download(filePath);
  });
});

// Clear all data
app.get('/clear', (req, res) => {
  db.run('DELETE FROM diagnoses', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All data cleared ✅' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
