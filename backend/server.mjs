// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // node-fetch v3+ ESM

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '20mb' }));

// --- Uploads directory ---
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

// --- Health check ---
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- Transcription Endpoint (Upload .txt transcript) ---
app.post('/api/transcribe', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No transcript file provided' });
    const transcript = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);
    return res.json({ text: transcript });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

// --- Summarize Endpoint (Hugging Face BART) ---
app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Missing text' });

    const HF_TOKEN = process.env.HF_API_KEY; // your Hugging Face token

    if (!HF_TOKEN) {
      // Fallback local summary
      const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
      const summary = sentences.slice(0, 3).join('. ') + (sentences.length ? '.' : '');
      return res.json({ content: { summary, keyDecisions: [], actionItems: [] } });
    }

    // Hugging Face BART API call
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Hugging Face API error: ${errText}` });
    }

    const data = await response.json();
    const summary = Array.isArray(data) && data[0]?.summary_text ? data[0].summary_text : 'No summary generated';

    // Since BART doesn’t extract decisions or action items, we mock them
    const keyDecisions = [];
    const actionItems = [];

    return res.json({ content: { summary, keyDecisions, actionItems } });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Summarization error', detail: String(err) });
  }
});

// --- Start server ---
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
