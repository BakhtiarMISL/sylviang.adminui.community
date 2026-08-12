import { Injectable } from '@angular/core';

const STORAGE_KEY = 'ces_survey_responded_ids';

/**
 * Tracks which surveys the current employee has already submitted a response to, purely
 * client-side. The backend has no "have I responded" read endpoint for non-HR callers
 * (GET .../responses is HRAdminOnly) - SubmitResponse is the only survey-taking signal
 * available to an employee, so this records success/duplicate outcomes locally per
 * employeeId. It will not reflect responses submitted from another device/browser.
 */
@Injectable({
  providedIn: 'root',
})
export class SurveyResponseTrackerService {
  private read(employeeId: number): Set<number> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${employeeId}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  hasResponded(employeeId: number | null, surveyId: number): boolean {
    if (employeeId === null) return false;
    return this.read(employeeId).has(surveyId);
  }

  markResponded(employeeId: number | null, surveyId: number): void {
    if (employeeId === null) return;
    try {
      const ids = this.read(employeeId);
      ids.add(surveyId);
      localStorage.setItem(`${STORAGE_KEY}_${employeeId}`, JSON.stringify([...ids]));
    } catch {
      // localStorage unavailable - tracking just won't persist.
    }
  }
}
