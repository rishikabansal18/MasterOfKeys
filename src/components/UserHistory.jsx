import React from 'react';

function UserHistory({ userHistory, userEmail, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
      <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Your Recent Tests</h2>
      {userEmail ? (
        userHistory.length === 0 ? (
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Complete a test to see your history!</p>
        ) : (
          <ul className="space-y-2">
            {userHistory.map((entry) => ( // Removed index as key, using entry.id
              <li key={entry.id} className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{entry.wpm} WPM ({entry.accuracy}%)</span>
                  <span className="text-sm opacity-80">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-xs opacity-70 mt-1 italic">{entry.text}</p>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Log in to view your personal history.</p>
      )}
    </div>
  );
}

export default UserHistory;
