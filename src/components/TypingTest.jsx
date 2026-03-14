import React, { useRef } from 'react';

function TypingTest({
  textToType,
  userInput,
  handleInputChange,
  isFinished,
  isLoading,
  error,
  userEmail,
  elapsedTime,
  wpm,
  accuracy,
  resetGame,
  customText,
  setCustomText,
  useCustomText,
  setUseCustomText,
  isDarkMode,
  isAdmin // New prop for admin check
}) {
  const inputRef = useRef(null);

  // Focus the input field whenever the component re-renders and it's not finished, loading, or in error
  // This is a simple auto-focus, more robust solutions might use useEffect with specific dependencies.
  if (inputRef.current && !isFinished && !isLoading && !error && userEmail) {
    inputRef.current.focus();
  }

  const renderText = () => {
    if (isLoading) {
      return <span className="text-gray-500 text-xl dark:text-gray-400">Loading text...</span>;
    }
    if (error) {
      return <span className="text-red-500 text-xl dark:text-red-400">{error}</span>;
    }
    if (!textToType) {
      return <span className="text-gray-500 text-xl dark:text-gray-400">No text available. Click Restart.</span>;
    }
    return textToType.split('').map((char, index) => {
      let color = 'text-gray-700 dark:text-gray-300';
      if (index < userInput.length) {
        color = char === userInput[index] ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
      } else if (isFinished && index >= userInput.length) {
        color = 'text-gray-400 dark:text-gray-500';
      }
      return (
        <span key={index} className={`${color} text-xl font-medium`}>
          {char}
        </span>
      );
    });
  };

  return (
    <>
      {/* Custom Text Input - Only visible for Admins */}
      {isAdmin && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <label className={`block text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Use Custom Text:
          </label>
          <textarea
            className={`w-full p-3 rounded-md border text-gray-800 dark:text-gray-100
              ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
            rows="3"
            placeholder="Paste your custom text here..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
          ></textarea>
          <button
            onClick={() => {
              setUseCustomText(true);
              resetGame(); // Reset and use new custom text
            }}
            className={`mt-3 w-full py-2 px-4 rounded-md font-semibold transition-colors duration-300
              ${useCustomText ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            {useCustomText ? 'Using Custom Text' : 'Use This Text'}
          </button>
          {useCustomText && (
            <button
              onClick={() => {
                setUseCustomText(false);
                resetGame(); // Reset and use API text
              }}
              className={`mt-2 w-full py-2 px-4 rounded-md font-semibold transition-colors duration-300
                ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
            >
              Use Random API Text
            </button>
          )}
        </div>
      )}

      {/* Display area for the text to type */}
      <div className={`bg-gray-50 p-6 rounded-lg mb-6 border min-h-[120px] max-h-48 overflow-y-auto text-left leading-relaxed select-none transition-colors duration-300
        ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        {renderText()}
      </div>

      {/* Input field for user typing */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleInputChange}
        disabled={isFinished || isLoading || error || !textToType || !userEmail}
        className={`w-full p-4 mb-6 text-lg rounded-lg border-2 focus:ring-2 focus:shadow-lg outline-none transition duration-200 ease-in-out shadow-sm
          ${isDarkMode ? 'bg-gray-700 text-gray-100 border-blue-600 focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400' : 'bg-white text-gray-800 border-blue-300 focus:border-blue-500 focus:ring-blue-200 placeholder-gray-500'}`}
        placeholder={!userEmail ? "Please log in to start typing..." : (isLoading ? "Loading text..." : (error ? "Error loading text" : (isFinished ? "Test finished!" : "Start typing here...")))}
      />
      {!userEmail && (
        <p className={`text-red-500 text-sm mb-4 ${isDarkMode ? 'text-red-400' : ''}`}>
          Login or Sign Up to start the typing test.
        </p>
      )}

      {/* Results and Timer display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg shadow-md flex flex-col items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg ${isFinished ? 'animate-pop-in' : ''}
          ${isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white'}`}>
          <span className="text-sm font-light opacity-90">Time</span>
          <span className="text-3xl font-bold">{elapsedTime}s</span>
        </div>
        <div className={`p-4 rounded-lg shadow-md flex flex-col items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg ${isFinished ? 'animate-pop-in' : ''}
          ${isDarkMode ? 'bg-purple-700 text-white' : 'bg-purple-500 text-white'}`}>
          <span className="text-sm font-light opacity-90">WPM</span>
          <span className="text-3xl font-bold">{wpm}</span>
        </div>
        <div className={`p-4 rounded-lg shadow-md flex flex-col items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg ${isFinished ? 'animate-pop-in' : ''}
          ${isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white'}`}>
          <span className="text-sm font-light opacity-90">Accuracy</span>
          <span className="text-3xl font-bold">{accuracy}%</span>
        </div>
      </div>

      {/* Restart Button */}
      <button
        onClick={resetGame}
        disabled={!userEmail}
        className={`font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 active:scale-95
          ${!userEmail ? 'bg-gray-400 cursor-not-allowed' : (isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text-white focus:ring-blue-500' : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300')}`}
      >
        Restart Test
      </button>
    </>
  );
}

export default TypingTest;
