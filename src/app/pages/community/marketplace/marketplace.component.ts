import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

const TAB_KEYS = ['browse', 'my-listings', 'favorites', 'messages'];

/** Tabbed container for the Marketplace feature (US-6.1-6.11): Browse / My Listings / Favorites / Messages. */
@Component({
  selector: 'app-marketplace',
  standalone: false,
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
})
export class MarketplaceComponent implements OnInit {
  activeTabIndex = 0;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    const index = tab ? TAB_KEYS.indexOf(tab) : -1;
    this.activeTabIndex = index === -1 ? 0 : index;
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
  }
}
