import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage Firestore quota limits
 * Blocks write operations when quota is exceeded until 4:00 PM PHT daily reset
 */
export const useFirestoreQuota = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // 🕓 Compute next Firestore reset time (4:00 PM PHT daily)
  const getNextResetTimePHT = useCallback(() => {
    const now = new Date();
    const reset = new Date();
    reset.setHours(16, 0, 0, 0); // 4:00 PM local time (PHT)
    if (now > reset) reset.setDate(reset.getDate() + 1);
    return reset;
  }, []);

  // ⏳ Convert ms → hh:mm:ss format
  const formatTime = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }, []);

  // 🧭 On mount: check localStorage if currently blocked
  useEffect(() => {
    const savedUntil = localStorage.getItem("firestoreBlockedUntil");
    if (savedUntil && new Date() < new Date(savedUntil)) {
      setIsBlocked(true);
      setBlockedUntil(new Date(savedUntil));
    } else {
      localStorage.removeItem("firestoreBlockedUntil");
      setIsBlocked(false);
    }
  }, []);

  // ⏰ Live countdown update
  useEffect(() => {
    if (!isBlocked || !blockedUntil) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = new Date(blockedUntil) - now;

      if (diff <= 0) {
        clearInterval(interval);
        localStorage.removeItem("firestoreBlockedUntil");
        setIsBlocked(false);
        setTimeLeft("");
      } else {
        setTimeLeft(formatTime(diff));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlocked, blockedUntil, formatTime]);

  /**
   * Handle Firestore quota exceeded error
   * Sets block until next reset time
   */
  const handleQuotaExceeded = useCallback(() => {
    const nextReset = getNextResetTimePHT();
    localStorage.setItem("firestoreBlockedUntil", nextReset);
    setBlockedUntil(nextReset);
    setIsBlocked(true);
    
    return {
      blocked: true,
      resetTime: nextReset,
      message: `⚠️ Firestore quota exceeded! You can add data again at ${nextReset.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })}.`
    };
  }, [getNextResetTimePHT]);

  /**
   * Wrapper function for Firestore write operations
   * Checks quota before executing and handles quota errors
   * @param {Function} firestoreOperation - The async Firestore operation to execute
   * @returns {Promise} Result of the operation with quota handling
   */
  const executeWithQuotaCheck = useCallback(async (firestoreOperation) => {
    // Check if currently blocked
    if (isBlocked) {
      return {
        success: false,
        error: "Firestore quota exceeded. Please wait for reset.",
        quotaExceeded: true,
        resetTime: blockedUntil
      };
    }

    try {
      // Execute the Firestore operation
      const result = await firestoreOperation();
      return result;
    } catch (error) {
      // Check if error is quota-related
      if (error.code === 'resource-exhausted' || 
          error.message?.includes('quota') || 
          error.message?.includes('RESOURCE_EXHAUSTED')) {
        
        const quotaInfo = handleQuotaExceeded();
        return {
          success: false,
          error: quotaInfo.message,
          quotaExceeded: true,
          resetTime: quotaInfo.resetTime
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }, [isBlocked, blockedUntil, handleQuotaExceeded]);

  /**
   * Manually reset quota block (for testing or admin override)
   */
  const resetQuotaBlock = useCallback(() => {
    localStorage.removeItem("firestoreBlockedUntil");
    setIsBlocked(false);
    setBlockedUntil(null);
    setTimeLeft("");
  }, []);

  return {
    isBlocked,
    blockedUntil,
    timeLeft,
    executeWithQuotaCheck,
    handleQuotaExceeded,
    resetQuotaBlock,
    getNextResetTimePHT
  };
};
