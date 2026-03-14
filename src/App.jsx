import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
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
  updateDoc 
} from 'firebase/firestore';

// Import refactored components
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import TypingTest from './components/TypingTest';
import Leaderboard from './components/Leaderboard';
import UserHistory from './components/UserHistory';
import ContestRequestModal from './components/ContestRequestModal';

// IMPORTANT: Add this script tag to your public/index.html file in the <head> or <body>
// <script src="https://js.puter.com/v2/"></script>
// This makes the 'puter' object globally available.

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const appId = import.meta.env.VITE_FIREBASE_APP_ID; // Still need appId separately for Firestore paths

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Main App component
function App() {
  // --- Core Typing Test States ---
  const [textToType, setTextToType] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- UI/UX States ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const timerIntervalRef = useRef(null);

  // --- Firebase & Data States ---
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [contestTexts, setContestTexts] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [showContestRequestModal, setShowContestRequestModal] = useState(false);
  const [userContestRequests, setUserContestRequests] = useState([]);
  const [allPendingContestRequests, setAllPendingContestRequests] = useState([]);

  // --- Firebase Initialization and Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        console.log("Firebase user signed in:", user.uid, user.email);
        setShowAuthModal(false);

        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
            setIsAdmin(true);
            console.log("User is an administrator.");
          } else {
            setIsAdmin(false);
            setUseCustomText(false);
          }
        } catch (e) {
          console.error("Error checking admin role:", e);
          setIsAdmin(false);
          setUseCustomText(false);
        }
      } else {
        setUserId(null);
        setUserEmail(null);
        setIsAdmin(false);
        setUseCustomText(false);
        setShowAuthModal(true);
        console.log("No Firebase user signed in. Showing login/signup modal.");
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Fetch Data ---
  useEffect(() => {
    if (!userId) {
      setLeaderboard([]);
      setUserHistory([]);
      setUsersData([]);
      setContestTexts([]);
      setUserContestRequests([]);
      setAllPendingContestRequests([]);
      return;
    }

    const leaderboardRef = collection(db, `artifacts/${appId}/public/data/scores`);
    const qLeaderboard = query(leaderboardRef, orderBy("wpm", "desc"), limit(10));
    const unsubscribeLeaderboard = onSnapshot(qLeaderboard, (snapshot) => {
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(scores);
    }, (err) => {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard.");
    });

    let unsubscribeUserHistory;
    if (userEmail) {
      const userHistoryRef = collection(db, `artifacts/${appId}/users/${userId}/my_scores`);
      const qUserHistory = query(userHistoryRef, orderBy("timestamp", "desc"), limit(5));
      unsubscribeUserHistory = onSnapshot(qUserHistory, (snapshot) => {
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserHistory(history);
      }, (err) => {
        console.error("Error fetching user history:", err);
        setError("Failed to load user history.");
      });
    } else {
      setUserHistory([]);
    }

    const contestTextsRef = collection(db, `artifacts/${appId}/public/data/contestTexts`);
    const qContestTexts = query(contestTextsRef, orderBy("timestamp", "desc"));
    const unsubscribeContestTexts = onSnapshot(qContestTexts, (snapshot) => {
      const texts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContestTexts(texts);
    }, (err) => {
      console.error("Error fetching contest texts:", err);
      setError("Failed to load contest texts.");
    });

    let unsubscribeUsersData;
    if (isAdmin) {
      const allScoresQuery = query(collection(db, `artifacts/${appId}/public/data/scores`));
      unsubscribeUsersData = onSnapshot(allScoresQuery, async (snapshot) => {
        const uniqueUsers = new Map();
        for (const scoreDoc of snapshot.docs) {
          const scoreData = scoreDoc.data();
          if (!uniqueUsers.has(scoreData.userId)) {
            const userProfileRef = doc(db, `artifacts/${appId}/users/${scoreData.userId}/profile/data`);
            try {
              const profileSnap = await getDoc(userProfileRef);
              if (profileSnap.exists()) {
                uniqueUsers.set(scoreData.userId, {
                  id: scoreData.userId,
                  email: profileSnap.data().email,
                  isAdmin: profileSnap.data().isAdmin || false,
                });
              } else {
                uniqueUsers.set(scoreData.userId, {
                  id: scoreData.userId,
                  email: scoreData.userName || `User-${scoreData.userId.substring(0, 6)}`,
                  isAdmin: false,
                });
              }
            } catch (profileError) {
              console.error(`Error fetching profile for ${scoreData.userId}:`, profileError);
              uniqueUsers.set(scoreData.userId, {
                id: scoreData.userId,
                email: scoreData.userName || `User-${scoreData.userId.substring(0, 6)}`,
                isAdmin: false,
              });
            }
          }
        }
        setUsersData(Array.from(uniqueUsers.values()));
      }, (err) => {
        console.error("Error fetching users data for admin panel:", err);
        setAdminMessage("Failed to load users data for admin panel.");
      });
    } else {
      setUsersData([]);
    }

    let unsubscribeUserRequests;
    if (userEmail && !isAdmin) {
      const userRequestsRef = collection(db, `artifacts/${appId}/public/data/contestJoinRequests`);
      const qUserRequests = query(userRequestsRef, where("userId", "==", userId));
      unsubscribeUserRequests = onSnapshot(qUserRequests, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserContestRequests(requests);
      }, (err) => {
        console.error("Error fetching user's contest requests:", err);
        setError("Failed to load your contest requests.");
      });
    } else {
      setUserContestRequests([]);
    }

    let unsubscribeAllPendingRequests;
    if (isAdmin) {
      const allRequestsRef = collection(db, `artifacts/${appId}/public/data/contestJoinRequests`);
      const qAllPendingRequests = query(allRequestsRef, where("status", "==", "pending"));
      unsubscribeAllPendingRequests = onSnapshot(qAllPendingRequests, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllPendingContestRequests(requests);
      }, (err) => {
        console.error("Error fetching all pending contest requests:", err);
        setAdminMessage("Failed to load pending contest requests.");
      });
    } else {
      setAllPendingContestRequests([]);
    }

    return () => {
      unsubscribeLeaderboard();
      if (unsubscribeUserHistory) unsubscribeUserHistory();
      unsubscribeContestTexts();
      if (unsubscribeUsersData) unsubscribeUsersData();
      if (unsubscribeUserRequests) unsubscribeUserRequests();
      if (unsubscribeAllPendingRequests) unsubscribeAllPendingRequests();
    };
  }, [userId, userEmail, isAdmin]);

  // --- Initial Text Generation & Input Focus ---
  useEffect(() => {
    if (!userId) return;
    generateNewText();
  }, [userId, useCustomText, contestTexts]);

  // --- Timer Management ---
  useEffect(() => {
    if (isStarted && !isFinished) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (isFinished) {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isStarted, isFinished]);

  // --- Dark Mode Effect ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // --- API/Contest/Custom Text Logic ---
  const generateNewText = async () => {
    setIsLoading(true);
    setError(null);
    setTextToType('');
    setUserInput('');

    if (isAdmin && useCustomText && customText.trim() !== '') {
      setTextToType(customText.trim());
      setIsLoading(false);
      return;
    }

    if ((!useCustomText || !isAdmin) && contestTexts.length > 0) {
      const randomIndex = Math.floor(Math.random() * contestTexts.length);
      setTextToType(contestTexts[randomIndex].text);
      setIsLoading(false);
      return;
    }

    if (!isAdmin && typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
      try {
        const prompt = "Generate a short, interesting sentence suitable for a typing test. It should be grammatically correct and not too complex. Max 100 characters.";
        const rawResponse = await puter.ai.chat(prompt, { model: "gpt-4o-mini" });

        let generatedText = '';
        if (typeof rawResponse === 'string') {
          generatedText = rawResponse;
        } else if (rawResponse && typeof rawResponse === 'object') {
          if (rawResponse.text && typeof rawResponse.text === 'string') {
            generatedText = rawResponse.text;
          } else if (rawResponse.content && typeof rawResponse.content === 'string') {
            generatedText = rawResponse.content;
          } else if (rawResponse.message && rawResponse.message.content && typeof rawResponse.message.content === 'string') {
            generatedText = rawResponse.message.content;
          } else {
            generatedText = JSON.stringify(rawResponse);
            console.warn("Puter.js response was an object with unknown text property. Stringifying it:", rawResponse);
          }
        }

        if (generatedText) {
          setTextToType(generatedText.trim());
        } else {
          throw new Error("No usable AI content extracted from Puter.js response.");
        }
      } catch (err) {
        console.error("Failed to fetch AI-generated text via Puter.js:", err);
        setError("Failed to generate text (AI error). Please try again.");
        setTextToType("Error generating text. Please restart.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const randomId = Math.floor(Math.random() * 200) + 1;
      const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${randomId}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.title) {
        setTextToType(data.title);
      } else {
        throw new Error("No content received from API.");
      }
    } catch (err) {
      console.error("Failed to fetch text:", err);
      if (err.name === 'AbortError') {
        setError("Request timed out. Please try again.");
      } else {
        setError("Failed to load text. Please try again.");
      }
      setTextToType("Error loading text. Please restart.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Game Reset Function ---
  const resetGame = () => {
    generateNewText();
    setUserInput('');
    setIsStarted(false);
    setIsFinished(false);
    setStartTime(null);
    setElapsedTime(0);
    setWpm(0);
    setAccuracy(0);
    clearInterval(timerIntervalRef.current);
  };

  // --- Input Change Handler ---
  const handleInputChange = (event) => {
    const value = event.target.value;
    setUserInput(value);

    if (!isStarted && value.length > 0 && !isLoading && !error) {
      setIsStarted(true);
      setStartTime(Date.now());
    }

    if (value.length === textToType.length && textToType.length > 0) {
      setIsFinished(true);
      setIsStarted(false);
      calculateResults(value);
    }
  };

  // --- Calculate Results & Save Score ---
  const calculateResults = async (finalInput) => {
    const totalCharacters = textToType.length;
    const minutes = elapsedTime / 60;

    const calculatedWpm = minutes > 0 ? Math.round((finalInput.length / 5) / minutes) : 0;
    setWpm(calculatedWpm);

    let correctChars = 0;
    for (let i = 0; i < textToType.length; i++) {
      if (userInput[i] && userInput[i] === textToType[i]) {
        correctChars++;
      }
    }
    const calculatedAccuracy = totalCharacters > 0 ? Math.round((correctChars / totalCharacters) * 100) : 0;
    setAccuracy(calculatedAccuracy);

    if (userEmail && userId) {
      try {
        const currentUserName = userEmail;

        await addDoc(collection(db, `artifacts/${appId}/public/data/scores`), {
          userId: userId,
          wpm: calculatedWpm,
          accuracy: calculatedAccuracy,
          time: elapsedTime,
          timestamp: Date.now(),
          userName: currentUserName
        });
        console.log("Score added to leaderboard!");

        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/my_scores`), {
          wpm: calculatedWpm,
          accuracy: calculatedAccuracy,
          time: elapsedTime,
          timestamp: Date.now(),
          text: textToType.substring(0, 100) + (textToType.length > 100 ? '...' : '')
        });
        console.log("Score added to user history!");
      } catch (e) {
        console.error("Error adding document: ", e);
        setError("Failed to save score.");
      }
    } else {
      console.warn("User not logged in with email, score not saved.");
    }
  };

  // --- Authentication Handlers ---
  const handleLogin = async (email, password) => {
    setAuthMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthMessage('Logged in successfully!');
    } catch (err) {
      console.error("Login error:", err);
      setAuthMessage(`Login failed: ${err.message}`);
    }
  };

  const handleSignup = async (email, password) => {
    setAuthMessage('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`);
      await setDoc(userDocRef, {
        email: userCredential.user.email,
        isAdmin: false,
        createdAt: Date.now()
      });
      setAuthMessage('Account created and logged in!');
    } catch (err) {
      console.error("Signup error:", err);
      setAuthMessage(`Signup failed: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out successfully.");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to log out.");
    }
  };

  // --- Admin Panel Handlers ---
  const handleAddContestText = async (text, difficulty, category) => {
    setAdminMessage('');
    if (text.trim() === '') {
      setAdminMessage('Text cannot be empty.');
      return;
    }
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/contestTexts`), {
        text: text.trim(),
        difficulty: difficulty,
        category: category,
        timestamp: Date.now(),
        addedBy: userEmail || 'Admin'
      });
      setAdminMessage('Text added successfully!');
    } catch (e) {
      console.error("Error adding contest text:", e);
      setAdminMessage(`Failed to add text: ${e.message}`);
    }
  };

  const handleDeleteContestText = async (id) => {
    setAdminMessage('');
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/contestTexts`, id));
      setAdminMessage('Text deleted successfully!');
    } catch (e) {
      console.error("Error deleting contest text:", e);
      setAdminMessage(`Failed to delete text: ${e.message}`);
    }
  };

  const handleDeleteUserData = async (targetUserId) => {
    setAdminMessage('');
    if (!window.confirm(`Are you sure you want to delete all data for user ${targetUserId}? This cannot be undone.`)) {
      return;
    }
    try {
      const batch = writeBatch(db);

      const userProfileRef = doc(db, `artifacts/${appId}/users/${targetUserId}/profile/data`);
      batch.delete(userProfileRef);

      const userScoresCollectionRef = collection(db, `artifacts/${appId}/users/${targetUserId}/my_scores`);
      const userScoresSnapshot = await getDocs(query(userScoresCollectionRef, limit(100)));
      userScoresSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      const publicScoresQuery = query(collection(db, `artifacts/${appId}/public/data/scores`), where("userId", "==", targetUserId));
      const publicScoresSnapshot = await getDocs(publicScoresQuery);
      publicScoresSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setAdminMessage(`Data for user ${targetUserId} deleted successfully!`);
    } catch (e) {
      console.error("Error deleting user data:", e);
      setAdminMessage(`Failed to delete data for user ${targetUserId}: ${e.message}`);
    }
  };

  const handleToggleAdminStatus = async (targetUserId, currentIsAdmin) => {
    setAdminMessage('');
    try {
      const userProfileRef = doc(db, `artifacts/${appId}/users/${targetUserId}/profile/data`);
      await setDoc(userProfileRef, { isAdmin: !currentIsAdmin }, { merge: true });
      setAdminMessage(`Admin status for user ${targetUserId} toggled to ${!currentIsAdmin}.`);
    } catch (e) {
      console.error("Error toggling admin status:", e);
      setAdminMessage(`Failed to toggle admin status for user ${targetUserId}: ${e.message}`);
    }
  };

  // --- Contest Request Handlers ---
  const handleSendJoinRequest = async (contestId, contestText) => {
    if (!userId || !userEmail) {
      setError("You must be logged in to send a join request.");
      return;
    }
    const existingRequestQuery = query(
      collection(db, `artifacts/${appId}/public/data/contestJoinRequests`),
      where("userId", "==", userId),
      where("contestId", "==", contestId)
    );
    const existingRequestsSnapshot = await getDocs(existingRequestQuery);

    if (!existingRequestsSnapshot.empty) {
      setError("You have already sent a request for this contest.");
      return;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/contestJoinRequests`), {
        contestId: contestId,
        contestText: contestText,
        userId: userId,
        userEmail: userEmail,
        status: 'pending',
        timestamp: Date.now()
      });
      setError(null);
      console.log("Join request sent successfully!");
    } catch (e) {
      console.error("Error sending join request:", e);
      setError(`Failed to send join request: ${e.message}`);
    }
  };

  const handleAcceptJoinRequest = async (requestId) => {
    setAdminMessage('');
    try {
      const requestRef = doc(db, `artifacts/${appId}/public/data/contestJoinRequests`, requestId);
      await updateDoc(requestRef, { status: 'accepted' });
      setAdminMessage('Request accepted successfully!');
    } catch (e) {
      console.error("Error accepting request:", e);
      setAdminMessage(`Failed to accept request: ${e.message}`);
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    setAdminMessage('');
    try {
      const requestRef = doc(db, `artifacts/${appId}/public/data/contestJoinRequests`, requestId);
      await updateDoc(requestRef, { status: 'rejected' });
      setAdminMessage('Request rejected successfully!');
    } catch (e) {
      console.error("Error rejecting request:", e);
      setAdminMessage(`Failed to reject request: ${e.message}`);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 font-inter transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-100 to-purple-200'}`}>
      {/* Custom CSS for animations and responsive modal */}
      <style>
        {`
          @keyframes popIn { 
            0% { opacity: 0; transform: scale(0.8); } 
            100% { opacity: 1; transform: scale(1); } 
          }
          .animate-pop-in { 
            animation: popIn 0.3s ease-out forwards; 
          }

          @keyframes fadeInBounce { 
            0% { opacity: 0; transform: translateY(20px); } 
            60% { opacity: 1; transform: translateY(-5px); } 
            100% { transform: translateY(0); } 
          }
          .animate-fade-in-bounce { 
            animation: fadeInBounce 0.6s ease-out forwards; 
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            overflow-y: auto;
            padding: 1rem;
          }
          .modal-content {
            background-color: white;
            padding: 1rem sm:p-2 md:p-3 lg:p-4;
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 90vw sm:max-w-[400px] md:max-w-[500px];
            position: relative;
            max-height: 90vh;
            overflow-y: auto;
          }
          .dark .modal-content {
            background-color: #374151;
            color: white;
          }
          @media (max-width: 640px) {
            .modal-content {
              padding: 0.75rem;
            }
          }
        `}
      </style>

      <div className={`p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl md:max-w-3xl lg:max-w-2xl text-center border-b-4 animate-fade-in-bounce transition-colors duration-300
        ${isDarkMode ? 'bg-gray-800 border-blue-700' : 'bg-white border-blue-500'}`}>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold drop-shadow-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 sm:mb-0`}>
            Master Of Keys
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-4">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md transition-colors duration-300 hover:scale-105"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M3 12H2m8.003-9.997a5 5 0 013.997 0M12 7a5 5 0 015 5c0 1.95-.79 3.71-2.07 4.93A8.003 8.003 0 0012 20a8 8 0 00-4.93-2.07A5 5 0 0112 7z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {/* Auth Buttons */}
            {userEmail ? (
              <>
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="py-1.5 px-3 sm:py-2 sm:px-4 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm sm:text-base transition-colors duration-300"
                  >
                    Admin Panel
                  </button>
                )}
                {!isAdmin && (
                  <button
                    onClick={() => setShowContestRequestModal(true)}
                    className="py-1.5 px-3 sm:py-2 sm:px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm sm:text-base transition-colors duration-300"
                  >
                    Join Contest
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="py-1.5 px-3 sm:py-2 sm:px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold text-sm sm:text-base transition-colors duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setIsRegistering(false);
                  setAuthMessage('');
                }}
                className="py-1.5 px-3 sm:py-2 sm:px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm sm:text-base transition-colors duration-300"
              >
                Login / Signup
              </button>
            )}
          </div>
        </div>

        {/* User Info Display */}
        {userEmail && (
          <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Logged in as: <span className="font-semibold text-blue-600 dark:text-blue-400">{userEmail}</span>
          </p>
        )}

        {/* Typing Test Section */}
        <TypingTest
          textToType={textToType}
          userInput={userInput}
          handleInputChange={handleInputChange}
          isFinished={isFinished}
          isLoading={isLoading}
          error={error}
          userEmail={userEmail}
          elapsedTime={elapsedTime}
          wpm={wpm}
          accuracy={accuracy}
          resetGame={resetGame}
          customText={customText}
          setCustomText={setCustomText}
          useCustomText={useCustomText}
          setUseCustomText={setUseCustomText}
          isDarkMode={isDarkMode}
          isAdmin={isAdmin}
        />

        {/* Leaderboard and User History */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <Leaderboard leaderboard={leaderboard} isDarkMode={isDarkMode} />
          <UserHistory userHistory={userHistory} userEmail={userEmail} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        handleLogin={handleLogin}
        handleSignup={handleSignup}
        authMessage={authMessage}
        isDarkMode={isDarkMode}
      />

      {/* Admin Panel Modal */}
      {isAdmin && (
        <AdminPanel
          showAdminPanel={showAdminPanel}
          setShowAdminPanel={setShowAdminPanel}
          contestTexts={contestTexts}
          handleAddContestText={handleAddContestText}
          handleDeleteContestText={handleDeleteContestText}
          adminMessage={adminMessage}
          isDarkMode={isDarkMode}
          usersData={usersData}
          handleDeleteUserData={handleDeleteUserData}
          handleToggleAdminStatus={handleToggleAdminStatus}
          allPendingContestRequests={allPendingContestRequests}
          handleAcceptJoinRequest={handleAcceptJoinRequest}
          handleRejectJoinRequest={handleRejectJoinRequest}
        />
      )}

      {/* Contest Request Modal */}
      {!isAdmin && userEmail && (
        <ContestRequestModal
          showModal={showContestRequestModal}
          setShowModal={setShowContestRequestModal}
          contestTexts={contestTexts}
          userContestRequests={userContestRequests}
          handleSendJoinRequest={handleSendJoinRequest}
          isDarkMode={isDarkMode}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}

export default App;