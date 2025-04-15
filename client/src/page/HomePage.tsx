import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../constant';

// Landing Page with a form {username, password, room-id}
// On Submit, Post Request to server_url/auth
// On Success, Navigate to /room
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    room_id: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${SERVER_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/room');
      } else {
        const data = await response.json();
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6">
      <h1 className="text-4xl font-bold text-primary mb-6">Welcome to PeerCall</h1>
      <p className="text-secondary mb-4 text-center max-w-md">
        Connect with anyone, anywhere. Realtime video calling and chat
      </p>
      <p className="text-secondary mb-10 text-center max-w-md italic capitalize font-semibold">
        secure, fast, and easy.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-card shadow-lg rounded-lg p-8 w-full max-w-md space-y-6"
      >
        {error && <p className="text-danger text-sm">{error}</p>}

        <div>
          <label className="block text-sm text-secondary mb-1">Username</label>
          <input
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-secondary mb-1">Password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-secondary mb-1">Room ID</label>
          <input
            name="room_id"
            type="text"
            value={formData.room_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-blue-600 transition"
        >
          Join Room
        </button>
      </form>
    </div>
  );
};

export default HomePage;
