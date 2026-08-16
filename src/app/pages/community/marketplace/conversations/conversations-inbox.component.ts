import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IEmployeeResponse } from '@core/interfaces/employee-directory/employee.interface';
import { IConversationResponse, IListingResponse } from '@core/interfaces/community/marketplace.interface';
import { ConversationService } from '@core/services/community/conversation.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { ListingService } from '@core/services/community/listing.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface IConversationRow {
  conversation: IConversationResponse;
  listing: IListingResponse | null;
  otherParticipant: IEmployeeResponse | null;
}

/** US-6.5: central inbox of the caller's marketplace conversations. */
@Component({
  selector: 'app-conversations-inbox',
  standalone: false,
  templateUrl: './conversations-inbox.component.html',
  styleUrl: './conversations-inbox.component.scss',
})
export class ConversationsInboxComponent implements OnInit {
  rows: IConversationRow[] = [];
  loading = true;

  constructor(
    private conversationService: ConversationService,
    private listingService: ListingService,
    private employeeLookupService: EmployeeLookupService,
    private currentUserService: CurrentUserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  openThread(row: IConversationRow): void {
    this.router.navigate(['/community/marketplace/messages', row.conversation.conversationId]);
  }

  private load(): void {
    this.loading = true;

    this.conversationService.getPaged({ page: 1, pageSize: 50, sortBy: 'createdAt', sortDirection: 'desc' }).subscribe({
      next: (response) => {
        const conversations = !response.hasError && response.content ? response.content.data || [] : [];
        if (!conversations.length) {
          this.rows = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        const employeeId = this.currentUserService.currentUser.employeeId;

        const enrichCalls = conversations.map((conversation) =>
          forkJoin({
            listing: this.listingService.getById(conversation.listingId).pipe(catchError(() => of(null))),
            otherParticipant: (() => {
              const other = conversation.participants.find((p) => p.employeeId !== employeeId);
              return other ? this.employeeLookupService.getById(other.employeeId) : of(null);
            })(),
          }),
        );

        forkJoin(enrichCalls).subscribe((enriched) => {
          this.rows = conversations.map((conversation, index) => ({
            conversation,
            listing: enriched[index].listing && !enriched[index].listing!.hasError ? enriched[index].listing!.content : null,
            otherParticipant: enriched[index].otherParticipant,
          }));
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
