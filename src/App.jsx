import React, { useState, useRef, useEffect } from 'react';
import { Upload, Settings, Github, FileText, CheckCircle2, Zap, Moon, Sun, Loader, Copy, Check, Send, ExternalLink, BookOpen } from 'lucide-react';

export default function MeetingSummarizer() {
  const [isDark, setIsDark] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [copied, setCopied] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setError('');
    } else {
      setError('Please upload a valid audio file');
    }
  };

  const transcribeAudio = async () => {
    if (!audioFile || !apiKey) {
      setError('Please upload an audio file and add your OpenRouter API key');
      return;
    }

    setLoading(true);
    setError('');
    setChatMessages([]);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);

      const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed. Check your API key and file.');
      }

      const data = await response.json();
      setTranscript(data.text);
      await generateSummary(data.text);
    } catch (err) {
      setError(err.message || 'Error transcribing audio');
      setLoading(false);
    }
  };

  const generateSummary = async (text) => {
    try {
      const prompt = `You are a professional meeting analyst. Analyze the following meeting transcript and provide:

1. A concise summary (2-3 sentences) of the main discussion
2. Key decisions made
3. Action items with owners (if mentioned)

Format your response as JSON with keys: "summary", "keyDecisions", "actionItems"
Action items should be an array of objects with "task", "owner", "deadline" fields.

Transcript:
${text}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-2-7b-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) throw new Error('Summary generation failed');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(content);
        setSummary(parsed.summary || '');
        setActionItems(Array.isArray(parsed.actionItems) ? parsed.actionItems : []);
      } catch {
        setSummary(content);
        setActionItems([]);
      }

      setChatMessages([
        { role: 'assistant', content: '✅ Meeting summarized! You can now ask for custom summaries.' },
      ]);
    } catch (err) {
      setError('Error generating summary: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !transcript) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const prompt = `You are a professional meeting analyst. The user has a meeting transcript and wants you to re-summarize or re-analyze it based on their request.

User Request: ${userMessage}

Transcript:
${transcript}

Provide the analysis in a clear, structured format. If they ask for JSON format with action items, use: {"summary": "...", "keyDecisions": [...], "actionItems": [{task, owner, deadline}, ...]}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-2-7b-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || '';

      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      try {
        const parsed = JSON.parse(assistantMessage);
        if (parsed.summary) setSummary(parsed.summary);
        if (parsed.actionItems) setActionItems(parsed.actionItems);
      } catch {
        // Keep chat content as-is if not JSON
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Error: ' + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Styling variables
  const bgColor = isDark ? 'bg-slate-950' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const inputBg = isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgColor} ${textColor}`}>
      {/* Hero Section */}
      <header className={`${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-white bg-opacity-20'}`}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-black text-white mb-2">Meeting Summarizer</h1>
              <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-white text-opacity-90'}`}>AI-powered transcription with custom LLM prompting</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-3 rounded-lg ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-white bg-opacity-20 text-white'} hover:scale-110 transition-transform text-xl`}
              >
                {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
              <button
                onClick={() => setShowApiModal(true)}
                className={`p-3 rounded-lg ${isDark ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white bg-opacity-20'} text-white hover:shadow-2xl transition-all hover:scale-110`}
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Big Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* GitHub Repo */}
            <a
              href="https://github.com/yourusername/meeting-summarizer"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl bg-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-black rounded-xl group-hover:scale-110 transition-transform">
                  <Github className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">GitHub Repo</h3>
                  <p className="text-slate-600 text-sm">View source code & docs</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
                <ExternalLink className="w-12 h-12" />
              </div>
            </a>

            {/* Documentation */}
            <a
              href="https://github.com/yourusername/meeting-summarizer#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl bg-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-800 opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Documentation</h3>
                  <p className="text-slate-600 text-sm">Setup & usage guide</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
                <ExternalLink className="w-12 h-12" />
              </div>
            </a>

            {/* Demo Video */}
            <a
              href="https://youtu.be/yourdemo"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl bg-red-600 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 p-8 text-white"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-700 to-red-900 opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-4 bg-white rounded-xl group-hover:scale-110 transition-transform">
                  <span className="text-3xl">▶️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Demo Video</h3>
                  <p className="text-red-100 text-sm">See it in action</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                <ExternalLink className="w-12 h-12" />
              </div>
            </a>
          </div>

          <div className={`h-1 rounded-full my-8 ${isDark ? 'bg-slate-700' : 'bg-white bg-opacity-20'}`}></div>
        </div>
      </header>

      {/* API Modal */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
            <h2 className="text-xl font-bold mb-4">Configure OpenRouter API</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
              <p className="mb-2 font-semibold">Get your free API key:</p>
              <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                1. Sign up at openrouter.ai
              </a>
              <p className="mt-2 text-xs">Free models: Llama 2, Mistral, etc. No credit card needed!</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowApiModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}
              >
                Close
              </button>
              <button
                onClick={() => setShowApiModal(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className={`${cardBg} rounded-2xl p-8 border ${borderColor} shadow-lg hover:shadow-xl transition-shadow sticky top-8`}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                Upload Audio
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors mb-4 flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-blue-500" />
                <span className="font-medium">Click to upload</span>
                <span className="text-sm text-gray-500">MP3, WAV, M4A</span>
              </button>

              {audioFile && (
                <div className={`${isDark ? 'bg-slate-800' : 'bg-green-50'} p-3 rounded-lg mb-4 flex items-center gap-2`}>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium truncate">{audioFile.name}</span>
                </div>
              )}

              <button
                onClick={transcribeAudio}
                disabled={!audioFile || loading || !apiKey}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : 'Transcribe & Summarize'}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!apiKey && (
                <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded-lg text-sm">
                  ⚠️ Please set your OpenRouter API key first
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Transcript */}
            {transcript && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderColor} shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Transcript
                  </h2>
                  <button
                    onClick={() => copyToClipboard(transcript, 'transcript')}
                    className={`p-2 rounded-lg transition-colors ${copied === 'transcript' ? 'bg-green-100 dark:bg-green-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {copied === 'transcript' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {transcript}
                </p>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderColor} shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    Summary
                  </h2>
                  <button
                    onClick={() => copyToClipboard(summary, 'summary')}
                    className={`p-2 rounded-lg transition-colors ${copied === 'summary' ? 'bg-green-100 dark:bg-green-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {copied === 'summary' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {summary}
                </p>
              </div>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderColor} shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Action Items
                  </h2>
                </div>
                <div className="space-y-3">
                  {actionItems.map((item, idx) => (
                    <div key={idx} className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} p-3 rounded-lg`}>
                      <div className="font-medium text-sm mb-1">{item.task}</div>
                      {item.owner && <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>👤 {item.owner}</div>}
                      {item.deadline && <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>📅 {item.deadline}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Section */}
            {transcript && (
              <div className={`${cardBg} rounded-2xl border ${borderColor} shadow-lg overflow-hidden flex flex-col h-96`}>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 font-bold">
                  💬 Custom Re-summarization Chat
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-900'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <Loader className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className={`border-t ${borderColor} p-4`}>
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="e.g., 'Summarize as 5 key points'"
                      className={`flex-1 px-3 py-2 rounded-lg border ${borderColor} ${inputBg} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatLoading}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    💡 Try: "Summarize for executives" • "Highlight risks" • "Focus on metrics"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${borderColor} mt-16 py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>
        <p>Built with React & OpenRouter • Powered by Llama 2 • No Backend Needed</p>
      </footer>
    </div>
  );
}
