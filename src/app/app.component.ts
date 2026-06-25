import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <p-toast class="z-[999]" />
    <p-confirmdialog class="z-[999]" />
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  title = 'sylviang.adminui.template';
}
