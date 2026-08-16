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

  async function reviewCode() {
    if (loading || !code.trim()) return;
    setLoading(true);
    setReview('');
    try {
      const payload = { prompt: code, code: code, language: language };
      let response;
      try {
        response = await axios.post('/ai/get-review', payload);
      } catch (proxyErr) {
        response = await axios.post('http://localhost:3000/ai/get-review', payload);
      }
      setReview(response.data);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message;
      if (errMsg.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setReview("### 🔌 Backend Server Not Connected\n\nMake sure the backend server is running on port 3000:\n```bash\ncd BACKEND\nnode Server.js\n```");
      } else {
        setReview("### ❌ Error Requesting Review\n\n" + errMsg);
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
          <span className="brand-badge">AI 3.5</span>
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
              <span className="file-badge">Gemini 3.5 Flash</span>
            </div>
            {review && (
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
    </div>
  )
}

export default App