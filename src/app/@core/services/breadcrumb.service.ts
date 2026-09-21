import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  title: string;
  icon: string;
  href: string;
  active: boolean;
  isClickable?: boolean;
  showIconOnly?: boolean;
  tooltip?: string;
}

export interface BreadcrumbConfig {
  title: string;
  icon?: string;
  href?: string;
  isClickable?: boolean;
  showIconOnly?: boolean;
  tooltip?: string;
  parent?: BreadcrumbConfig;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  private customBreadcrumbs: Map<string, BreadcrumbConfig[]> = new Map();

  private readonly sectionIcons: Record<string, string> = {
    // top-level
    dashboard: 'fas fa-chart-line',
    'change-password': 'fas fa-key',
    'employee-directory': 'fas fa-id-badge',
    notifications: 'fas fa-bell',
    messenger: 'fas fa-comment-dots',
    community: 'fas fa-users',

    // employee-directory
    directory: 'fas fa-address-book',
    profile: 'fas fa-user',
    me: 'fas fa-user',
    'manage-employee': 'fas fa-user-pen',
    'user-management': 'fas fa-users-gear',

    // notifications
    preferences: 'fas fa-gear',

    // community sections
    feed: 'fas fa-newspaper',
    groups: 'fas fa-people-group',
    recognitions: 'fas fa-award',
    surveys: 'fas fa-clipboard-list',
    elections: 'fas fa-landmark',
    moderation: 'fas fa-shield',
    marketplace: 'fas fa-store',
    teams: 'fas fa-sitemap',
    tasks: 'fas fa-list-check',

    // shared action/sub-page words
    create: 'fas fa-plus',
    new: 'fas fa-plus',
    edit: 'fas fa-pen',
    take: 'fas fa-pen-to-square',
    candidates: 'fas fa-user-tie',
    vote: 'fas fa-check-to-slot',
    results: 'fas fa-chart-bar',
    listing: 'fas fa-tag',
    messages: 'fas fa-envelope',
  };

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumbs();
    });
    this.updateBreadcrumbs();
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbConfig[]): void {
    const currentUrl = this.router.url;
    this.customBreadcrumbs.set(currentUrl, breadcrumbs);
    this.updateBreadcrumbs();
  }

  clearBreadcrumbs(): void {
    const currentUrl = this.router.url;
    this.customBreadcrumbs.delete(currentUrl);
    this.updateBreadcrumbs();
  }

  private updateBreadcrumbs(): void {
    const currentUrl = this.router.url;
    const customBreadcrumbs = this.customBreadcrumbs.get(currentUrl);

    if (customBreadcrumbs && customBreadcrumbs.length > 0) {
      this.breadcrumbsSubject.next(this.convertToBreadcrumbItems(customBreadcrumbs));
    } else {
      this.breadcrumbsSubject.next(this.createBreadcrumbsFromRoute());
    }
  }

  private convertToBreadcrumbItems(configs: BreadcrumbConfig[]): BreadcrumbItem[] {
    return configs.map((config, index) => ({
      title: config.title,
      icon: config.icon || 'fas fa-folder',
      href: config.isClickable !== false ? config.href || '#' : '',
      active: index === configs.length - 1,
      isClickable: config.isClickable !== false,
      showIconOnly: config.showIconOnly || false,
      tooltip: config.tooltip || config.title,
    }));
  }

  private createBreadcrumbsFromRoute(): BreadcrumbItem[] {
    const url = this.router.url;
    const urlSegments = url.split('/').filter((segment) => segment);

    if (urlSegments.length === 0) {
      return [{ title: 'Dashboard', icon: 'fas fa-chart-line', href: '/dashboard', active: true, isClickable: true }];
    }

    const crumbs: BreadcrumbItem[] = [];
    let pathAccumulator = '';
    let lastIcon = 'fas fa-circle'; // only used if the very first segment is somehow unmapped

    for (let i = 0; i < urlSegments.length; i++) {
      const segment = urlSegments[i];
      pathAccumulator += `/${segment}`;
      const isLast = i === urlSegments.length - 1;
      const matchedIcon = this.sectionIcons[segment];
      if (matchedIcon) lastIcon = matchedIcon;

      crumbs.push({
        title: this.formatSegmentName(segment),
        icon: matchedIcon || lastIcon,
        href: pathAccumulator,
        active: isLast,
        isClickable: !isLast,
      });
    }

    return crumbs;
  }

  private formatSegmentName(segment: string): string {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  public getBreadcrumbs(): BreadcrumbItem[] {
    return this.breadcrumbsSubject.value;
  }
}
