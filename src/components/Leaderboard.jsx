import React from 'react';

function Leaderboard({ leaderboard, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
      <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No scores yet. Be the first!</p>
      ) : (
        <ul className="space-y-2">
          {leaderboard.map((score, index) => (
            <li key={score.id} className={`flex justify-between items-center p-2 rounded-md ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
              <span>{index + 1}. {score.userName || 'Anonymous'}</span>
              <span className="font-semibold">{score.wpm} WPM ({score.accuracy}%)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Leaderboard;
