import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { hrAdminGuard } from '@core/guards/hr-admin.guard';
import { FeedComponent } from './feed/feed.component';
import { ModerationQueueComponent } from './moderation/moderation-queue.component';
import { CommunityProfileComponent } from './profile/profile.component';
import { RecognitionsComponent } from './recognitions/recognitions.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { ListingDetailComponent } from './marketplace/listing-detail/listing-detail.component';
import { ListingFormComponent } from './marketplace/listing-form/listing-form.component';
import { ConversationThreadComponent } from './marketplace/conversations/conversation-thread/conversation-thread.component';

const routes: Routes = [
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [authGuard],
  },
  {
    path: 'recognitions',
    component: RecognitionsComponent,
    canActivate: [authGuard],
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommunityRoutingModule {}
