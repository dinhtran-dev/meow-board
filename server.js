const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'public', 'data.json');

app.use(cors());
app.use(express.json());

// GET /api/tasks - Read tasks from data.json
app.get('/api/tasks', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data.json:', err);
      return res.status(500).json({ error: 'Failed to read tasks' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      res.status(500).json({ error: 'Failed to parse tasks' });
    }
  });
});

// POST /api/tasks - Write tasks to data.json
app.post('/api/tasks', (req, res) => {
  const tasks = req.body;
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Invalid tasks data' });
  }

  fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing data.json:', err);
      return res.status(500).json({ error: 'Failed to save tasks' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Meow Board Backend running at http://localhost:${PORT}`);
});
