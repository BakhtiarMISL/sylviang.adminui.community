import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IConversationResponse, IListingResponse, IMessageResponse } from '@core/interfaces/community/marketplace.interface';
import { ConversationService } from '@core/services/community/conversation.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { ListingService } from '@core/services/community/listing.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';
import { catchError, of } from 'rxjs';

/** US-6.4/6.5: message list + composer for a single marketplace conversation. */
@Component({
  selector: 'app-conversation-thread',
  standalone: false,
  templateUrl: './conversation-thread.component.html',
  styleUrl: './conversation-thread.component.scss',
})
export class ConversationThreadComponent implements OnInit {
  conversation: IConversationResponse | null = null;
  listing: IListingResponse | null = null;
  messages: IMessageResponse[] = [];
  senderNames = new Map<number, string>();

  loading = true;
  sending = false;
  messageText = '';

  constructor(
    private route: ActivatedRoute,
    private conversationService: ConversationService,
    private listingService: ListingService,
    private employeeLookupService: EmployeeLookupService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  get conversationId(): number {
    return Number(this.route.snapshot.paramMap.get('conversationId'));
  }

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  get isClosed(): boolean {
    return this.conversation?.status === 'Closed';
  }

  ngOnInit(): void {
    this.load();
  }

  sendMessage(): void {
    if (!this.messageText.trim() || this.isClosed) return;

    this.sending = true;
    this.conversationService.sendMessage(this.conversationId, { messageText: this.messageText.trim() }).subscribe({
      next: (response) => {
        this.sending = false;
        if (!response.hasError) {
          this.messageText = '';
          this.loadMessages();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not send message.' });
        }
      },
      error: () => {
        this.sending = false;
        this.toastService.error({ detail: 'Could not send message.' });
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.conversationService.getById(this.conversationId).subscribe((response) => {
      if (!response.hasError && response.content) {
        this.conversation = response.content;

        this.listingService
          .getById(this.conversation.listingId)
          .pipe(catchError(() => of(null)))
          .subscribe((listingResponse) => {
            this.listing = listingResponse && !listingResponse.hasError ? listingResponse.content : null;
            this.cdr.detectChanges();
          });

        this.conversation.participants.forEach((participant) => {
          this.employeeLookupService.getById(participant.employeeId).subscribe((employee) => {
            this.senderNames.set(participant.employeeId, employee?.employeeName || 'Unknown');
            this.cdr.detectChanges();
          });
        });
      }
      this.loadMessages();
    });
  }

  private loadMessages(): void {
    this.conversationService.getMessages(this.conversationId).subscribe({
      next: (response) => {
        this.messages = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
