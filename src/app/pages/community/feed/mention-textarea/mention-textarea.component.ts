import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IMentionTag } from '@core/interfaces/community/mention.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';

/**
 * Plain textarea with inline "@name" mention detection (US-3.5/3.14) - typing "@" followed by
 * characters opens a colleague picker anchored under the caret; selecting one inserts
 * "@DisplayName " into the text and tracks {employeeId, employeeName} in `mentions`.
 *
 * Frontend-resolved, not server-parsed: Employee.EmployeeName has no uniqueness constraint,
 * so matching raw "@Name" text to an employee server-side would risk mentioning the wrong
 * person for duplicate names. The employeeId is captured at selection time, when it's
 * unambiguous, and sent alongside the content as MentionedEmployeeIds.
 *
 * `mentions` is reconciled on every keystroke: if the user edits away a tracked mention's
 * "@Name" substring, it's dropped from the list, so MentionedEmployeeIds only ever reflects
 * mentions that are still actually present in the text.
 */
@Component({
  selector: 'app-mention-textarea',
  standalone: false,
  templateUrl: './mention-textarea.component.html',
  styleUrl: './mention-textarea.component.scss',
})
export class MentionTextareaComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  @Input() mentions: IMentionTag[] = [];
  @Output() mentionsChange = new EventEmitter<IMentionTag[]>();

  @Input() placeholder = '';
  @Input() rows = 3;

  @ViewChild('textareaRef') textareaRef?: ElementRef<HTMLTextAreaElement>;

  suggestions: IMentionTag[] = [];
  showDropdown = false;
  activeSuggestionIndex = 0;

  private mentionStartIndex: number | null = null;
  private searchToken = 0;

  constructor(private employeeService: EmployeeService) {}

  onInput(): void {
    this.value = this.textareaRef?.nativeElement.value ?? this.value;
    this.reconcileMentions();
    this.valueChange.emit(this.value);
    this.detectMentionTrigger();
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown || this.suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.suggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + this.suggestions.length) % this.suggestions.length;
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      this.selectSuggestion(this.suggestions[this.activeSuggestionIndex]);
    } else if (event.key === 'Escape') {
      this.showDropdown = false;
    }
  }

  selectSuggestion(tag: IMentionTag): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea || this.mentionStartIndex === null) return;

    const cursorPos = textarea.selectionStart;
    const before = this.value.substring(0, this.mentionStartIndex);
    const after = this.value.substring(cursorPos);
    const insertedText = `@${tag.employeeName} `;

    this.value = `${before}${insertedText}${after}`;
    this.valueChange.emit(this.value);

    if (!this.mentions.some((m) => m.employeeId === tag.employeeId)) {
      this.mentions = [...this.mentions, tag];
      this.mentionsChange.emit(this.mentions);
    }

    this.showDropdown = false;
    this.mentionStartIndex = null;

    const newCursorPos = before.length + insertedText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }

  private detectMentionTrigger(): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const beforeCursor = this.value.substring(0, cursorPos);
    const match = /(?:^|\s)@([^\s@]*)$/.exec(beforeCursor);

    if (!match) {
      this.showDropdown = false;
      this.mentionStartIndex = null;
      return;
    }

    this.mentionStartIndex = match.index + (match[0].startsWith('@') ? 0 : 1);
    this.activeSuggestionIndex = 0;
    this.search(match[1]);
  }

  private search(term: string): void {
    const token = ++this.searchToken;

    this.employeeService.getDirectoryPaginated({ searchTerm: term, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        if (token !== this.searchToken) return; // a newer keystroke superseded this search

        if (!response.hasError && response.content) {
          const alreadyMentionedIds = new Set(this.mentions.map((m) => m.employeeId));
          this.suggestions = response.content.data
            .filter((e) => !alreadyMentionedIds.has(e.employeeId))
            .map((e) => ({ employeeId: e.employeeId, employeeName: e.employeeName ?? `Employee #${e.employeeId}` }));
          this.showDropdown = this.suggestions.length > 0;
        } else {
          this.suggestions = [];
          this.showDropdown = false;
        }
      },
      error: () => {
        this.suggestions = [];
        this.showDropdown = false;
      },
    });
  }

  private reconcileMentions(): void {
    if (this.mentions.length === 0) return;

    const stillPresent = this.mentions.filter((m) => this.value.includes(`@${m.employeeName}`));
    if (stillPresent.length !== this.mentions.length) {
      this.mentions = stillPresent;
      this.mentionsChange.emit(this.mentions);
    }
  }
}
