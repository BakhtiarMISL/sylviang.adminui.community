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
