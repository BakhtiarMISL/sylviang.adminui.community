import { Injectable } from '@angular/core';
import { IMentionTag } from '@core/interfaces/community/mention.interface';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { MentionService } from '@core/services/community/mention.service';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

/**
 * Resolves a Post/PostComment's recorded Mention rows into {employeeId, employeeName}
 * pairs, then turns matching "@Name" substrings in its content into clickable profile
 * links. Shared by post-card and comment-thread so the escape/replace logic - and the
 * "duplicate employee name" caveat it has to account for - lives in exactly one place.
 */
@Injectable({
  providedIn: 'root',
})
export class MentionRenderService {
  constructor(
    private mentionService: MentionService,
    private employeeLookupService: EmployeeLookupService,
  ) {}

  loadMentionLinks(entityType: 'Post' | 'PostComment', entityId: number): Observable<IMentionTag[]> {
    return this.mentionService.getByEntity(entityType, entityId).pipe(
      switchMap((response) => {
        if (response.hasError || !response.content || response.content.length === 0) return of([]);

        const uniqueIds = Array.from(new Set(response.content.map((m) => m.mentionedEmployeeId)));
        const lookups = uniqueIds.map((id) =>
          this.employeeLookupService.getById(id).pipe(map((employee): IMentionTag | null => (employee?.employeeName ? { employeeId: id, employeeName: employee.employeeName } : null))),
        );

        return forkJoin(lookups).pipe(map((results) => results.filter((r): r is IMentionTag => r !== null)));
      }),
    );
  }

  /**
   * Escapes the raw content first (so a post/comment can never inject arbitrary HTML), then
   * replaces "@Name" substrings matching a resolved mention with an anchor tag. Longest names
   * are replaced first so one mentioned name can't accidentally swallow part of another's.
   */
  renderContent(content: string | null | undefined, mentionLinks: IMentionTag[]): string {
    let escaped = this.escapeHtml(content ?? '');

    const sortedByNameLength = [...mentionLinks].sort((a, b) => b.employeeName.length - a.employeeName.length);
    for (const link of sortedByNameLength) {
      const escapedName = this.escapeHtml(link.employeeName);
      const pattern = new RegExp(`@${this.escapeRegExp(escapedName)}`, 'g');
      escaped = escaped.replace(
        pattern,
        `<a class="mention-link" href="/community/profile/${link.employeeId}" data-employee-id="${link.employeeId}">@${escapedName}</a>`,
      );
    }

    return escaped;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
