import React, { useState } from 'react';
import '../Assets/Css/Tutorial.css';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X, UserPlus, LogIn, Smile, Heart, Phone, Pill, Clock, Calendar, Shield, Users } from 'lucide-react';

const steps = [
  {
    id: 'account',
    title: 'Create your account and sign in',
    icon: <UserPlus size={24} />,
    content: (
      <div className="tutorial-content">
        <div className="tutorial-visual">
          <div className="visual-step">
            <div className="step-icon"><UserPlus size={32} /></div>
            <div className="step-demo">
              <div className="demo-form">
                <div className="form-field">
                  <div className="field-label">Name</div>
                  <div className="field-input">John Doe</div>
                </div>
                <div className="form-field">
                  <div className="field-label">Email</div>
                  <div className="field-input">john@example.com</div>
                </div>
                <div className="form-field">
                  <div className="field-label">Password</div>
                  <div className="field-input">••••••••</div>
                </div>
                <div className="demo-button">Sign Up</div>
              </div>
            </div>
          </div>
        </div>
        <div className="tutorial-text">
          <ol>
            <li>Open Sign Up and enter your Name, Email, and Password.</li>
            <li>Check your details and tap "Sign Up".</li>
            <li>Return to Sign In and log in with your email and password.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'mood',
    title: 'Pick a mood and start chatting',
    icon: <Smile size={24} />,
    content: (
      <div className="tutorial-content">
        <div className="tutorial-visual">
          <div className="visual-step">
            <div className="step-icon"><Smile size={32} /></div>
            <div className="step-demo">
              <div className="mood-demo">
                <div className="mood-grid">
                  <div className="mood-item active">😊</div>
                  <div className="mood-item">😢</div>
                  <div className="mood-item">😴</div>
                  <div className="mood-item">😌</div>
                  <div className="mood-item">🤔</div>
                  <div className="mood-item">😄</div>
                </div>
                <div className="chat-demo">
                  <div className="chat-bubble user">I'm feeling happy today!</div>
                  <div className="chat-bubble bot">That's wonderful! What's making you feel happy?</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tutorial-text">
          <ol>
            <li>Tap the Mood option and choose an emoji that matches how you feel.</li>
            <li>Elderlyze suggests helpful prompts based on your mood.</li>
            <li>Start chatting with the chatbot to receive support and guidance.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'sos',
    title: 'Add SOS contacts and inactivity timer',
    icon: <Shield size={24} />,
    content: (
      <div className="tutorial-content">
        <div className="tutorial-visual">
          <div className="visual-step">
            <div className="step-icon"><Shield size={32} /></div>
            <div className="step-demo">
              <div className="sos-demo">
                <div className="contact-card">
                  <div className="contact-info">
                    <Users size={20} />
                    <div>
                      <div className="contact-name">Dr. Sarah Johnson</div>
                      <div className="contact-relation">Primary Doctor</div>
                    </div>
                  </div>
                  <div className="contact-phone">📞 +1 (555) 123-4567</div>
                </div>
                <div className="timer-setting">
                  <Clock size={20} />
                  <span>Auto SOS: 3 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tutorial-text">
          <ol>
            <li>Open SOS settings and add a contact's Name, Relation, and Phone.</li>
            <li>Set the contact Priority (Primary or Secondary).</li>
            <li>Turn on Auto SOS and choose a time in hours. By default, an alert is sent after 3 hours of inactivity.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'meds',
    title: 'Medication reminders',
    icon: <Pill size={24} />,
    content: (
      <div className="tutorial-content">
        <div className="tutorial-visual">
          <div className="visual-step">
            <div className="step-icon"><Pill size={32} /></div>
            <div className="step-demo">
              <div className="medicine-demo">
                <div className="medicine-card">
                  <div className="medicine-icon">💊</div>
                  <div className="medicine-info">
                    <div className="medicine-name">Vitamin D</div>
                    <div className="medicine-dosage">1 tablet</div>
                    <div className="medicine-time">
                      <Clock size={16} />
                      8:00 AM
                    </div>
                  </div>
                </div>
                <div className="schedule-info">
                  <Calendar size={20} />
                  <span>Daily • 7 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tutorial-text">
          <ol>
            <li>Go to Medication Reminders and tap Add Medicine.</li>
            <li>Fill in Name, Dosage, Time, Start date, and End date.</li>
            <li>Save the reminder. Add more medicines if you need to.</li>
          </ol>
        </div>
      </div>
    )
  }
];

function Tutorial() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const step = steps[index];

  const goNext = () => setIndex(i => Math.min(i + 1, steps.length - 1));
  const onSkip = () => navigate('/signin');

  return (
    <main className="tutorial-page">
      <div className="container">
        {/* Progress Indicator */}
        <div className="tutorial-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((index + 1) / steps.length) * 100}%` }}></div>
          </div>
          <div className="progress-text">
            Step {index + 1} of {steps.length}
          </div>
        </div>



        {/* Main Content */}
        <div className="tutorial-main">
          <div className="tutorial-header">
            <div className="header-left">
              <span className="step-badge">{index + 1}</span>
              <h1>{step.title}</h1>
            </div>
            <div className="header-right">
              <button className="btn btn-ghost" onClick={onSkip} aria-label="Skip tutorial">
                Skip <X size={16} />
              </button>
              {index < steps.length - 1 ? (
                <button className="btn btn-primary" onClick={goNext} aria-label="Next step">
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn btn-success" onClick={() => navigate('/signin')} aria-label="Get Started">
                  Get Started <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="tutorial-body">
            {step.content}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Tutorial;


