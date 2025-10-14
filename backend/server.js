import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'; // We'll call Whisper CLI

const app = express();
const PORT = 5000;

// Setup multer for file upload
const upload = multer({ dest: 'uploads/' });

app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = path.join(__dirname, req.file.path);

  // Call Whisper CLI (make sure whisper is installed: pip install openai-whisper)
  exec(`whisper "${filePath}" --model small --language en --output_format txt`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Whisper transcription failed' });
    }

    // Whisper saves .txt in the same folder
    const txtFile = filePath.replace(path.extname(filePath), '.txt');
    const transcript = fs.readFileSync(txtFile, 'utf-8');

    // Cleanup
    fs.unlinkSync(filePath);
    fs.unlinkSync(txtFile);

    res.json({ text: transcript });
  });
});

app.listen(PORT, () => console.log(`Whisper backend running on http://localhost:${PORT}`));
