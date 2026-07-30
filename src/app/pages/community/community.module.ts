import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { PanelModule } from 'primeng/panel';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { TextareaModule } from 'primeng/textarea';
import { SharedModule } from '@shared/shared.module';
import { CommunityRoutingModule } from './community-routing.module';
import { FeedComponent } from './feed/feed.component';
import { PostCardComponent } from './feed/post-card/post-card.component';
import { PostComposerComponent } from './feed/post-composer/post-composer.component';
import { CommentThreadComponent } from './feed/comment-thread/comment-thread.component';
import { ReactionBarComponent } from './feed/reaction-bar/reaction-bar.component';
import { MentionTextareaComponent } from './feed/mention-textarea/mention-textarea.component';
import { PollWidgetComponent } from './feed/poll-widget/poll-widget.component';
import { AttachmentUploadComponent } from './feed/attachment-upload/attachment-upload.component';
import { ReportContentDialogComponent } from './feed/report-content-dialog/report-content-dialog.component';
import { ModerationQueueComponent } from './moderation/moderation-queue.component';

@NgModule({
  declarations: [
    FeedComponent,
    PostCardComponent,
    PostComposerComponent,
    CommentThreadComponent,
    ReactionBarComponent,
    MentionTextareaComponent,
    PollWidgetComponent,
    AttachmentUploadComponent,
    ReportContentDialogComponent,
    ModerationQueueComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    PanelModule,
    PaginatorModule,
    TextareaModule,
    ProgressBarModule,
    FileUploadModule,
    CommunityRoutingModule,
  ],
})
export class CommunityModule {}
