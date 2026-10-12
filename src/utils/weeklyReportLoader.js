import { doc, getDoc } from 'firebase/firestore';

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

  if (day <= 7) return 0;
  if (day <= 14) return 1;
  if (day <= 21) return 2;
  return 3;
}

/**
 * Calculates weekly action counts [week1, week2, week3, week4] and totalActionTaken
 * for a municipality's weekly report data according to the system's counting rules.
 */
export function calculateWeeklyActionCounts(weeklyReportData, monthIndex, year) {
  const counts = [0, 0, 0, 0];
  if (!weeklyReportData || typeof weeklyReportData !== 'object') {
    return { counts, totalActionTaken: 0 };
  }

  const isAprilToDecember2026OrLater =
    (year === 2026 && monthIndex >= 3) ||
    (year > 2026 && monthIndex >= 3);
  const isMarchToOctober = monthIndex >= 2 && monthIndex <= 9;

  Object.entries(weeklyReportData).forEach(([dateKey, entries]) => {
    if (!Array.isArray(entries)) return;

    const weekIndex = getWeekIndexFromDate(dateKey);
    if (weekIndex < 0 || weekIndex > 3) return;

    entries.forEach((entry) => {
      if (!entry) return;

      let shouldCount = false;
      let countValue = 0;

      if (isAprilToDecember2026OrLater) {
        // Count based on after-photos
        const totalAfter = countEntryAfterPhotos(entry);
        shouldCount = totalAfter > 0;
        countValue = totalAfter;
      } else if (isMarchToOctober) {
        // March to October (2025 and earlier): count based on actionTaken text
        shouldCount = entry.actionTaken && String(entry.actionTaken).trim() !== '';
        countValue = shouldCount ? 1 : 0;
      } else {
        // Legacy months: count based on after-photos
        const totalAfter = countEntryAfterPhotos(entry);
        shouldCount = totalAfter > 0;
        countValue = totalAfter;
      }

      if (shouldCount) {
        counts[weekIndex] += countValue;
      }
    });
  });

  const totalActionTaken = counts.reduce((sum, c) => sum + (c || 0), 0);
  return { counts, totalActionTaken };
}
