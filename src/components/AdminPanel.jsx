import React, { useState } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  where,
  getDocs,
  updateDoc // ADDED THIS IMPORT
} from 'firebase/firestore';


function AdminPanel({
  showAdminPanel,
  setShowAdminPanel,
  contestTexts,
  handleAddContestText,
  handleDeleteContestText,
  adminMessage,
  isDarkMode,
  usersData,
  handleDeleteUserData,
  handleToggleAdminStatus,
  allPendingContestRequests, // New prop: all pending requests for admin
  handleAcceptJoinRequest, // New prop: function to accept request
  handleRejectJoinRequest // New prop: function to reject request
}) {
  const [newContestText, setNewContestText] = useState('');
  const [newContestDifficulty, setNewContestDifficulty] = useState('easy');
  const [newContestCategory, setNewContestCategory] = useState('general');
  const [useAiForContestText, setUseAiForContestText] = useState(false); // New state for AI generation toggle
  const [isGeneratingAiText, setIsGeneratingAiText] = useState(false); // New state for AI generation loading

  const handleAdd = () => {
    handleAddContestText(newContestText, newContestDifficulty, newContestCategory);
    setNewContestText(''); // Clear input after adding
    // Optionally reset AI generated text after adding
    if (useAiForContestText) {
      setNewContestText('');
    }
  };

  const handleGenerateAiContestText = async () => {
    setIsGeneratingAiText(true);
    setNewContestText(''); // Clear previous text while generating
    try {
      const prompt = `Generate a unique, interesting sentence for a typing test. It should be grammatically correct, suitable for a ${newContestDifficulty} difficulty level, and related to ${newContestCategory}. Max 150 characters.`;
      // Ensure puter.ai.chat is available globally from the script tag in index.html
      if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
        const rawResponse = await puter.ai.chat(prompt, { model: "gpt-4o-mini" }); // Using a common free model

        let generatedText = '';
        if (typeof rawResponse === 'string') {
          generatedText = rawResponse;
        } else if (rawResponse && typeof rawResponse === 'object') {
          // Common patterns for AI response objects
          if (rawResponse.text && typeof rawResponse.text === 'string') {
            generatedText = rawResponse.text;
          } else if (rawResponse.content && typeof rawResponse.content === 'string') {
            generatedText = rawResponse.content;
          } else if (rawResponse.message && rawResponse.message.content && typeof rawResponse.message.content === 'string') {
            generatedText = rawResponse.message.content;
          } else {
            // Fallback if structure is unknown, try converting the object to string
            generatedText = JSON.stringify(rawResponse);
            console.warn("Puter.js response was an object with unknown text property. Stringifying it:", rawResponse);
          }
        }

        if (generatedText) {
          setNewContestText(generatedText.trim());
        } else {
          throw new Error("No usable AI content extracted from Puter.js response.");
        }
      } else {
        throw new Error("Puter.js AI chat functionality not available.");
      }
    } catch (error) {
      console.error("Error generating AI contest text:", error);
      alert(`Failed to generate AI text: ${error.message}. Please try again.`); // Using alert for admin panel feedback
      setNewContestText('Failed to generate text. Please try manually or try again.');
    } finally {
      setIsGeneratingAiText(false);
    }
  };


  if (!showAdminPanel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Increased max-w to max-w-screen-lg for wider container, enhanced shadow and border */}
      <div className={`modal-content ${isDarkMode ? 'dark' : ''} max-w-screen-lg w-full p-8 relative rounded-xl shadow-2xl transform transition-all duration-300 scale-100 opacity-100 overflow-y-auto max-h-[90vh] ${isDarkMode ? 'border border-gray-600' : 'border border-gray-200'}`}>
        {/* Close Button: Enhanced hover effect */}
        <button
          onClick={() => setShowAdminPanel(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-50 text-3xl font-bold transition-colors duration-200 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
          aria-label="Close Admin Panel"
        >
          &times;
        </button>
        {/* Title: Enhanced typography */}
        <h2 className={`text-4xl font-extrabold mb-8 text-center ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} drop-shadow-lg tracking-tight`}>
          Admin Dashboard
        </h2>
        {adminMessage && (
          <p className="text-red-500 dark:text-red-400 text-sm mb-6 text-center font-medium animate-pulse">
            {adminMessage}
          </p>
        )}

        {/* Add New Contest Text Section: Enhanced background and shadow */}
        <div className={`p-6 rounded-lg mb-8 shadow-xl transition-all duration-300
          ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200'}`}>
          <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Create New Contest Text
          </h3>

          {/* AI Toggle */}
          <div className="flex items-center justify-end mb-4">
            <span className={`mr-3 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Use AI for Text Generation
            </span>
            <label htmlFor="ai-toggle" className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="ai-toggle"
                className="sr-only peer"
                checked={useAiForContestText}
                onChange={() => setUseAiForContestText(!useAiForContestText)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <textarea
            className={`w-full p-3 mb-4 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200
              ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'}
              ${useAiForContestText ? 'opacity-60 cursor-not-allowed' : ''}`}
            rows="5"
            placeholder="Enter new contest text here..."
            value={newContestText}
            onChange={(e) => setNewContestText(e.target.value)}
            disabled={useAiForContestText || isGeneratingAiText}
          ></textarea>

          {useAiForContestText && (
            <button
              onClick={handleGenerateAiContestText}
              disabled={isGeneratingAiText}
              className={`w-full py-3 mb-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5
                ${isGeneratingAiText ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-bold'}`}
            >
              {isGeneratingAiText ? 'Generating...' : 'Generate Text with AI'}
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <select
              value={newContestDifficulty}
              onChange={(e) => setNewContestDifficulty(e.target.value)}
              className={`flex-1 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200
                ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'}`}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={newContestCategory}
              onChange={(e) => setNewContestCategory(e.target.value)}
              className={`flex-1 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200
                ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'}`}
            >
              <option value="general">General</option>
              <option value="quotes">Quotes</option>
              <option value="programming">Programming</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isGeneratingAiText || newContestText.trim() === ''} // Disable if AI is generating or text is empty
          >
            Add New Contest Text
          </button>
        </div>

        {/* List Existing Contest Texts Section: Enhanced background and shadow */}
        <div className={`p-6 rounded-lg mb-8 shadow-xl transition-all duration-300
          ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200'}`}>
          <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Manage Existing Contest Texts
          </h3>
          {contestTexts.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
              No contest texts added yet.
            </p>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {contestTexts.map((textItem) => (
                <li key={textItem.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg shadow-md
                  ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors duration-200`}>
                  <div className="flex-1 text-sm font-medium pr-4 mb-2 sm:mb-0">
                    <p className="truncate">{textItem.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      Difficulty: {textItem.difficulty} | Category: {textItem.category}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteContestText(textItem.id)}
                    className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-semibold transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User Management Section: Enhanced background and shadow */}
        <div className={`p-6 rounded-lg mb-8 shadow-xl transition-all duration-300
          ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gradient-to-br from-green-50 to-teal-100 border border-green-200'}`}>
          <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            User Management
          </h3>
          {usersData.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
              No users found (only users with scores are listed).
            </p>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {usersData.map((user) => (
                <li key={user.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg shadow-md
                  ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors duration-200`}>
                  <div className="flex-1 pr-4 mb-2 sm:mb-0">
                    <span className="font-semibold text-sm truncate">{user.email}</span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${user.isAdmin ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300'}`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => handleToggleAdminStatus(user.id, user.isAdmin)}
                      className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
                        ${user.isAdmin ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    >
                      {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => handleDeleteUserData(user.id)}
                      className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete Data
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Contest Join Requests Section: Enhanced background and shadow */}
        <div className={`p-6 rounded-lg shadow-xl transition-all duration-300
          ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gradient-to-br from-orange-50 to-yellow-100 border border-orange-200'}`}>
          <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Contest Join Requests
          </h3>
          {allPendingContestRequests.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
              No pending join requests.
            </p>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {allPendingContestRequests.map((request) => (
                <li key={request.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg shadow-md
                  ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors duration-200`}>
                  <div className="flex-1 pr-4 mb-2 sm:mb-0">
                    <span className="font-semibold text-sm truncate">{request.userEmail}</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                      {request.status}
                    </span>
                    <p className="text-xs opacity-70 mt-1">
                      Contest: "{request.contestText.substring(0, 40)}..."
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => handleAcceptJoinRequest(request.id)}
                      className="py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectJoinRequest(request.id)}
                      className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
