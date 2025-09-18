import React, { useState, useEffect } from 'react';
import { auth, db } from '../Firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import '../Assets/Css/Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    medicalInfo: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user);
      } else {
        setUser(null);
        // Redirect to login if not authenticated
        window.location.href = '/signin';
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (currentUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile({
          displayName: userData.displayName || currentUser.displayName || '',
          email: currentUser.email || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: userData.dateOfBirth || '',
          address: userData.address || '',
          emergencyContact: userData.emergencyContact || '',
          medicalInfo: userData.medicalInfo || ''
        });
      } else {
        // Initialize with basic user data
        setUserProfile({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          phoneNumber: '',
          dateOfBirth: '',
          address: '',
          emergencyContact: '',
          medicalInfo: ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      // Update Firebase Auth profile
      if (userProfile.displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: userProfile.displayName
        });
      }

      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: userProfile.displayName,
        phoneNumber: userProfile.phoneNumber,
        dateOfBirth: userProfile.dateOfBirth,
        address: userProfile.address,
        emergencyContact: userProfile.emergencyContact,
        medicalInfo: userProfile.medicalInfo,
        updatedAt: new Date().toISOString()
      });

      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update password' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (user) {
      loadUserProfile(user);
    }
  };

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : '👤'}
          </div>
        </div>
        <div className="profile-info">
          <h1>{userProfile.displayName || 'User Profile'}</h1>
          <p className="profile-email">{userProfile.email}</p>
        </div>
        <div className="profile-actions">
          {!isEditing ? (
            <button 
              className="btn-edit-profile"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn-save"
                onClick={saveProfile}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : '💾 Save'}
              </button>
              <button 
                className="btn-cancel"
                onClick={cancelEdit}
                disabled={isLoading}
              >
                ❌ Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-fields">
            <div className="field-group">
              <label htmlFor="displayName">Full Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={userProfile.displayName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>

            <div className="field-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userProfile.email}
                disabled={true}
                className="disabled-field"
              />
              <small>Email cannot be changed</small>
            </div>

            <div className="field-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={userProfile.phoneNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="field-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={userProfile.dateOfBirth}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <div className="field-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={userProfile.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your address"
                rows="3"
              />
            </div>

            <div className="field-group">
              <label htmlFor="emergencyContact">Emergency Contact</label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={userProfile.emergencyContact}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Emergency contact name and phone"
              />
            </div>

            <div className="field-group">
              <label htmlFor="medicalInfo">Medical Information</label>
              <textarea
                id="medicalInfo"
                name="medicalInfo"
                value={userProfile.medicalInfo}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Any important medical information, allergies, medications, etc."
                rows="4"
              />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Security</h2>
          <div className="security-actions">
            <button 
              className="btn-change-password"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              🔒 Change Password
            </button>
          </div>

          {showPasswordChange && (
            <div className="password-change-form">
              <div className="field-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>

              <div className="field-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="field-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="password-actions">
                <button 
                  className="btn-update-password"
                  onClick={changePassword}
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  className="btn-cancel-password"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;