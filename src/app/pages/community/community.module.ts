import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PanelModule } from 'primeng/panel';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { TextareaModule } from 'primeng/textarea';
import { TabViewModule } from 'primeng/tabview';
import { MessageModule } from 'primeng/message';
import { SharedModule } from '@shared/shared.module';
import { CommunityRoutingModule } from './community-routing.module';
import { FeedComponent } from './feed/feed.component';
import { PostCardComponent } from './feed/post-card/post-card.component';
import { PostComposerComponent } from './feed/post-composer/post-composer.component';
import { CommentThreadComponent } from './feed/comment-thread/comment-thread.component';
import { ReactionBarComponent } from './feed/reaction-bar/reaction-bar.component';
import { ReactionSummaryComponent } from './feed/reaction-summary/reaction-summary.component';
import { MentionTextareaComponent } from './feed/mention-textarea/mention-textarea.component';
import { PollWidgetComponent } from './feed/poll-widget/poll-widget.component';
import { ReportContentDialogComponent } from './feed/report-content-dialog/report-content-dialog.component';
import { SharePostPickerComponent } from './feed/share-post-picker/share-post-picker.component';
import { GroupsSidebarComponent } from './feed/groups-sidebar/groups-sidebar.component';
import { ProfileSummaryComponent } from './feed/profile-summary/profile-summary.component';
import { TodayEventsCardComponent } from './feed/today-events-card/today-events-card.component';
import { NewJoineesCardComponent } from './feed/new-joinees-card/new-joinees-card.component';
import { ModerationQueueComponent } from './moderation/moderation-queue.component';
import { CommunityProfileEditFormComponent } from './profile/profile-edit-form/profile-edit-form.component';
import { CommunityProfileComponent } from './profile/profile.component';
import { RecognitionsComponent } from './recognitions/recognitions.component';
import { RecognitionCardComponent } from './recognitions/recognition-card/recognition-card.component';
import { RecognitionComposerComponent } from './recognitions/recognition-composer/recognition-composer.component';
import { RecognitionReactionBarComponent } from './recognitions/recognition-reaction-bar/recognition-reaction-bar.component';
import { RecognitionCommentThreadComponent } from './recognitions/recognition-comment-thread/recognition-comment-thread.component';
import { BadgeManagementComponent } from './recognitions/badge-management/badge-management.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { MarketplaceBrowseComponent } from './marketplace/marketplace-browse/marketplace-browse.component';
import { ListingCardComponent } from './marketplace/listing-card/listing-card.component';
import { ListingDetailComponent } from './marketplace/listing-detail/listing-detail.component';
import { ListingFormComponent } from './marketplace/listing-form/listing-form.component';
import { MyListingsComponent } from './marketplace/my-listings/my-listings.component';
import { FavoritesComponent } from './marketplace/favorites/favorites.component';
import { ConversationsInboxComponent } from './marketplace/conversations/conversations-inbox.component';
import { ConversationThreadComponent } from './marketplace/conversations/conversation-thread/conversation-thread.component';
import { ReportListingDialogComponent } from './marketplace/report-listing-dialog/report-listing-dialog.component';
import { RelatedListingsComponent } from './marketplace/related-listings/related-listings.component';
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
import { ElectionsComponent } from './elections/elections.component';
import { ElectionCardComponent } from './elections/election-card/election-card.component';
import { ElectionBuilderComponent } from './elections/election-builder/election-builder.component';
import { ElectionAudienceTargetingComponent } from './elections/election-audience-targeting/election-audience-targeting.component';
import { ElectionCandidatesComponent } from './elections/election-candidates/election-candidates.component';
import { ElectionVoteComponent } from './elections/election-vote/election-vote.component';
import { ElectionResultsComponent } from './elections/election-results/election-results.component';
import { TeamsListComponent } from './teams/teams-list/teams-list.component';
import { TeamFormDialogComponent } from './teams/team-form-dialog/team-form-dialog.component';
import { TeamDetailComponent } from './teams/team-detail/team-detail.component';
import { TeamMembersTabComponent } from './teams/team-detail/team-members-tab/team-members-tab.component';
import { TasksHomeComponent } from './tasks/tasks-home/tasks-home.component';
import { MyTasksListComponent } from './tasks/my-tasks-list/my-tasks-list.component';
import { TaskBoardComponent } from './tasks/task-board/task-board.component';
import { AssignTaskDialogComponent } from './tasks/assign-task-dialog/assign-task-dialog.component';
import { TaskDetailDialogComponent } from './tasks/task-detail-dialog/task-detail-dialog.component';

@NgModule({
  declarations: [
    FeedComponent,
    PostCardComponent,
    PostComposerComponent,
    CommentThreadComponent,
    ReactionBarComponent,
    ReactionSummaryComponent,
    MentionTextareaComponent,
    PollWidgetComponent,
    ReportContentDialogComponent,
    SharePostPickerComponent,
    GroupsSidebarComponent,
    ProfileSummaryComponent,
    TodayEventsCardComponent,
    NewJoineesCardComponent,
    ModerationQueueComponent,
    CommunityProfileComponent,
    CommunityProfileEditFormComponent,
    RecognitionsComponent,
    RecognitionCardComponent,
    RecognitionComposerComponent,
    RecognitionReactionBarComponent,
    RecognitionCommentThreadComponent,
    BadgeManagementComponent,
    MarketplaceComponent,
    MarketplaceBrowseComponent,
    ListingCardComponent,
    ListingDetailComponent,
    ListingFormComponent,
    MyListingsComponent,
    FavoritesComponent,
    ConversationsInboxComponent,
    ConversationThreadComponent,
    ReportListingDialogComponent,
    RelatedListingsComponent,
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
    ElectionsComponent,
    ElectionCardComponent,
    ElectionBuilderComponent,
    ElectionAudienceTargetingComponent,
    ElectionCandidatesComponent,
    ElectionVoteComponent,
    ElectionResultsComponent,
    TeamsListComponent,
    TeamFormDialogComponent,
    TeamDetailComponent,
    TeamMembersTabComponent,
    TasksHomeComponent,
    MyTasksListComponent,
    TaskBoardComponent,
    AssignTaskDialogComponent,
    TaskDetailDialogComponent,
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
    MessageModule,
    DragDropModule,
    CommunityRoutingModule,
  ],
})
export class CommunityModule {}
