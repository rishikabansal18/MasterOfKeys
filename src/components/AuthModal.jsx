import React, { useState } from 'react';

function AuthModal({ showAuthModal, setShowAuthModal, isRegistering, setIsRegistering, handleLogin, handleSignup, authMessage, isDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthAction = () => {
    if (isRegistering) {
      handleSignup(email, password);
    } else {
      handleLogin(email, password);
    }
  };

  if (!showAuthModal) return null;

  return (
    // Modal Overlay: Fixed position, covers the whole screen, centered content using flexbox
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal Content: Responsive width, centered, with rounded corners and shadow */}
      <div className={`relative bg-white dark:bg-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto transform transition-all sm:p-8 ${isDarkMode ? 'dark' : ''}`}>
        {/* Close Button: Absolute position for easy dismissal */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 text-2xl font-bold focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        {/* Title: Responsive text size and color */}
        <h2 className={`text-2xl font-bold mb-4 text-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} sm:text-3xl`}>
          {isRegistering ? 'Sign Up' : 'Login'}
        </h2>
        {/* Auth Message: Conditional display for error/success messages */}
        {authMessage && (
          <p className="text-red-500 text-sm mb-4 text-center">{authMessage}</p>
        )}
        {/* Email Input Field */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full p-3 mb-3 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-300' : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'}`}
          aria-label="Email address"
        />
        {/* Password Input Field */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full p-3 mb-4 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-300' : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'}`}
          aria-label="Password"
        />
        {/* Action Button (Sign Up / Login) */}
        {isRegistering ? (
          <button
            onClick={handleAuthAction}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign Up
          </button>
        ) : (
          <button
            onClick={handleAuthAction}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Login
          </button>
        )}
        {/* Toggle Button (Login / Sign Up) */}
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setEmail(''); // Clear form on toggle
            setPassword(''); // Clear form on toggle
          }}
          className={`mt-4 w-full py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
