import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { IMenuItem } from '@app/@core/interfaces/menuResponse.interface';

@Component({
  selector: 'app-sidebar-menu-item',
  templateUrl: './sidebar-menu-item.component.html',
  styleUrls: ['./sidebar-menu-item.component.scss'],
  standalone: false,
})
export class SidebarMenuItemComponent {
  @Input() item!: IMenuItem;
  @Input() parentPath: number[] = [];
  @Input() isMobile = false;
  @Input() isVisuallyExpanded = false;
  @Input() level = 0;

  @Output() itemClick = new EventEmitter<{ item: IMenuItem; path: number[] }>();
  @Output() toggleExpand = new EventEmitter<{ path: number[]; expanded: boolean }>();

  isActive(): boolean {
    return this.isMenuItemActive(this.item);
  }

  hasChildren(): boolean {
    return !!(this.item.subItems && this.item.subItems.length > 0);
  }

  isExpanded(): boolean {
    return this.item.expanded || false;
  }

  onClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.hasChildren()) {
      this.toggleExpand.emit({ path: this.parentPath, expanded: !this.isExpanded() });
    } else {
      this.itemClick.emit({ item: this.item, path: this.parentPath });
    }
  }

  onChildClick(event: { item: IMenuItem; path: number[] }): void {
    this.itemClick.emit(event);
  }

  onChildToggle(event: { path: number[]; expanded: boolean }): void {
    this.toggleExpand.emit(event);
  }

  getChildPath(subIndex: number): number[] {
    return [...this.parentPath, subIndex];
  }

  getIconSizeClass(): string {
    const sizes = ['w-5 h-5', 'w-4 h-4', 'w-3 h-3', 'w-3 h-3', 'w-3 h-3'];
    return sizes[Math.min(this.level, sizes.length - 1)];
  }

  getIndentClass(): string {
    const indents = ['ml-4', 'ml-6', 'ml-8', 'ml-10', 'ml-12'];
    return indents[Math.min(this.level, indents.length - 1)];
  }

  getBorderOpacity(): number {
    return Math.max(0.3 - this.level * 0.05, 0.1);
  }

  private isMenuItemActive(item: IMenuItem): boolean {
    if (item.active) {
      return true;
    }

    if (!item.subItems || item.subItems.length === 0) {
      return false;
    }

    return item.subItems.some((child) => this.isMenuItemActive(child));
  }
}
