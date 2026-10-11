import { useState, useEffect } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import "prismjs/components/prism-python"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-java"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"
import axios from 'axios'
import './App.css'

const CodeEditor = Editor.default?.default || Editor.default || Editor;
const ReactMarkdown = Markdown.default || Markdown;

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: 'main.js', icon: '🟨' },
  { id: 'python', name: 'Python', ext: 'script.py', icon: '🐍' },
  { id: 'cpp', name: 'C++', ext: 'app.cpp', icon: '⚙️' },
  { id: 'java', name: 'Java', ext: 'Main.java', icon: '☕' },
  { id: 'c', name: 'C', ext: 'program.c', icon: '⚡' },
];

const STARTER_CODE = {
  javascript: `function fetchUserData(userId) {
  let data = fetch('/api/user/' + userId).then(res => res.json());
  if (data == null) {
    console.log("No data");
  }
  return data;
}`,
  python: `def process_user_orders(user_id, orders=[]):
    total = 0
    for i in range(len(orders)):
        if orders[i]['status'] == 'completed':
            total += orders[i]['price']
    print("Total order price: " + str(total))
    return total`,
  cpp: `#include <iostream>
#include <vector>

class Buffer {
public:
    int* data;
    Buffer(int size) {
        data = new int[size];
    }
    void printFirst() {
        std::cout << data[0] << std::endl;
    }
};

int main() {
    Buffer b(10);
    b.printFirst();
    return 0;
}`,
  java: `public class OrderManager {
    private String orderId;

    public void processOrder(String id) {
        if (id.equals(orderId)) {
            System.out.println("Processing order: " + id);
        }
    }
}`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void process_str(char *input) {
    char buffer[16];
    strcpy(buffer, input);
    printf("Buffer output: %s\\n", buffer);
}

int main() {
    process_str("This string is way too long for the buffer!");
    return 0;
}`
};

function App() {
  const [ language, setLanguage ] = useState('javascript')
  const [ code, setCode ] = useState(STARTER_CODE.javascript)
  const [ review, setReview ] = useState(``)
  const [ loading, setLoading ] = useState(false)
  const [ copied, setCopied ] = useState(false)
  const [ customApiKey, setCustomApiKey ] = useState(() => localStorage.getItem('code_review_x_api_key') || '')
  const [ isModalOpen, setIsModalOpen ] = useState(false)
  const [ modalKeyInput, setModalKeyInput ] = useState('')
  const [ showKeySecret, setShowKeySecret ] = useState(false)
  const [ keyStatusMessage, setKeyStatusMessage ] = useState('')
  const [ isKeyErrorNotice, setIsKeyErrorNotice ] = useState(false)

  useEffect(() => {
    prism.highlightAll()
  }, [language, code])

  const handleLanguageChange = (langId) => {
    setLanguage(langId)
    setCode(STARTER_CODE[langId] || '')
  }

  const handleReset = () => {
    setCode(STARTER_CODE[language] || '')
  }

  const handleClear = () => {
    setCode('')
  }

  const handleCopyReview = () => {
    if (!review) return;
    navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const openKeyModal = () => {
    setModalKeyInput(customApiKey)
    setKeyStatusMessage('')
    setIsModalOpen(true)
  }

  const saveCustomKey = () => {
    const trimmed = modalKeyInput.trim()
    if (!trimmed) {
      localStorage.removeItem('code_review_x_api_key')
      setCustomApiKey('')
      setKeyStatusMessage('Custom key removed. The app will use server environment key.')
      setTimeout(() => {
        setIsModalOpen(false)
        setKeyStatusMessage('')
      }, 1200)
      return
    }
    localStorage.setItem('code_review_x_api_key', trimmed)
    setCustomApiKey(trimmed)
    setIsKeyErrorNotice(false)
    setKeyStatusMessage('✓ Key saved locally in your browser!')
    setTimeout(() => {
      setIsModalOpen(false)
      setKeyStatusMessage('')
    }, 900)
  }

  const clearSavedKey = () => {
    localStorage.removeItem('code_review_x_api_key')
    setCustomApiKey('')
    setModalKeyInput('')
    setKeyStatusMessage('Key cleared.')
    setTimeout(() => {
      setIsModalOpen(false)
      setKeyStatusMessage('')
    }, 1000)
  }

  async function reviewCode() {
    if (loading || !code.trim()) return;
    setLoading(true);
    setReview('');
    setIsKeyErrorNotice(false);

    try {
      const payload = { 
        prompt: code, 
        code: code, 
        language: language,
        apiKey: customApiKey ? customApiKey.trim() : undefined
      };
      const axiosConfig = {
        headers: customApiKey ? { 'x-gemini-key': customApiKey.trim() } : {}
      };

      let response;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        try {
          response = await axios.post('/ai/get-review', payload, axiosConfig);
        } catch (proxyErr) {
          response = await axios.post('http://localhost:3000/ai/get-review', payload, axiosConfig);
        }
      } else {
        try {
          response = await axios.post('/ai/get-review', payload, axiosConfig);
        } catch (postErr) {
          if (postErr.response?.status === 404) {
            try {
              response = await axios.post('/api/get-review', payload, axiosConfig);
            } catch (err2) {
              if (err2.response?.status === 404) {
                response = await axios.post('/api', payload, axiosConfig);
              } else {
                throw err2;
              }
            }
          } else {
            throw postErr;
          }
        }
      }
      setReview(response.data);
    } catch (err) {
      console.error(err);
      const is401 = err.response?.status === 401;
      const needKey = err.response?.data?.needKey;
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;

      if (is401 || needKey || (typeof errMsg === 'string' && (errMsg.includes('GOOGLE_GEMINI_KEY') || errMsg.includes('Gemini API key') || errMsg.includes('Missing')))) {
        setIsKeyErrorNotice(true);
        setReview(errMsg || 'Missing or invalid Google Gemini API Key.');
      } else if (typeof errMsg === 'string' && (errMsg.includes('Network Error') || err.code === 'ERR_NETWORK')) {
        setReview("### 🔌 Backend Server Not Connected\n\nMake sure the backend server is running on port 3000:\n```bash\ncd BACKEND\nnode Server.js\n```");
      } else {
        setReview("### ❌ Error Requesting Review\n\n" + (typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)));
      }
    } finally {
      setLoading(false);
    }
  }

  const currentLangObj = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];
  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code ? code.length : 0;

  const getGrammar = (langId) => {
    if (langId === 'python') return prism.languages.python;
    if (langId === 'cpp') return prism.languages.cpp;
    if (langId === 'java') return prism.languages.java;
    if (langId === 'c') return prism.languages.c;
    return prism.languages.javascript;
  }

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <span className="brand-title">CodeReviewX</span>
          <span className="brand-badge">Gemini 2.0</span>
        </div>

        {/* Multi-Language Bar */}
        <div className="language-selector">
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => handleLanguageChange(lang.id)}
              className={`lang-btn ${language === lang.id ? 'active' : ''}`}
            >
              <span>{lang.icon}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>

        {/* Header Controls */}
        <div className="header-actions">
          <button 
            className={`btn-key ${customApiKey ? 'btn-key-active' : ''}`}
            onClick={openKeyModal}
            title={customApiKey ? "Custom Gemini API Key active (click to configure)" : "Configure Gemini API Key"}
          >
            <span className={`key-dot ${customApiKey ? 'dot-active' : ''}`}></span>
            <span>🔑 {customApiKey ? 'Key Active' : 'API Key'}</span>
          </button>

          <button className="btn-secondary" onClick={handleReset} title="Load sample code">
            ↻ Reset Sample
          </button>
          <button className="btn-secondary" onClick={handleClear} title="Clear editor">
            🗑 Clear
          </button>
          <button 
            className="btn-primary" 
            onClick={reviewCode} 
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                <span>Reviewing...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Run Review</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="main-content">
        {/* Left Panel: Code Editor */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>📝</span>
              <span>Source Code</span>
              <span className="file-badge">{currentLangObj.ext}</span>
            </div>
            <div className="stats-badge">
              {lineCount} lines • {charCount} chars
            </div>
          </div>
          <div className="editor-container">
            <CodeEditor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => prism.highlight(code, getGrammar(language), language)}
              padding={16}
              style={{
                fontFamily: '"Fira Code", monospace',
                fontSize: 15,
                minHeight: '100%',
                backgroundColor: '#0c0d14',
                color: '#f3f4f6'
              }}
            />
          </div>
        </div>

        {/* Right Panel: AI Review */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>🔍</span>
              <span>AI Senior Review</span>
              <span className="file-badge">Gemini 2.0 Flash</span>
            </div>
            {review && !isKeyErrorNotice && (
              <button className="copy-btn" onClick={handleCopyReview}>
                {copied ? '✓ Copied!' : '📋 Copy Review'}
              </button>
            )}
          </div>
          <div className="review-container">
            {loading ? (
              <div className="placeholder-state">
                <div className="loading-spinner"></div>
                <p>Senior AI Code Reviewer is analyzing your {currentLangObj.name} code...</p>
              </div>
            ) : isKeyErrorNotice ? (
              <div className="key-error-card">
                <div className="error-card-badge">⚠️ Gemini API Key Needed</div>
                <h3 className="error-card-title">Setup Your Google Gemini API Key</h3>
                <p className="error-card-desc">
                  {review || 'To get AI code reviews, connect your Google Gemini API key. You can get a free key in less than a minute.'}
                </p>
                <div className="error-card-actions">
                  <button className="btn-primary" onClick={openKeyModal}>
                    🔑 Enter Gemini API Key
                  </button>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-secondary external-link"
                  >
                    Get Free Key at Google AI Studio ↗
                  </a>
                </div>
                <div className="error-card-tip">
                  <strong>💡 For Vercel Deployment:</strong> You can also add <code>GOOGLE_GEMINI_KEY</code> in your <strong>Vercel Project Settings → Environment Variables</strong> so visitors don't have to enter their own key.
                </div>
              </div>
            ) : review ? (
              <div className="markdown-body">
                <ReactMarkdown 
                  rehypePlugins={[ rehypeHighlight ]}
                >
                  {review}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="placeholder-state">
                <div className="placeholder-icon">🚀</div>
                <h3>Ready to Audit Your Code</h3>
                <p>Select your language above, edit or paste code, and click <strong>Run Review</strong> for instant AI feedback.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span>🔑</span>
                <h3>Google Gemini API Key</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                Enter your Google Gemini API key. Your key is stored securely in your browser's <code>localStorage</code> and used directly for requests.
              </p>

              <div className="key-input-group">
                <input 
                  type={showKeySecret ? "text" : "password"} 
                  value={modalKeyInput}
                  onChange={e => setModalKeyInput(e.target.value)}
                  placeholder="Paste your Gemini key here (e.g. AIzaSy...)"
                  className="key-input"
                  autoFocus
                />
                <button 
                  type="button" 
                  className="key-toggle-btn"
                  onClick={() => setShowKeySecret(!showKeySecret)}
                  title={showKeySecret ? "Hide key" : "Show key"}
                >
                  {showKeySecret ? "🙈" : "👁️"}
                </button>
              </div>

              {keyStatusMessage && (
                <div className="modal-status-msg">{keyStatusMessage}</div>
              )}

              <div className="modal-hints">
                <div className="hint-item">
                  <span>✨</span>
                  <span>Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get a free Gemini API key at Google AI Studio ↗</a></span>
                </div>
                <div className="hint-item">
                  <span>🔒</span>
                  <span>Keys are stored strictly in your local browser and never exposed to other visitors.</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {customApiKey && (
                <button className="btn-danger" onClick={clearSavedKey}>
                  Remove Key
                </button>
              )}
              <div className="footer-right">
                <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={saveCustomKey}>
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App