import React from 'react';

function ContestRequestModal({
  showModal,
  setShowModal,
  contestTexts,
  userContestRequests, // Current user's requests
  handleSendJoinRequest,
  isDarkMode,
  userEmail // To ensure only logged-in users can request
}) {
  if (!showModal) return null;

  // Helper to determine request status for a given contestId
  const getRequestStatus = (contestId) => {
    const request = userContestRequests.find(req => req.contestId === contestId);
    if (!request) return null; // No request sent
    return request.status;
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${isDarkMode ? 'dark' : ''} max-w-xl`}>
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 text-2xl font-bold"
        >
          &times;
        </button>
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Join a Contest
        </h2>
        {!userEmail && (
          <p className="text-red-500 text-sm mb-4">You must be logged in to send join requests.</p>
        )}

        {contestTexts.length === 0 ? (
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No contests available yet. Check back later!</p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {contestTexts.map((contest) => {
              const status = getRequestStatus(contest.id);
              return (
                <li key={contest.id} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{contest.text.substring(0, 50)}...</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-800'}`}>
                      {contest.difficulty} ({contest.category})
                    </span>
                  </div>
                  <div className="flex justify-end mt-2">
                    {status === 'pending' && (
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Pending...</span>
                    )}
                    {status === 'accepted' && (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">Accepted!</span>
                    )}
                    {status === 'rejected' && (
                      <span className="text-red-600 dark:text-red-400 text-sm font-medium">Rejected.</span>
                    )}
                    {status === null && userEmail && (
                      <button
                        onClick={() => handleSendJoinRequest(contest.id, contest.text)}
                        className="py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold transition-colors duration-200"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ContestRequestModal;