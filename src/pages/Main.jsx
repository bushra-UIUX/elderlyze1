import React from 'react';
import '../Assets/Css/Main.css';
import { Bot, Smile, Pill, Siren, Activity, User } from 'lucide-react';

function Main() {
  return (
    <main className="main">
      <div className="container">
        <h1 className="main-title">Welcome to Elderlyze</h1>
        <p className="main-sub">Quick actions for your daily care</p>

        <div className="main-grid">
          <a className="main-tile" href="/app/chat">
            <div className="tile-icon"><Bot size={26} /></div>
            <div className="tile-title">Chatbot</div>
            <div className="tile-desc">Compassionate chat in Urdu and English</div>
          </a>
          <a className="main-tile" href="/app/mood">
            <div className="tile-icon"><Smile size={26} /></div>
            <div className="tile-title">Mood</div>
            <div className="tile-desc">Tap an emoji to begin</div>
          </a>
          <a className="main-tile" href="/app/medicines">
            <div className="tile-icon"><Pill size={26} /></div>
            <div className="tile-title">Medicine</div>
            <div className="tile-desc">Add reminders and dosage</div>
          </a>
          <a className="main-tile" href="/app/sos">
            <div className="tile-icon"><Siren size={26} /></div>
            <div className="tile-title">SOS</div>
            <div className="tile-desc">Contacts and auto alert</div>
          </a>
          <a className="main-tile" href="/app/physical-activities">
            <div className="tile-icon"><Activity size={26} /></div>
            <div className="tile-title">Physical Activities</div>
            <div className="tile-desc">Yoga, meditation & wellness</div>
          </a>
          <a className="main-tile" href="/app/profile">
            <div className="tile-icon"><User size={26} /></div>
            <div className="tile-title">Profile</div>
            <div className="tile-desc">Manage your personal information</div>
          </a>
        </div>
      </div>
    </main>
  );
}

export default Main;


