import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { hrAdminGuard } from '@core/guards/hr-admin.guard';
import { FeedComponent } from './feed/feed.component';
import { GroupsListComponent } from './groups/groups-list/groups-list.component';
import { GroupDetailComponent } from './groups/group-detail/group-detail.component';
import { ModerationQueueComponent } from './moderation/moderation-queue.component';
import { CommunityProfileComponent } from './profile/profile.component';
import { RecognitionsComponent } from './recognitions/recognitions.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { ListingDetailComponent } from './marketplace/listing-detail/listing-detail.component';
import { ListingFormComponent } from './marketplace/listing-form/listing-form.component';
import { ConversationThreadComponent } from './marketplace/conversations/conversation-thread/conversation-thread.component';
import { SurveysComponent } from './surveys/surveys.component';
import { SurveyBuilderComponent } from './surveys/survey-builder/survey-builder.component';
import { SurveyTakeComponent } from './surveys/survey-take/survey-take.component';
import { SurveyResultsComponent } from './surveys/survey-results/survey-results.component';
import { ElectionsComponent } from './elections/elections.component';
import { ElectionBuilderComponent } from './elections/election-builder/election-builder.component';
import { ElectionCandidatesComponent } from './elections/election-candidates/election-candidates.component';
import { ElectionVoteComponent } from './elections/election-vote/election-vote.component';
import { ElectionResultsComponent } from './elections/election-results/election-results.component';
import { TeamsListComponent } from './teams/teams-list/teams-list.component';
import { TeamDetailComponent } from './teams/team-detail/team-detail.component';
import { TasksHomeComponent } from './tasks/tasks-home/tasks-home.component';

const routes: Routes = [
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [authGuard],
  },
  {
    path: 'groups',
    component: GroupsListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'groups/:id',
    component: GroupDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'recognitions',
    component: RecognitionsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'surveys',
    component: SurveysComponent,
    canActivate: [authGuard],
  },
  {
    path: 'surveys/create',
    component: SurveyBuilderComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
  {
    path: 'surveys/:id/edit',
    component: SurveyBuilderComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
  {
    path: 'surveys/:id/take',
    component: SurveyTakeComponent,
    canActivate: [authGuard],
  },
  {
    path: 'surveys/:id/results',
    component: SurveyResultsComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
  {
    path: 'elections',
    component: ElectionsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'elections/create',
    component: ElectionBuilderComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
  {
    path: 'elections/:id/edit',
    component: ElectionBuilderComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
  {
    path: 'elections/:id/candidates',
    component: ElectionCandidatesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'elections/:id/vote',
    component: ElectionVoteComponent,
    canActivate: [authGuard],
  },
  {
    path: 'elections/:id/results',
    component: ElectionResultsComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
  {
    // Must come before 'profile/:id' - resolves to the current mock user's own profile.
    path: 'profile/me',
    component: CommunityProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile/:id',
    component: CommunityProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'moderation',
    component: ModerationQueueComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
  {
    path: 'marketplace',
    component: MarketplaceComponent,
    canActivate: [authGuard],
  },
  {
    path: 'marketplace/new',
    component: ListingFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'marketplace/listing/:id',
    component: ListingDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'marketplace/messages/:conversationId',
    component: ConversationThreadComponent,
    canActivate: [authGuard],
  },
  {
    path: 'marketplace/:id/edit',
    component: ListingFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'teams',
    component: TeamsListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'teams/:id',
    component: TeamDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tasks',
    component: TasksHomeComponent,
    canActivate: [authGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommunityRoutingModule {}
