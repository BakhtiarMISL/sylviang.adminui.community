import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IChatConversationResponse } from '@core/interfaces/messenger/messenger.interface';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ThreadViewComponent } from '../thread/thread-view.component';

@UntilDestroy()
@Component({
  selector: 'app-messenger-home',
  standalone: false,
  templateUrl: './messenger-home.component.html',
})
export class MessengerHomeComponent implements OnInit {
  @ViewChild(ThreadViewComponent) threadView?: ThreadViewComponent;

  selectedConversationId: number | null = null;
  selectedConversation: IChatConversationResponse | null = null;
  showDetailsPanel = false;
  pickerVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      const idParam = params.get('conversationId');
      this.selectedConversationId = idParam ? Number(idParam) : null;
      if (this.selectedConversationId === null) {
        this.selectedConversation = null;
      }
    });
  }

  onConversationSelected(conversationId: number): void {
    this.router.navigate(['/messenger', conversationId]);
  }

  onConversationLoaded(conversation: IChatConversationResponse): void {
    this.selectedConversation = conversation;
  }

  onConversationCreated(conversationId: number): void {
    this.router.navigate(['/messenger', conversationId]);
  }

  toggleDetailsPanel(): void {
    this.showDetailsPanel = !this.showDetailsPanel;
  }

  onJumpToMessage(chatMessageId: number): void {
    this.threadView?.scrollToMessage(chatMessageId);
  }
}
