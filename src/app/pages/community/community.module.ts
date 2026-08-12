import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PanelModule } from 'primeng/panel';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { TextareaModule } from 'primeng/textarea';
import { TabViewModule } from 'primeng/tabview';
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
import { GroupsSidebarComponent } from './feed/groups-sidebar/groups-sidebar.component';
import { ModerationQueueComponent } from './moderation/moderation-queue.component';
import { CommunityProfileEditFormComponent } from './profile/profile-edit-form/profile-edit-form.component';
import { CommunityProfileComponent } from './profile/profile.component';
import { RecognitionsComponent } from './recognitions/recognitions.component';
import { RecognitionCardComponent } from './recognitions/recognition-card/recognition-card.component';
import { RecognitionComposerComponent } from './recognitions/recognition-composer/recognition-composer.component';
import { RecognitionReactionBarComponent } from './recognitions/recognition-reaction-bar/recognition-reaction-bar.component';
import { RecognitionCommentThreadComponent } from './recognitions/recognition-comment-thread/recognition-comment-thread.component';
import { BadgeManagementComponent } from './recognitions/badge-management/badge-management.component';
import { GroupsListComponent } from './groups/groups-list/groups-list.component';
import { GroupFormDialogComponent } from './groups/group-form-dialog/group-form-dialog.component';
import { GroupDetailComponent } from './groups/group-detail/group-detail.component';
import { GroupMembersTabComponent } from './groups/group-members-tab/group-members-tab.component';
import { GroupJoinRequestsTabComponent } from './groups/group-join-requests-tab/group-join-requests-tab.component';
import { GroupPostsTabComponent } from './groups/group-posts-tab/group-posts-tab.component';
import { SurveysComponent } from './surveys/surveys.component';
import { SurveyCardComponent } from './surveys/survey-card/survey-card.component';
import { SurveyBuilderComponent } from './surveys/survey-builder/survey-builder.component';
import { SurveyAudienceTargetingComponent } from './surveys/survey-audience-targeting/survey-audience-targeting.component';
import { SurveyTakeComponent } from './surveys/survey-take/survey-take.component';
import { SurveyResultsComponent } from './surveys/survey-results/survey-results.component';

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
    GroupsSidebarComponent,
    ModerationQueueComponent,
    CommunityProfileComponent,
    CommunityProfileEditFormComponent,
    RecognitionsComponent,
    RecognitionCardComponent,
    RecognitionComposerComponent,
    RecognitionReactionBarComponent,
    RecognitionCommentThreadComponent,
    BadgeManagementComponent,
    GroupsListComponent,
    GroupFormDialogComponent,
    GroupDetailComponent,
    GroupMembersTabComponent,
    GroupJoinRequestsTabComponent,
    GroupPostsTabComponent,
    SurveysComponent,
    SurveyCardComponent,
    SurveyBuilderComponent,
    SurveyAudienceTargetingComponent,
    SurveyTakeComponent,
    SurveyResultsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    PanelModule,
    PaginatorModule,
    TextareaModule,
    ProgressBarModule,
    TabViewModule,
    DragDropModule,
    CommunityRoutingModule,
  ],
})
export class CommunityModule {}
