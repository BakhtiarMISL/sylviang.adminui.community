import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import type { IMenuItem } from '@core/interfaces/menuResponse.interface';
import { webSidebarMenuItems } from '../constants/nav-menu-items';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menuSubject = new BehaviorSubject<IMenuItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public menu$ = this.menuSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public user$ = new BehaviorSubject<any>(null).asObservable();

  constructor() {
    this.loadFallbackMenu();
  }

  private loadFallbackMenu(): void {
    const items = this.transformMenuItems(webSidebarMenuItems);
    this.menuSubject.next(items);
  }

  private transformMenuItems(items: IMenuItem[]): IMenuItem[] {
    return items.map((item) => ({
      ...item,
      expanded: false,
      subItems: item.subItems ? this.transformMenuItems(item.subItems) : undefined,
    }));
  }

  getCurrentMenu(): IMenuItem[] {
    return this.menuSubject.value;
  }

  loadMenuIfNeeded(): Observable<IMenuItem[]> {
    return of(this.menuSubject.value);
  }

  refreshMenu(): Observable<IMenuItem[]> {
    return of(this.menuSubject.value);
  }

  updateActiveMenuItem(currentRoute: string): void {
    const menuItems = this.getCurrentMenu();
    const updatedMenuItems = this.updateMenuItemsActiveState(menuItems, currentRoute);
    this.menuSubject.next(updatedMenuItems);
  }

  /**
   * Persists an expand/collapse toggle into the canonical menu store. Needed because
   * SidebarComponent keeps its own filtered copy of the menu and mutates that copy's
   * `expanded` flags directly for instant UI feedback - without also writing back here,
   * the next NavigationEnd (see updateActiveMenuItem, called on every route change) would
   * rebuild the menu from these stale canonical items (expanded: false) and overwrite the
   * sidebar's local state, collapsing whatever section the user just expanded.
   */
  setExpanded(path: number[], expanded: boolean): void {
    const items = this.getCurrentMenu();
    this.setExpandedByPath(items, path, expanded);
    this.menuSubject.next([...items]);
  }

  private setExpandedByPath(items: IMenuItem[], path: number[], expanded: boolean): void {
    if (path.length === 0) return;
    let current = items;
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (!current[index]) return;
      if (i === path.length - 1) {
        current[index].expanded = expanded;
      } else {
        current = current[index].subItems || [];
      }
    }
  }

  private updateMenuItemsActiveState(items: IMenuItem[], currentRoute: string): IMenuItem[] {
    return items.map((item) => {
      const updatedItem: IMenuItem = { ...item };
      updatedItem.active = this.isRouteMatch(item.href, currentRoute);
      updatedItem.expanded = item.expanded || false;
      if (item.subItems && item.subItems.length > 0) {
        updatedItem.subItems = this.updateMenuItemsActiveState(item.subItems, currentRoute);
      }
      return updatedItem;
    });
  }

  private isRouteMatch(menuHref: string | undefined, currentRoute: string): boolean {
    if (!menuHref) return false;
    const normalizedMenuHref = menuHref.replace(/^\//, '');
    const normalizedCurrentRoute = currentRoute.replace(/^\//, '');
    return normalizedCurrentRoute === normalizedMenuHref || normalizedCurrentRoute.startsWith(normalizedMenuHref + '/');
  }
}
