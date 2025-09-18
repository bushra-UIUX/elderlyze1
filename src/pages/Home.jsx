import React from 'react';
import '../Assets/Css/Home.css';
import { useNavigate } from 'react-router-dom';
import { Bot, Smile, Pill, Siren, Languages, PlayCircle, ShieldCheck, Bell, Quote, Users, Shield, Sparkles, Activity } from 'lucide-react';

function Home() {
  const navigate = useNavigate();
  return (
    <main>
      <section id="home" className="hero" role="region" aria-label="Hero">
        <div className="container hero-content">
          <div className="hero-text">
            <div className="eyebrow"><Sparkles size={16} /> Caring technology, human touch</div>
            <h1 className="gradient-title">Elderlyze</h1>
            <p className="tagline">Your Companion for Wellness, Safety, and Care</p>
            <div className="hero-ctas">
              <button className="btn btn-primary btn-lg cta-pulse" onClick={() => window.location.href = '/tutorial'}>Get Started</button>
            </div>
            <div className="metrics">
              <div className="metric"><Users size={16} /> 10k+ supported</div>
              <div className="dot" />
              <div className="metric"><Shield size={16} /> 99.9% uptime</div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="bubble bubble-1">💬</div>
            <div className="bubble bubble-2">💚</div>
            <div className="bubble bubble-3">😊</div>
          </div>
        </div>
      </section>

      <section className="trusted" aria-label="Social proof">
        <div className="container trusted-row">
          <span className="trusted-text">Trusted by families and caregivers</span>
          <div className="trusted-logos">
            <div className="pill">Wellness</div>
            <div className="pill">Healthcare</div>
            <div className="pill">Community</div>
          </div>
        </div>
      </section>

      <section id="features" className="features" role="region" aria-label="Features">
        <div className="container">
          <h2>Features</h2>
          <div className="features-grid">
            <article className="feature-card interactive">
              <div className="icon" aria-hidden="true"><Bot size={24} /></div>
              <h3>Emotional Chatbot</h3>
              <p>Compassionate support in English and Urdu.</p>
            </article>
            <article className="feature-card interactive">
              <div className="icon" aria-hidden="true"><Smile size={24} /></div>
              <h3>Mood Detection</h3>
              <p>Emoji-based mood sensing that prompts helpful chats.</p>
            </article>
            <article className="feature-card interactive">
              <div className="icon" aria-hidden="true"><Pill size={24} /></div>
              <h3>Medicine Reminders</h3>
              <p>Timely push notifications so you never miss a dose.</p>
            </article>
            <article className="feature-card interactive">
              <div className="icon" aria-hidden="true"><Siren size={24} /></div>
              <h3>SOS Alerts</h3>
              <p>Manual alerts and auto-SOS after 3 hours of inactivity (SMS family).</p>
            </article>
            <article className="feature-card interactive">
              <div className="icon" aria-hidden="true"><Languages size={24} /></div>
              <h3>Multi-language Support</h3>
              <p>Seamless Urdu and English responses from the chatbot.</p>
            </article>
            <article className="feature-card interactive">
              <div className="icon" aria-hidden="true"><Activity size={24} /></div>
              <h3>Physical Activities</h3>
              <p>Guided exercises, yoga, meditation and wellness videos.</p>
            </article>
          </div>
        </div>
      </section>



      <section id="how-it-works" className="how" role="region" aria-label="How it works">
        <div className="container">
          <h2>How It Works</h2>
          <ol className="steps" aria-label="Steps to use Elderlyze">
            <li><span className="step-badge">1</span> Sign Up</li>
            <li><span className="step-badge">2</span> Detect Mood</li>
            <li><span className="step-badge">3</span> Chat</li>
            <li><span className="step-badge">4</span> Get Help</li>
          </ol>
        </div>
      </section>

      <section id="tutorial" className="tutorial" role="region" aria-label="Tutorial">
        <div className="container">
          <h2>Learn How to Use Elderlyze</h2>
          <div className="tutorial-card interactive">
            <p>Follow our friendly walkthrough to get started quickly. Large buttons, clear text, and simple steps guide you along the way.</p>
            <button className="btn btn-secondary" onClick={() => navigate('/tutorial')}><PlayCircle size={18} style={{marginRight:8}} /> Start Tutorial</button>
          </div>
        </div>
      </section>

      <section className="safety" role="region" aria-label="Safety features">
        <div className="container">
          <h2>Safety First</h2>
          <div className="safety-grid">
            <div className="safety-item interactive">
              <div className="phone-notif" aria-hidden="true">
                <div className="notif"><ShieldCheck size={14} style={{marginRight:6}} /> SOS Alert sent to Family</div>
                <div className="notif muted">No activity detected for 3 hours</div>
              </div>
              <p>Automatic inactivity checks send SOS to loved ones if needed.</p>
            </div>
            <div className="safety-item interactive">
              <div className="phone-notif" aria-hidden="true">
                <div className="notif"><Bell size={14} style={{marginRight:6}} /> Medicine Reminder: 8:00 PM</div>
                <div className="notif muted">Tap to confirm you took it</div>
              </div>
              <p>Smart reminders keep you on track with your health.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials" role="region" aria-label="Testimonials">
        <div className="container">
          <h2>What People Say</h2>
          <div className="quotes">
            <blockquote><Quote size={16} /> “I feel cared for and safe using Elderlyze.”</blockquote>
            <blockquote><Quote size={16} /> “The reminders and gentle chats brighten my day.”</blockquote>
          </div>
        </div>
      </section>

      <section className="cta" aria-label="Call to action">
        <div className="container cta-inner">
          <div>
            <h3>Start your wellness journey today</h3>
            <p className="muted">Simple steps. Gentle reminders. Real peace of mind.</p>
          </div>
          <button className="btn btn-primary btn-lg">Create your account</button>
        </div>
      </section>
    </main>
  );
}

export default Home;


