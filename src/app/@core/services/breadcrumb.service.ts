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

    const sectionIcons: Record<string, string> = {
      dashboard: 'fas fa-chart-line',
      attendance: 'fas fa-clock',
      payroll: 'fas fa-money-bill-wave',
    };

    const crumbs: BreadcrumbItem[] = [];
    let pathAccumulator = '';

    for (let i = 0; i < urlSegments.length; i++) {
      const segment = urlSegments[i];
      pathAccumulator += `/${segment}`;
      const isLast = i === urlSegments.length - 1;
      crumbs.push({
        title: this.formatSegmentName(segment),
        icon: sectionIcons[segment] || 'fas fa-folder',
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
