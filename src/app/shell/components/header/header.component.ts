import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbItem, BreadcrumbService } from '@core/services/breadcrumb.service';
import { AuthService } from '@core/services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  menuHidden = true;
  breadcrumbs: BreadcrumbItem[] = [];

  @Input() isSidebarExpanded = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  constructor(
    private readonly _eRef: ElementRef,
    private breadcrumbService: BreadcrumbService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.breadcrumbs$.pipe(untilDestroyed(this)).subscribe((breadcrumbs) => {
      this.breadcrumbs = breadcrumbs;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleMenu(): void {
    this.menuHidden = !this.menuHidden;
  }

  hideMenu(): void {
    this.menuHidden = true;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this._eRef.nativeElement.contains(event.target)) {
      this.hideMenu();
    }
  }
}
