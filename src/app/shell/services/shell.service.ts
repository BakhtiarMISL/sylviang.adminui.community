import { Route, Router, Routes } from '@angular/router';
import { ShellComponent } from '@app/shell/shell.component';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import type { IMenuItem } from '@app/@core/interfaces/menuResponse.interface';

export class Shell {
  static childRoutes(routes: Routes): Route {
    return {
      path: '',
      component: ShellComponent,
      children: routes,
      data: { reuse: true },
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class ShellService {
  navicon = new BehaviorSubject<NavMode>(NavMode.Free);
  navModeSubject = new BehaviorSubject<NavMode>(NavMode.Free);
  navMode$ = this.navModeSubject.asObservable();
  navicon$ = this.navModeSubject.asObservable();

  constructor(private readonly _router: Router) {}

  toggleNavMode(): void {
    const mode = this.navModeSubject.getValue();
    this.navModeSubject.next(mode === NavMode.Free ? NavMode.Locked : NavMode.Free);
    this.navicon.next(mode === NavMode.Free ? NavMode.Locked : NavMode.Free);
  }

  activeNavTab(items: IMenuItem[], extendedItem: number): void {
    items.forEach((item, index) => {
      if (item.href) {
        const urlSegments = this._router.url.split('/').filter((segment) => segment.length > 0);
        const hrefSegments = item.href.split('/').filter((segment) => segment.length > 0);
        const isActive = hrefSegments.every((segment, i) => segment === urlSegments[i]);

        item.active = isActive;

        if (isActive && extendedItem) {
          extendedItem = index;
        }

        if (item.subItems) {
          item.subItems.forEach((subItem) => {
            if (subItem.href) {
              const subItemHrefSegments = subItem.href.split('/').filter((segment) => segment.length > 0);
              subItem.active = subItemHrefSegments.every((segment, i) => segment === urlSegments[i]);
            }
          });
        }
      } else {
        item.active = false;
      }
    });
  }

  activateNavItem(index: number, navItems: IMenuItem[]): void {
    const item = navItems[index];

    setTimeout(() => {
      const element = document.getElementById(`menu-item-${index}`);
      const navElement = document.querySelector('nav');

      if (element && navElement) {
        const elementRect = element.getBoundingClientRect();
        const navRect = navElement.getBoundingClientRect();
        const relativeTop = elementRect.top - navRect.top;
        const desiredScrollPosition = navElement.scrollTop + relativeTop - navRect.height / 2;
        navElement.scrollTo({ top: desiredScrollPosition, behavior: 'smooth' });
      }
    }, 0);

    if (item && (!item.subItems || !item.subItems.length)) {
      this._router.navigate([item.href]);
    } else {
      navItems.forEach((item) => {
        if (item.subItems) {
          item.subItems.forEach((subItem) => {
            subItem.active = false;
          });
        }
      });
    }
  }

  activateNavSubItem(i: number, subItem: IMenuItem, sidebarItems: IMenuItem[]) {
    subItem.active = true;
    sidebarItems[i].active = true;
    sidebarItems[i].subItems?.forEach((item) => {
      if (item !== subItem) {
        item.active = false;
      }
    });
    if (subItem.href) {
      const href = this.buildHref(sidebarItems[i]?.href, subItem.href);
      this._router.navigate([href]);
    }
  }

  private buildHref(parentHref: string | undefined, childHref: string): string {
    const normalizedChild = (childHref || '').trim();
    if (!normalizedChild) {
      return parentHref || '/shift-list';
    }

    const normalizedParent = (parentHref || '').trim();
    if (!normalizedParent) {
      return normalizedChild.startsWith('/') ? normalizedChild : `/${normalizedChild}`;
    }

    const left = normalizedParent.endsWith('/') ? normalizedParent.slice(0, -1) : normalizedParent;

    if (normalizedChild.startsWith(left + '/') || normalizedChild === left) {
      return normalizedChild;
    }

    const right = normalizedChild.startsWith('/') ? normalizedChild.slice(1) : normalizedChild;
    return `${left}/${right}`;
  }

  getCurrentActiveRoute(lastSegmentOnly = true): string {
    const url = this._router.url;
    const urlSegments = url.split('/');
    const lastSegment = urlSegments[urlSegments.length - 1];
    return lastSegmentOnly ? lastSegment : url;
  }
}

export enum NavMode {
  Locked,
  Free,
}
