import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { ChatDetailsPanelComponent } from './details/chat-details-panel/chat-details-panel.component';
import { ConversationListComponent } from './inbox/conversation-list/conversation-list.component';
import { NewConversationPickerComponent } from './inbox/new-conversation-picker/new-conversation-picker.component';
import { MessengerHomeComponent } from './messenger-home/messenger-home.component';
import { MessengerRoutingModule } from './messenger-routing.module';
import { ForwardMessagePickerComponent } from './thread/forward-message-picker/forward-message-picker.component';
import { MessageBubbleComponent } from './thread/message-bubble/message-bubble.component';
import { MessageComposerComponent } from './thread/message-composer/message-composer.component';
import { ReportMessageDialogComponent } from './thread/report-message-dialog/report-message-dialog.component';
import { ThreadViewComponent } from './thread/thread-view.component';

@NgModule({
  declarations: [
    MessengerHomeComponent,
    ConversationListComponent,
    NewConversationPickerComponent,
    ThreadViewComponent,
    MessageBubbleComponent,
    MessageComposerComponent,
    ChatDetailsPanelComponent,
    ReportMessageDialogComponent,
    ForwardMessagePickerComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, MessengerRoutingModule, DialogModule, SkeletonModule],
})
export class MessengerModule {}
