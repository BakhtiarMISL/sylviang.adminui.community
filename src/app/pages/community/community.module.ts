import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { ReportContentDialogComponent } from './feed/report-content-dialog/report-content-dialog.component';
import { ModerationQueueComponent } from './moderation/moderation-queue.component';
import { CommunityProfileEditFormComponent } from './profile/profile-edit-form/profile-edit-form.component';
import { CommunityProfileComponent } from './profile/profile.component';
import { RecognitionsComponent } from './recognitions/recognitions.component';
import { RecognitionCardComponent } from './recognitions/recognition-card/recognition-card.component';
import { RecognitionComposerComponent } from './recognitions/recognition-composer/recognition-composer.component';
import { RecognitionReactionBarComponent } from './recognitions/recognition-reaction-bar/recognition-reaction-bar.component';
import { RecognitionCommentThreadComponent } from './recognitions/recognition-comment-thread/recognition-comment-thread.component';
import { BadgeManagementComponent } from './recognitions/badge-management/badge-management.component';

@NgModule({
  declarations: [
    FeedComponent,
    PostCardComponent,
    PostComposerComponent,
    CommentThreadComponent,
    ReactionBarComponent,
    MentionTextareaComponent,
    PollWidgetComponent,
    ReportContentDialogComponent,
    ModerationQueueComponent,
    CommunityProfileComponent,
    CommunityProfileEditFormComponent,
    RecognitionsComponent,
    RecognitionCardComponent,
    RecognitionComposerComponent,
    RecognitionReactionBarComponent,
    RecognitionCommentThreadComponent,
    BadgeManagementComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    PanelModule,
    PaginatorModule,
    TextareaModule,
    ProgressBarModule,
    CommunityRoutingModule,
  ],
})
export class CommunityModule {}
