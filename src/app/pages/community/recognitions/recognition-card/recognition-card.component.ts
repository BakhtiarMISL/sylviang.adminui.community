import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { IRecognitionResponse } from '@core/interfaces/community/recognition.interface';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { RecognitionCommentService } from '@core/services/community/recognition-comment.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-recognition-card',
  standalone: false,
  templateUrl: './recognition-card.component.html',
  styleUrl: './recognition-card.component.scss',
})
export class RecognitionCardComponent implements OnInit {
  @Input({ required: true }) recognition!: IRecognitionResponse;

  senderName = 'Loading...';
  recipientName = 'Loading...';
  showComments = false;
  commentCount = 0;

  constructor(
    private employeeLookupService: EmployeeLookupService,
    private recognitionCommentService: RecognitionCommentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.employeeLookupService
      .getById(this.recognition.senderId)
      .pipe(untilDestroyed(this))
      .subscribe((employee) => {
        this.senderName = employee?.employeeName ?? `Employee #${this.recognition.senderId}`;
        this.cdr.detectChanges();
      });

    this.employeeLookupService
      .getById(this.recognition.recipientId)
      .pipe(untilDestroyed(this))
      .subscribe((employee) => {
        this.recipientName = employee?.employeeName ?? `Employee #${this.recognition.recipientId}`;
        this.cdr.detectChanges();
      });

    this.recognitionCommentService
      .getAll(this.recognition.recognitionId)
      .pipe(untilDestroyed(this))
      .subscribe((response) => {
        if (!response.hasError && response.content) {
          this.commentCount = response.content.length;
          this.cdr.detectChanges();
        }
      });
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  onCommentCountChanged(count: number): void {
    this.commentCount = count;
  }
}
