import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { MessengerHomeComponent } from './messenger-home/messenger-home.component';

const routes: Routes = [
  {
    path: '',
    component: MessengerHomeComponent,
    canActivate: [authGuard],
  },
  {
    path: ':conversationId',
    component: MessengerHomeComponent,
    canActivate: [authGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MessengerRoutingModule {}
