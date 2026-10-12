import { doc, getDoc } from 'firebase/firestore';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Loads a municipality's weekly report from Firestore, handling:
 * 1. Split document format (${monthYear}_summary with _week1, _week2, etc.)
 * 2. Single document format (${monthYear})
 * 3. Legacy document format (commandCenter/weeklyReports_${monthYear}_${municipality})
 */
export async function fetchMunicipalWeeklyReport(db, municipality, monthYear) {
  if (!db || !municipality || !monthYear) {
    return { success: false, weeklyReportData: {} };
  }

  try {
    // 1. Check if document is split by weeks
    const summaryDocRef = doc(db, 'commandCenter', 'weeklyReports', municipality, `${monthYear}_summary`);
    const summarySnap = await getDoc(summaryDocRef);

    if (summarySnap.exists() && summarySnap.data()?.isSplit) {
      const summaryData = summarySnap.data();
      const weeks = summaryData.weeks || [];
      const weekPromises = weeks.map(async (weekInfo) => {
        try {
          const weekDocRef = doc(db, 'commandCenter', 'weeklyReports', municipality, `${monthYear}_week${weekInfo.weekNumber}`);
          const weekSnap = await getDoc(weekDocRef);
          return weekSnap.exists() ? weekSnap.data() : null;
        } catch {
          return null;
        }
      });

      const weekDocs = await Promise.all(weekPromises);
      const mergedWeeklyData = {};
      weekDocs.forEach((weekDoc) => {
        if (weekDoc?.weeklyReportData) {
          Object.assign(mergedWeeklyData, weekDoc.weeklyReportData);
        }
      });

      return {
        success: true,
        isSplit: true,
        data: {
          ...summaryData,
          weeklyReportData: mergedWeeklyData
        },
        weeklyReportData: mergedWeeklyData
      };
    }

    // 2. Check standard single document
    const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const docData = docSnap.data();
      const weeklyData =
        docData.weeklyReportData ||
        docData.data?.weeklyReportData ||
        docData.data ||
        {};

      return {
        success: true,
        isSplit: false,
        data: docData,
        weeklyReportData: weeklyData
      };
    }

    // 3. Fallback to legacy structure: commandCenter/weeklyReports_${monthYear}_${municipality}
    const legacyDocRef = doc(db, 'commandCenter', `weeklyReports_${monthYear}_${municipality}`);
    const legacySnap = await getDoc(legacyDocRef);

    if (legacySnap.exists()) {
      const legacyData = legacySnap.data();
      const weeklyData =
        legacyData.weeklyReportData ||
        legacyData.data?.weeklyReportData ||
        legacyData.data ||
        {};

      return {
        success: true,
        isSplit: false,
        data: legacyData,
        weeklyReportData: weeklyData
      };
    }

    return { success: false, weeklyReportData: {} };
  } catch (error) {
    console.error(`Error loading weekly report for ${municipality} (${monthYear}):`, error);
    return { success: false, weeklyReportData: {}, error };
  }
}

/**
 * Counts after-photos in an entry across rows or legacy direct after photo array/string.
 */
export function countEntryAfterPhotos(entry) {
  if (!entry || !entry.photos) return 0;

  // New format: photos.rows array
  if (entry.photos.rows && Array.isArray(entry.photos.rows)) {
    return entry.photos.rows.reduce((sum, row) => {
      if (row.after && Array.isArray(row.after)) {
        return sum + row.after.length;
      }
      return sum;
    }, 0);
  }

  // Old format: direct photos.after
  if (entry.photos.after) {
    if (Array.isArray(entry.photos.after)) {
      return entry.photos.after.length;
    }
    return 1;
  }

  return 0;
}

/**
 * Determines week index (0 to 3) for a given dateKey string (e.g. "October 1, 2026").
 * Day 1-7: Week 1 (0)
 * Day 8-14: Week 2 (1)
 * Day 15-21: Week 3 (2)
 * Day 22-31: Week 4 (3)
 */
export function getWeekIndexFromDate(dateKey) {
  if (!dateKey) return 0;
  const parsed = new Date(dateKey);
  let day = !isNaN(parsed.getTime()) ? parsed.getDate() : NaN;

  if (isNaN(day)) {
    const match = String(dateKey).match(/\b(\d{1,2})\b/);
    day = match ? parseInt(match[1], 10) : 1;
  }

  return Math.min(Math.floor((day - 1) / 7), 3);
}

/**
 * Calculates weekly action counts [week1, week2, week3, week4] and totalActionTaken
 * for a municipality's weekly report data according to the system's counting rules.
 * Strictly filters dates to the specified month and year, matching CommandCenter.jsx.
 */
export function calculateWeeklyActionCounts(weeklyReportData, monthIndex, year) {
  const counts = [0, 0, 0, 0];
  if (!weeklyReportData || typeof weeklyReportData !== 'object') {
    return { counts, totalActionTaken: 0, performancePercentage: 0 };
  }

  let parsedMonthIndex = 0;
  let monthName = "";

  if (typeof monthIndex === 'string') {
    const idx = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthIndex.toLowerCase());
    if (idx !== -1) {
      parsedMonthIndex = idx;
      monthName = MONTH_NAMES[idx];
    } else {
      const num = parseInt(monthIndex, 10);
      if (!isNaN(num)) {
        parsedMonthIndex = num > 0 && num <= 12 ? num - 1 : num;
        monthName = MONTH_NAMES[parsedMonthIndex] || "";
      }
    }
  } else if (typeof monthIndex === 'number') {
    parsedMonthIndex = monthIndex;
    monthName = MONTH_NAMES[monthIndex] || "";
  }

  const parsedYear = parseInt(year, 10);

  const isAprilToDecember2026OrLater =
    (parsedYear === 2026 && parsedMonthIndex >= 3) ||
    (parsedYear > 2026 && parsedMonthIndex >= 3);
  const isMarchToOctober = parsedMonthIndex >= 2 && parsedMonthIndex <= 9;

  Object.entries(weeklyReportData).forEach(([dateKey, entries]) => {
    if (!Array.isArray(entries)) return;

    // Filter: STRICTLY only include dates that belong to the selected month and year
    const dateMatchesString =
      monthName &&
      parsedYear &&
      dateKey.startsWith(monthName + ' ') &&
      dateKey.endsWith(', ' + parsedYear);

    const entryDate = new Date(dateKey);
    const dateMatchesParsed =
      !isNaN(entryDate.getTime()) &&
      entryDate.getMonth() === parsedMonthIndex &&
      entryDate.getFullYear() === parsedYear;

    if (!dateMatchesString && !dateMatchesParsed) {
      return; // Skip dates from other months or years!
    }

    const day = !isNaN(entryDate.getTime())
      ? entryDate.getDate()
      : parseInt(dateKey.match(/\b(\d{1,2})\b/)?.[1] || '1', 10);

    const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
    if (weekIndex < 0 || weekIndex > 3) return;

    entries.forEach((entry) => {
      if (!entry) return;

      // Must have actionTaken specified (same as CommandCenter)
      if (!entry.actionTaken || String(entry.actionTaken).trim() === '') return;

      let countValue = 0;

      if (isAprilToDecember2026OrLater) {
        // Count based on after-photos
        countValue = countEntryAfterPhotos(entry);
      } else if (isMarchToOctober) {
        // March to October (2025 and earlier): count based on actionTaken text
        countValue = 1;
      } else {
        // Legacy months: count based on after-photos
        countValue = countEntryAfterPhotos(entry);
      }

      if (countValue > 0) {
        counts[weekIndex] += countValue;
      }
    });
  });

  const totalActionTaken = counts.reduce((sum, c) => sum + (c || 0), 0);
  const WEEKLY_MIN = 98;
  const totalMinimum = WEEKLY_MIN * 4; // 392
  const performancePercentage = Math.min(Math.floor((totalActionTaken / totalMinimum) * 100), 100);

  return { counts, totalActionTaken, performancePercentage };
}
