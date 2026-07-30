import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { hrAdminGuard } from '@core/guards/hr-admin.guard';
import { FeedComponent } from './feed/feed.component';
import { ModerationQueueComponent } from './moderation/moderation-queue.component';

const routes: Routes = [
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [authGuard],
  },
  {
    path: 'moderation',
    component: ModerationQueueComponent,
    canActivate: [authGuard, hrAdminGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommunityRoutingModule {}
