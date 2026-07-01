import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");

  const handleProcess = async () => {
    if (!file || !jobDescription) return alert("Please upload both files!");
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("job_description", jobDescription);

    try {
      const res = await axios.post("http://localhost:8000/analyze", form);
      setData(res.data);
    } catch (err) {
      alert("Backend connection error.");
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!input) return;
    const form = new FormData();
    form.append("message", input);
    try {
      const res = await axios.post("http://localhost:8000/chat", form);
      setChat([...chat, { user: input, bot: res.data.reply }]);
      setInput("");
    } catch (err) {
      alert("Coach is temporarily busy.");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>AI Career Hub 🚀</h1>

      {!data ? (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px' }}>
          <h3>Upload Resume & Job Description</h3>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <textarea 
            placeholder="Paste Job Description..." 
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            style={{ width: '100%', height: '150px', marginTop: '15px', padding: '10px' }}
          />
          <button onClick={handleProcess} disabled={loading} style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {loading ? "AI is Working..." : "Analyze Now"}
          </button>
        </div>
      ) : (
        <div>
          <button onClick={() => setData(null)} style={{ marginBottom: '20px' }}>← New Analysis</button>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1, padding: '20px', background: '#f0f9ff', borderRadius: '10px', textAlign: 'center' }}>
              <h2>{data.score}%</h2>
              <p>Match Score</p>
            </div>
            <div style={{ flex: 2, padding: '20px', background: '#fff1f2', borderRadius: '10px' }}>
              <h3>Missing Keywords</h3>
              <p>{data.missing_keywords?.join(", ")}</p>
            </div>
          </div>

          {/* THE REWRITER CARD */}
          <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '10px', border: '1px solid #fcd34b' }}>
            <h3>✨ AI Resume Optimization</h3>
            <p style={{ opacity: 0.7 }}>Original: <span style={{ textDecoration: 'line-through' }}>{data.original_bullet}</span></p>
            <p style={{ fontWeight: 'bold', color: '#059669' }}>Optimized: "{data.rewritten_bullet}"</p>
            <button onClick={() => { navigator.clipboard.writeText(data.rewritten_bullet); alert("Copied!"); }}>📋 Copy for Resume</button>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3>Career Coach Chat 🎤</h3>
            <div style={{ height: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', background: '#f9fafb' }}>
              {chat.map((m, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <strong>You:</strong> {m.user} <br />
                  <strong>AI:</strong> {m.bot}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: 1, padding: '10px' }} placeholder="Ask a question..." />
              <button onClick={handleChat} style={{ padding: '10px 20px' }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;