import { Component, OnInit, Output, EventEmitter, OnDestroy, Input, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { NavMode, ShellService } from '@app/shell/services/shell.service';
import { Theme, ThemeService } from '@app/shell/services/theme.service';
import { MenuService } from '@app/@core/services/menu.service';
import type { IMenuItem } from '@app/@core/interfaces/menuResponse.interface';

interface MenuItemClickEvent {
  item: IMenuItem;
  path: number[];
}

interface MenuToggleEvent {
  path: number[];
  expanded: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false,
})
export class SidebarComponent implements OnInit, OnDestroy {
  year: number = new Date().getFullYear();
  sidebarItems: IMenuItem[] = [];
  sidebarExtendedItem = -1;
  navExpanded = true;
  isDarkTheme = false;
  isHovered = false;
  hoverTimeout: any;
  previousExpandedItem = -1;
  isLoadingMenu = false;

  isMobile = false;
  mobileOverlayVisible = false;
  desktopExpanded = true;

  @Input() externalToggle = false;
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Output() sidebarExpandedChange = new EventEmitter<boolean>();

  constructor(
    private readonly _router: Router,
    public shellService: ShellService,
    private themeService: ThemeService,
    private menuService: MenuService,
  ) {
    this.sidebarItems = [];
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.checkScreenSize();

    this.menuService.loading$.pipe(untilDestroyed(this)).subscribe((loading) => {
      this.isLoadingMenu = loading;
    });

    this.menuService.menu$.pipe(untilDestroyed(this)).subscribe((menuItems) => {
      if (menuItems && menuItems.length > 0) {
        this.sidebarItems = menuItems;
        this.shellService.activeNavTab(this.sidebarItems, this.sidebarExtendedItem);
      }
    });

    this._router.events
      .pipe(untilDestroyed(this))
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.menuService.updateActiveMenuItem(event.urlAfterRedirects || event.url);
        this.shellService.activeNavTab(this.sidebarItems, this.sidebarExtendedItem);
        if (this.isMobile && this.mobileOverlayVisible) {
          this.closeMobileSidebar();
        }
      });

    this.shellService.navMode$.pipe(untilDestroyed(this)).subscribe((mode) => {
      if (!this.isMobile) {
        this.navExpanded = mode === NavMode.Free;
        this.desktopExpanded = this.navExpanded;
        this.sidebarExpandedChange.emit(this.navExpanded);
      }
    });

    this.getCurrentTheme();
  }

  ngOnDestroy(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  ngOnChanges(): void {
    if (this.externalToggle !== undefined) {
      this.toggleSidebar();
    }
  }

  checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 1024;

    if (wasMobile && !this.isMobile) {
      this.mobileOverlayVisible = false;
      this.navExpanded = this.desktopExpanded;
    } else if (!wasMobile && this.isMobile) {
      this.desktopExpanded = this.navExpanded;
      this.mobileOverlayVisible = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.toggleMobileSidebar();
    } else {
      this.toggleDesktopSidebar();
    }
  }

  toggleMobileSidebar(): void {
    this.mobileOverlayVisible = !this.mobileOverlayVisible;
    this.sidebarToggle.emit(this.mobileOverlayVisible);
    this.sidebarExpandedChange.emit(this.mobileOverlayVisible);
  }

  toggleDesktopSidebar(): void {
    this.navExpanded = !this.navExpanded;
    this.desktopExpanded = this.navExpanded;

    if (!this.navExpanded && this.sidebarExtendedItem !== -1) {
      this.previousExpandedItem = this.sidebarExtendedItem;
      this.sidebarExtendedItem = -1;
      this.collapseAll();
    }

    this.sidebarToggle.emit(this.navExpanded);
    this.sidebarExpandedChange.emit(this.navExpanded);

    setTimeout(() => {
      this.shellService.toggleNavMode();
    }, 0);
  }

  closeMobileSidebar(): void {
    if (this.isMobile && this.mobileOverlayVisible) {
      this.mobileOverlayVisible = false;
      this.sidebarToggle.emit(false);
      this.sidebarExpandedChange.emit(false);
    }
  }

  onOverlayClick(): void {
    this.closeMobileSidebar();
  }

  onSidebarMouseEnter(): void {
    if (!this.isMobile && !this.navExpanded) {
      if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
      this.isHovered = true;
    }
  }

  onSidebarMouseLeave(): void {
    if (!this.isMobile && !this.navExpanded && this.isHovered) {
      this.hoverTimeout = setTimeout(() => {
        this.isHovered = false;
        if (this.sidebarExtendedItem !== -1) {
          this.previousExpandedItem = this.sidebarExtendedItem;
          this.sidebarExtendedItem = -1;
          this.collapseAll();
        }
      }, 300);
    }
  }

  onMenuItemClick(event: MenuItemClickEvent): void {
    const { item, path } = event;

    if (!this.isMobile && !this.navExpanded && !this.isHovered) {
      this.navExpanded = true;
      this.desktopExpanded = true;
      this.sidebarToggle.emit(this.navExpanded);
      this.sidebarExpandedChange.emit(this.navExpanded);
    }

    if (path.length === 1) {
      this.shellService.activateNavItem(path[0], this.sidebarItems);
    } else {
      this.shellService.activateNavSubItem(path[0], item, this.sidebarItems);
    }

    if (this.isMobile && !item.subItems?.length) {
      this.closeMobileSidebar();
    }
  }

  onMenuToggleExpand(event: MenuToggleEvent): void {
    const { path, expanded } = event;

    if (!this.isMobile && !this.navExpanded && !this.isHovered && expanded) {
      this.navExpanded = true;
      this.desktopExpanded = true;
      this.sidebarToggle.emit(this.navExpanded);
      this.sidebarExpandedChange.emit(this.navExpanded);
    }

    this.setItemByPath(path, { expanded });

    if (path.length === 1) {
      if (expanded) {
        this.sidebarExtendedItem = path[0];
        this.previousExpandedItem = path[0];
      } else {
        this.sidebarExtendedItem = -1;
        this.previousExpandedItem = -1;
      }
    }
  }

  private setItemByPath(path: number[], updates: Partial<IMenuItem>): void {
    if (path.length === 0) return;
    let current = this.sidebarItems;
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (!current[index]) return;
      if (i === path.length - 1) {
        Object.assign(current[index], updates);
      } else {
        current = current[index].subItems || [];
      }
    }
  }

  private collapseAll(): void {
    const collapseRecursive = (items: IMenuItem[]) => {
      items.forEach((item) => {
        if (item.subItems?.length) {
          item.expanded = false;
          collapseRecursive(item.subItems);
        }
      });
    };
    collapseRecursive(this.sidebarItems);
  }

  getCurrentTheme(): void {
    this.themeService.currentTheme$.pipe(untilDestroyed(this)).subscribe((theme) => {
      this.isDarkTheme = theme === Theme.DARK;
    });
  }

  getItemIcon(item: IMenuItem, index: number): string {
    if (!this.isMobile && !this.navExpanded && !this.isHovered && item.subItems) {
      const activeSubItem = item.subItems.find((subItem) => subItem.active);
      return activeSubItem?.icon || item.icon;
    }
    return item.icon;
  }

  get isVisuallyExpanded(): boolean {
    if (this.isMobile) {
      return this.mobileOverlayVisible;
    }
    return this.navExpanded || this.isHovered;
  }

  get sidebarWidthClasses(): string {
    if (this.isMobile) {
      return 'w-[280px]';
    }
    return this.isVisuallyExpanded ? 'w-[248px]' : 'w-20';
  }

  get sidebarTransformClasses(): string {
    if (this.isMobile) {
      return this.mobileOverlayVisible ? 'translate-x-0' : '-translate-x-full';
    }
    return 'translate-x-0';
  }
}
