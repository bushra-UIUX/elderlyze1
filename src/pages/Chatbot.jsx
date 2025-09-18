import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../Assets/Css/Chatbot.css';
import { Send, Wand2, HeartHandshake, SmilePlus, User } from 'lucide-react';
import logo from '../Assets/Images/Logo.png';

// Detect Urdu vs English
function detectLanguage(text) {
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const urduHints = /(آپ|کیسے| کیوں|اداس|خوش|ٹھیک|السلام|صبح بخیر|شام بخیر)/i;
  if (hasArabic || urduHints.test(text)) return 'ur';
  return 'en';
}

// Extract first emoji (basic range)
function extractEmoji(text) {
  const match = (text || '').match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  return match ? match[0] : '';
}

// Build system prompt for model
function buildSystemPrompt(moodEmoji, preferredLang) {
  const moodLine = moodEmoji
    ? `User mood emoji: ${moodEmoji}. Interpret and adapt tone with empathy.`
    : 'No emoji given.';

  const common = `You are Elderlyze Companion, a warm and mature companion for older adults (40+). 
Your role is to sound like a caring elder or close friend. 
Be gentle, empathetic, natural, and conversational.`;

  const bilingual = `Always reply in the same language as the user (Urdu or English). 
Never mix languages.`;

  const style = `Replies should be short (3–4 sentences):
1) Acknowledge feelings softly. 
2) Offer one gentle suggestion (reflection, gratitude, memory, prayer, routine, stretching, tea, journaling). 
3) End with a natural follow-up question.`;

  const emojiGuide = `If an emoji is present, interpret it (sadness, anger, calm, gratitude, etc.) and adapt your guidance naturally.`;
  const support = `Provide explicit emotional support and reassurance. If the user asks how you help, say you can listen with empathy, reflect feelings, and suggest small gentle steps.`;
  const identity = `If the user asks who you are or your name, begin with: 
 English: "I’m Elderlyze Companion." 
 Urdu: "میں ایلڈر لائز کمپینین ہوں۔" Then continue in the same caring tone.`;

  const examples = `Example tone:
EN: "I can sense the weight on your heart. Sometimes a kind memory helps. Which one comes to mind now?"
UR: "میں محسوس کرتا ہوں کہ آپ کے دل پر بوجھ ہے۔ کبھی ایک خوشگوار یاد دل کو ہلکا کر دیتی ہے۔ اس وقت آپ کو کون سی یاد آ رہی ہے؟"`;

  const langPref = preferredLang === 'ur' ? 'Respond strictly in Urdu.' : 'Respond strictly in English.';

  return `${common}\n${bilingual}\n${style}\n${emojiGuide}\n${support}\n${identity}\n${examples}\n${moodLine}\n${langPref}`;
}

function Chatbot() {
  const location = useLocation();
  const initialMood = location.state?.mood || '';

  const DEFAULT_MESSAGES = [
    { id: 1, role: 'bot', text: 'Hello, my friend. I’m here with you. How are you feeling today?' },
  ];

  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [preferredLang, setPreferredLang] = useState('en');
  const [apiKey, setApiKey] = useState(() => {
    const envKey = process.env.REACT_APP_TOGETHER_API_KEY || process.env.TOGETHER_API_KEY || '';
    if (envKey) return envKey;
    try { return localStorage.getItem('together_api_key') || ''; } catch (_) { return ''; }
  });

  // Threads
  const [threads, setThreads] = useState(() => {
    const id = Date.now();
    return [{ id, title: '', messages: DEFAULT_MESSAGES, updatedAt: Date.now() }];
  });
  const [activeThreadId, setActiveThreadId] = useState(() => threads[0].id);

  const listRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleSetApiKey() {
    const next = window.prompt('Enter Together API Key');
    if (typeof next === 'string') {
      const trimmed = next.trim();
      try { localStorage.setItem('together_api_key', trimmed); } catch (_) {}
      setApiKey(trimmed);
    }
  }

  function commitActiveThread(updatedMessages, titleCandidate) {
    setThreads((prev) => prev.map((th) => {
      if (th.id !== activeThreadId) return th;
      const nextTitle = th.title || (titleCandidate || '').trim();
      return { ...th, title: nextTitle, messages: updatedMessages, updatedAt: Date.now() };
    }));
  }

  // Auto-send initial mood if passed
  useEffect(() => {
    if (initialMood) {
      const userText = `I feel ${initialMood}`;
      const userMsg = { id: Date.now(), role: 'user', text: userText };
      const typingMsg = { id: Date.now() + 0.5, role: 'bot', text: 'Thinking…', typing: true };
      setMessages((m) => [...m, userMsg, typingMsg]);
      (async () => {
        setPending(true);
        const reply = await generateReply([...messages, userMsg], userText);
        setMessages((m) => {
          const withoutTyping = m.filter((x) => !x.typing);
          const nextMessages = [...withoutTyping, { id: Date.now() + 1, role: 'bot', text: reply }];
          // persist in thread with title from first user message
          commitActiveThread(nextMessages, userText);
          return nextMessages;
        });
        setPending(false);
      })();
    }
  }, [initialMood]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate reply from Together
  async function generateReply(history, userText) {
    const lang = detectLanguage(userText);
    setPreferredLang(lang);

    const emojiInText = extractEmoji(userText) || initialMood || '';
    let system = buildSystemPrompt(emojiInText, lang);
    // If the first turn is emoji-based, instruct the model to avoid asking questions
    const userTurns = history.filter((m) => m.role === 'user').length;
    const isFirstEmojiTurn = userTurns <= 1 && !!emojiInText && (!userText.replace(emojiInText, '').trim() || /^I\s*feel\s*$/i.test(userText.replace(emojiInText, '').trim()));
    if (isFirstEmojiTurn) {
      system += `\nFirst turn policy: If the first user input is only an emoji or 'I feel [emoji]', do NOT ask the user to share more. Provide 2–3 short, supportive sentences tailored to the emoji (acknowledge + one practical micro-step). No questions in this first reply.`;
    }

    if (!apiKey) {
      // Minimal fallback only if API missing
      return lang === 'ur'
        ? 'میں آپ کے ساتھ ہوں۔ کیا آپ مزید بانٹنا چاہیں گے؟'
        : 'I’m here with you. Would you like to share a bit more?';
    }

    try {
      const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: system },
            ...history.map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: userText }
          ],
          temperature: 0.8,
          max_tokens: 350,
          top_p: 0.9
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const content = (json?.choices?.[0]?.message?.content || '').trim();
      if (content) return content;
      // Fallback if model returns empty; avoid questions on first emoji turn
      return isFirstEmojiTurn
        ? (lang === 'ur' ? 'میں آپ کے ساتھ ہوں۔ آہستہ سانس لیں، پانی پئیں، اور پرسکون بیٹھیں۔' : 'I’m here with you. Take a slow breath, sip water, and sit comfortably.')
        : (lang === 'ur' ? 'میں سن رہا ہوں۔ کیا آپ تھوڑا اور بتانا چاہیں گے؟' : 'I’m listening. Would you like to share more?');
    } catch (err) {
      console.error('Together AI error', err);
      return lang === 'ur'
        ? 'معذرت، کچھ مسئلہ آ گیا ہے۔ دوبارہ کوشش کریں۔'
        : 'Sorry, something went wrong. Please try again.';
    }
  }

  // Handle user send
  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    const typingMsg = { id: Date.now() + 0.5, role: 'bot', text: (preferredLang === 'ur' ? 'سوچ رہا ہوں…' : 'Thinking…'), typing: true };
    setMessages((m) => [...m, userMsg, typingMsg]);
    setInput('');
    setPending(true);
    const reply = await generateReply([...messages, userMsg], trimmed);
    setMessages((m) => {
      const withoutTyping = m.filter((x) => !x.typing);
      const nextMessages = [...withoutTyping, { id: Date.now() + 1, role: 'bot', text: reply }];
      // persist into the active thread; set title if empty based on first user message
      commitActiveThread(nextMessages, trimmed);
      return nextMessages;
    });
    setPending(false);
  }

  function startNewChat() {
    const newId = Date.now();
    setThreads((t) => [...t, { id: newId, title: '', messages: DEFAULT_MESSAGES, updatedAt: Date.now() }]);
    setActiveThreadId(newId);
    setMessages(DEFAULT_MESSAGES);
    setInput('');
    setPreferredLang('en');
  }

  return (
    <main className="chat">
      <header className="chat-header">
        <div className="chat-header-left">
          <img src={logo} className="chat-logo" alt="Elderlyze" />
          <div>
            <div className="chat-title">Elderlyze</div>
            <div className="chat-status">Online • gentle support</div>
          </div>
        </div>
        <div className="chat-header-right">
          <span className="chip online">● Live</span>
          <button className="btn btn-ghost" onClick={handleSetApiKey} title={apiKey ? 'Change API key' : 'Set API key'}>
            {apiKey ? 'Change API key' : 'Set API key'}
          </button>
          <button className="btn btn-ghost mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        </div>
      </header>

      <div className="chat-layout">
        {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)}></div>}
        
        {/* Sidebar */}
        <aside className={`chat-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="chat-sidebar-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Recent chats</span>
            <button className="btn btn-ghost" onClick={startNewChat}>+ New</button>
          </div>
          <nav className="chat-nav">
            {threads
              .slice()
              .sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0))
              .slice(0, 12)
              .map((th) => (
              <div
                key={th.id}
                className="chat-nav-item"
                onClick={() => {
                  setActiveThreadId(th.id);
                  setMessages(Array.isArray(th.messages) && th.messages.length ? th.messages : DEFAULT_MESSAGES);
                  setSidebarOpen(false);
                }}
              >
                {(th.title || 'New chat').slice(0, 40)}
              </div>
            ))}
            {threads.length === 0 && <div className="chat-nav-item">No chats yet</div>}
          </nav>
        </aside>

        {/* Main chat */}
        <section className="chat-main">
          <div className="chat-actions">
            <button className="chip action" type="button" onClick={() => setInput(preferredLang === 'ur' ? 'کیا آپ مجھے ایک سادہ سانس کی مشق بتائیں گے؟' : 'Could you guide me through a simple breathing exercise?')}>
              <Wand2 size={14} /> Breathing
            </button>
            <button className="chip action" type="button" onClick={() => setInput(preferredLang === 'ur' ? 'مجھے ایک آسان گراؤنڈنگ مشق بتائیں' : 'Share a simple grounding exercise.')}>
              <HeartHandshake size={14} /> Grounding
            </button>
            <button className="chip action" type="button" onClick={() => setInput(preferredLang === 'ur' ? 'میں شکرگزاری کی ایک مشق چاہتا/چاہتی ہوں' : 'I’d like a short gratitude prompt.')}>
              <SmilePlus size={14} /> Gratitude
            </button>
          </div>

          <div ref={listRef} className="chat-messages">
            {messages.map((m) => (
              <div key={m.id} className={`chat-row ${m.role}`}>
                {m.role === 'bot' && <div className="avatar bot">🤖</div>}
                <div className={`chat-bubble ${m.role}${m.typing ? ' typing' : ''}`}>{m.text}</div>
                {m.role === 'user' && <div className="avatar user"><User size={16} /></div>}
              </div>
            ))}
          </div>

          <form className="chat-inputbar" onSubmit={handleSend}>
            <input
              type="text"
              placeholder={preferredLang === 'ur' ? 'یہاں لکھیں…' : 'Write a message…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={pending}>
              <Send size={16} /> {pending ? (preferredLang === 'ur' ? '... بھیج رہا ہوں' : 'Sending...') : 'Send'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Chatbot;
