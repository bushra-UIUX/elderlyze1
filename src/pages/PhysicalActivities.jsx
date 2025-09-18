import React, { useState } from 'react';
import '../Assets/Css/PhysicalActivities.css';
import { Heart, Brain, Dumbbell, Sun } from 'lucide-react';

function PhysicalActivities() {
  const [selectedActivity, setSelectedActivity] = useState('yoga');
  
  const activities = {
    yoga: {
      icon: Heart,
      title: 'Yoga & Stretching',
      description: 'Gentle yoga poses and stretching exercises for flexibility and balance.',
      videos: [
        { title: 'Gentle Yoga for Seniors', duration: '20 min', instructor: 'Yoga Instructor', videoId: 'X3-gKPNyrTA' },
        { title: 'Chair Yoga & Stretching', duration: '15 min', instructor: 'Wellness Expert', videoId: 'x6wiDew4sYU' }
      ]
    },
    meditation: {
      icon: Brain,
      title: 'Meditation & Mindfulness',
      description: 'Calming meditation practices and mindfulness exercises for mental wellness.',
      videos: [
        { title: 'Guided Meditation for Beginners', duration: '10 min', instructor: 'Meditation Expert', videoId: 'x2wBS6sjpjM' },
        { title: 'Relaxation & Breathing', duration: '15 min', instructor: 'Wellness Coach', videoId: '8ln4XfRi6uw' }
      ]
    },
    walking: {
      icon: Sun,
      title: 'Walking & Mobility',
      description: 'Gentle walking routines and mobility exercises for daily movement.',
      videos: [
        { title: 'Walking Exercise for Seniors', duration: '25 min', instructor: 'Fitness Coach', videoId: 'GT0mDPJULAE' },
        { title: 'Mobility & Balance Training', duration: '18 min', instructor: 'Physical Therapist', videoId: 'EvjZMQJSY5I' }
      ]
    },
    strength: {
      icon: Dumbbell,
      title: 'Strength Training',
      description: 'Light strength exercises using body weight and gentle resistance.',
      videos: [
        { title: 'Strength Training for Seniors', duration: '22 min', instructor: 'Fitness Expert', videoId: 'Wa8Fk8TaXPk' },
        { title: 'Chair Exercises & Strength', duration: '20 min', instructor: 'Exercise Specialist', videoId: '66kfC7qEJTQ' }
      ]
    },

  };
  
  const currentActivity = activities[selectedActivity];
  const IconComponent = currentActivity.icon;
  
  return (
    <main className="physical-activities-page">
      <section className="hero-section">
        <div className="container">
          <h1>Physical Activities & Wellness</h1>
          <p className="hero-subtitle">Choose an activity to get started with guided videos</p>
        </div>
      </section>
      
      <section className="activities-section">
        <div className="container">
          <div className="activity-tabs">
            {Object.entries(activities).map(([key, activity]) => {
              const IconComponent = activity.icon;
              return (
                <button 
                  key={key}
                  className={`activity-tab ${selectedActivity === key ? 'active' : ''}`}
                  onClick={() => setSelectedActivity(key)}
                >
                  <IconComponent size={20} />
                  <span>{activity.title}</span>
                </button>
              );
            })}
          </div>

          <div className="activity-content">
            <div className="activity-details">
              <div className="activity-header">
                <div className="activity-icon">
                  <IconComponent size={32} />
                </div>
                <div>
                  <h3>{currentActivity.title}</h3>
                  <p>{currentActivity.description}</p>
                </div>
              </div>
              
              <div className="videos-showcase">
                {currentActivity.videos.map((video, index) => (
                  <div key={index} className="video-card">
                    <iframe 
                      src={`https://www.youtube.com/embed/${video.videoId}`}
                      title={video.title}
                      style={{border: 0}}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                    <div className="video-info">
                      <h4>{video.title}</h4>
                      <p className="video-meta">{video.duration} • {video.instructor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PhysicalActivities;
