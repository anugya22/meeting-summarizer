import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Zap, Loader, Copy, Check, Github, BookOpen, Video } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function MeetingSummarizer() {
  const [isDark, setIsDark] = useState(false);

  // Step 1: Video upload
  const [videoFile, setVideoFile] = useState(null);
  const [showTranscriptUpload, setShowTranscriptUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2: Transcript upload
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');

  // Step 3: Summary
  const [chatMessages, setChatMessages] = useState([]);
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(null);

  const chatEndRef = useRef(null);
  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [chatMessages]);

  // --- Handle video upload ---
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'video/mp4') setVideoFile(file);
  };

  // --- Transcribe video (mocked / backend) ---
  const handleTranscribeAndSummarize = async () => {
    if (!videoFile) return;
    setLoading(true);
    setChatMessages([]);
    setSummary('');
    // Simulate transcription processing
    setTimeout(() => {
      setShowTranscriptUpload(true);
      setLoading(false);
    }, 2000);
  };

  // --- Handle transcript file upload ---
  const handleTranscriptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTranscriptText(reader.result);
    reader.readAsText(file);
    setTranscriptFile(file);
  };

  // --- Summarize transcript ---
  const handleSummarize = async () => {
    if (!transcriptText) return;
    setLoading(true);
    setChatMessages([]);
    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptText }),
      });
      if (!res.ok) throw new Error('Failed to generate summary');

      const out = await res.json();
      const content = out.content || out.summary || 'No summary generated';

      // simulate chat typing
      let i = 0;
      const interval = setInterval(() => {
        if (i <= content.length) {
          setChatMessages([{ role: 'assistant', content: content.slice(0, i) }]);
          i += 10;
        } else {
          clearInterval(interval);
          setSummary(content);
        }
      }, 50);

      setShowTranscriptUpload(false); // hide transcript section after summary

    } catch (err) {
      setChatMessages([{ role: 'assistant', content: '❌ Error: ' + err.message }]);
    } finally {
      setLoading(false);
      setTranscriptFile(null);
      setTranscriptText('');
      setVideoFile(null); // optional: reset video after summarization
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const bgColor = isDark ? 'bg-slate-950' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgColor} ${textColor}`}>
      <header className={`${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-between items-center">
          <h1 className="text-5xl font-black text-white">Meeting Summarizer</h1>
          <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-lg bg-white bg-opacity-20 text-white">
            Toggle Theme
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Demo links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a
            href="https://github.com/anugya22/meeting-summarizer"
            target="_blank" rel="noopener noreferrer"
            className={`group flex items-center justify-center space-x-3 px-8 py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700' : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800'}`}
          >
            <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
              <Github className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-lg">View on GitHub</div>
              <div className="text-white/70 text-sm">Source code & repository</div>
            </div>
          </a>

          <a
            href="https://meeting-summarizer-doc.vercel.app/"
            target="_blank" rel="noopener noreferrer"
            className="group flex items-center justify-center space-x-3 px-8 py-6 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-lg">Documentation</div>
              <div className="text-white/80 text-sm">Setup & usage guide</div>
            </div>
          </a>

          <a
            href="https://drive.google.com/file/d/1uPoLhFF1G1QXS3M1_CxhW7Z71B9qcUfR/view?usp=sharing"
            target="_blank" rel="noopener noreferrer"
            className="group flex items-center justify-center space-x-3 px-8 py-6 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-lg">Watch Demo</div>
              <div className="text-white/80 text-sm">See it in action</div>
            </div>
          </a>
        </div>

        {/* ⚠️ Notice: Backend not deployed */}
        <div className="w-full rounded-xl p-4 bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-100 font-medium text-center mb-8">
        ⚠️ Note: This is just the UI interface. Backend API is not deployed. This is just for submitting the Assignment LINKs and UI interface check.
        </div>

        {/* Step 1: Video upload */}
        {!showTranscriptUpload && (
          <div className={`${cardBg} rounded-3xl p-8 border ${borderColor} shadow-xl`}>
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-blue-500" /> Upload Meeting Video
            </h2>
            <input type="file" accept=".mp4" onChange={handleVideoUpload} className="hidden" id="videoUpload" />
            <label htmlFor="videoUpload" className="w-full cursor-pointer h-36 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-lg font-semibold">Click to upload video (.mp4)</span>
            </label>

            {videoFile && (
              <button
                onClick={handleTranscribeAndSummarize}
                disabled={loading}
                className="mt-5 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-2xl hover:shadow-lg transition-all transform hover:scale-[1.02]"
              >
                {loading ? <Loader className="animate-spin inline-block w-5 h-5 mr-2" /> : 'Transcribe & Summarize'}
              </button>
            )}
          </div>
        )}

        {/* Step 2: Upload transcript */}
        {showTranscriptUpload && (
          <div className={`${cardBg} rounded-3xl p-8 border ${borderColor} shadow-xl`}>
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-500" /> Upload Transcript
            </h2>
            <input type="file" accept=".txt" onChange={handleTranscriptUpload} className="hidden" id="transcriptUpload" />
            <label htmlFor="transcriptUpload" className="w-full cursor-pointer h-36 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-lg font-semibold">Click to upload transcript (.txt)</span>
            </label>

            {transcriptText && (
              <button
                onClick={handleSummarize}
                disabled={loading}
                className="mt-5 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-2xl hover:shadow-lg transition-all transform hover:scale-[1.02]"
              >
                {loading ? <Loader className="animate-spin inline-block w-5 h-5 mr-2" /> : 'Summarize Transcript'}
              </button>
            )}
          </div>
        )}

        {/* Chat-style summary */}
        {chatMessages.length > 0 && (
          <div className={`${cardBg} rounded-2xl p-6 border ${borderColor} shadow-lg space-y-4`}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${msg.role === 'assistant' ? 'bg-blue-50 dark:bg-blue-900 text-slate-900 dark:text-white' : 'bg-gray-100 dark:bg-slate-800'}`}>
                {msg.content}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Final summary copy */}
        {summary && (
          <div className={`${cardBg} rounded-2xl p-6 border ${borderColor} shadow-lg`}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" /> Summary</h2>
              <button onClick={() => copyToClipboard(summary, 'summary')} className={`p-2 rounded-lg ${copied === 'summary' ? 'bg-green-100 dark:bg-green-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {copied === 'summary' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>
        )}

      </main>
    </div>
  );
}
