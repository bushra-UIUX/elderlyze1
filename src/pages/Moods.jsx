import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Assets/Css/Moods.css';

const ALL_MOODS = [
  { emoji: '😀', name: 'Happy' },
  { emoji: '😊', name: 'Content' },
  { emoji: '😌', name: 'Calm' },
  { emoji: '😁', name: 'Cheerful' },
  { emoji: '🙂', name: 'Okay' },
  { emoji: '😐', name: 'Neutral' },
  { emoji: '🤔', name: 'Thoughtful' },
  { emoji: '🙁', name: 'Down' },
  { emoji: '😔', name: 'Sad' },
  { emoji: '😟', name: 'Worried' },
  { emoji: '😣', name: 'Tense' },
  { emoji: '😞', name: 'Disappointed' },
  { emoji: '😤', name: 'Frustrated' },
  { emoji: '😡', name: 'Angry' },
  { emoji: '😭', name: 'Overwhelmed' },
  { emoji: '🥲', name: 'Bittersweet' },
  { emoji: '🤗', name: 'Warm' },
  { emoji: '😴', name: 'Sleepy' },
  { emoji: '😵', name: 'Dizzy' },
  { emoji: '😇', name: 'Grateful' }
];

const MOOD_SUGGESTIONS = {
  '😀': 'Channel that energy: try a short gratitude note or share a win.',
  '😊': 'Enjoy the moment. A 2-minute stretch could feel great.',
  '😌': 'Lean into calm with a 3-2-4 breathing cycle.',
  '😁': 'Spread the joy—send a kind message to someone you care about.',
  '🙂': 'Nice and steady. Would you like a light reflection prompt?',
  '😐': 'Neutral is okay. A five-minute walk might brighten things.',
  '🤔': 'What’s on your mind? Jot one thought you’re exploring.',
  '🙁': 'Be gentle with yourself. Try labeling the feeling in one word.',
  '😔': 'I’m here. Want a supportive journaling prompt?',
  '😟': 'Try a grounding exercise: name 5 things you can see.',
  '😣': 'Release some tension with a box-breathing cycle.',
  '😞': 'Let’s reframe: what would you tell a friend feeling this?',
  '😤': 'A quick shake-out and shoulder roll can help reduce stress.',
  '😡': 'Anger is valid. Would you like a guided release exercise?',
  '😭': 'You’re not alone. A soothing audio might help right now.',
  '🥲': 'Mixed feelings are real. Want a perspective-shift prompt?',
  '🤗': 'Warmth is wonderful. Consider a small act of kindness today.',
  '😴': 'Rest matters. Maybe set a reminder for wind-down time?',
  '😵': 'Pause and hydrate. A 1-minute breath check-in could help.',
  '😇': 'Gratitude time: list one small thing you appreciate.'
};

function Moods() {
  const [selected, setSelected] = useState('');
  const navigate = useNavigate();

  const selectedName = useMemo(() => {
    const found = ALL_MOODS.find((m) => m.emoji === selected);
    return found ? found.name : '';
  }, [selected]);

  const suggestion = selected
    ? MOOD_SUGGESTIONS[selected] || 'Would you like a gentle check-in?'
    : 'Browse and tap any mood to get a tailored suggestion.';

  function handleStartChat() {
    if (selected) {
      navigate('/app/chat', { state: { mood: selected } });
    }
  }

  return (
    <main className="moods">
      <div className="container">
        <h1 className="moods-title">Explore moods</h1>
        <p className="moods-sub">Tap a mood to get a small suggestion that meets you where you are.</p>

        <div className="moods-grid" role="list" aria-label="All moods">
          {ALL_MOODS.map(({ emoji, name }) => (
            <button
              key={emoji}
              className={`mood-card${selected === emoji ? ' selected' : ''}`}
              onClick={() => setSelected(emoji)}
              aria-pressed={selected === emoji}
              aria-label={`${name} mood`}
            >
              <span className="emoji" aria-hidden>{emoji}</span>
              <span className="label">{name}</span>
            </button>
          ))}
        </div>

        <div className="moods-suggestion" role="status" aria-live="polite">
          {selectedName && (
            <span className="chip">Selected: {selectedName}</span>
          )}
          <div className="text">{suggestion}</div>
        </div>

        <div className="moods-actions">
          <button 
            className="btn btn-primary btn-lg" 
            disabled={!selected} 
            onClick={handleStartChat}
          >
            Start Chat
          </button>
          <button className="btn btn-ghost" onClick={() => setSelected('')}>Clear</button>
        </div>
      </div>
    </main>
  );
}

export default Moods;
