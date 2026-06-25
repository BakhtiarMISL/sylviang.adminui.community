import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ShellService } from '@app/shell/services/shell.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MenuService } from '@app/@core/services/menu.service';

@UntilDestroy()
@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  standalone: false,
})
export class ShellComponent implements OnInit {
  isSidebarExpanded = true;
  isMobile = false;
  isMenuLoading = false;
  showLoadingOverlay = false;
  username = '';
  showScrollTop = false;
  private loadingStartTime = 0;
  private minimumLoadingDuration = 3000;
  private mainContentElement: HTMLElement | null = null;

  @ViewChild(SidebarComponent) sidebarComponent!: SidebarComponent;

  constructor(private readonly _menuService: MenuService) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();

    setTimeout(() => {
      this.mainContentElement = document.querySelector('.flex-1.overflow-auto');
      if (this.mainContentElement) {
        this.mainContentElement.addEventListener('scroll', this.onScroll.bind(this));
      }
    }, 100);

    setTimeout(() => {
      this.loadUserData();
    }, 1000);

    this._menuService.loading$.pipe(untilDestroyed(this)).subscribe((loading) => {
      this.isMenuLoading = loading;
      this.handleLoadingState(loading);
    });

    this._menuService.user$.pipe(untilDestroyed(this)).subscribe((user) => {
      if (user && user.username) {
        this.username = user.username;
      }
    });
  }

  private loadUserData(): void {
    try {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        this.username = user.username || 'User';
      } else {
        this.username = 'User';
      }
    } catch {
      this.username = 'User';
    }
  }

  private handleLoadingState(isLoading: boolean): void {
    if (isLoading) {
      this.showLoadingOverlay = true;
      this.loadingStartTime = Date.now();
    } else {
      const elapsedTime = Date.now() - this.loadingStartTime;
      const remainingTime = this.minimumLoadingDuration - elapsedTime;
      if (remainingTime > 0) {
        setTimeout(() => {
          this.showLoadingOverlay = false;
        }, remainingTime);
      } else {
        this.showLoadingOverlay = false;
      }
    }
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 1024;

    if (!this.isMobile && this.sidebarComponent) {
      this.isSidebarExpanded = this.sidebarComponent.desktopExpanded;
    }
  }

  sidebarToggle(toggleState: boolean) {
    if (!this.isMobile) {
      this.isSidebarExpanded = toggleState;
    }
  }

  onSidebarExpandedChange(isExpanded: boolean) {
    if (!this.isMobile) {
      this.isSidebarExpanded = isExpanded;
    }
  }

  onHeaderToggleSidebar() {
    if (this.sidebarComponent) {
      this.sidebarComponent.toggleSidebar();
    }
  }

  get sidebarMargin(): string {
    if (this.isMobile) {
      return '0px';
    }

    if (this.sidebarComponent) {
      return this.sidebarComponent.desktopExpanded ? '248px' : '80px';
    }

    return this.isSidebarExpanded ? '248px' : '80px';
  }

  onScroll(): void {
    if (!this.mainContentElement) return;

    const scrollTop = this.mainContentElement.scrollTop;
    const scrollHeight = this.mainContentElement.scrollHeight;
    const clientHeight = this.mainContentElement.clientHeight;

    const hasScroll = scrollHeight > clientHeight;
    this.showScrollTop = hasScroll && scrollTop > clientHeight / 2;
  }

  scrollToTop(): void {
    if (this.mainContentElement) {
      this.mainContentElement.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }
}
