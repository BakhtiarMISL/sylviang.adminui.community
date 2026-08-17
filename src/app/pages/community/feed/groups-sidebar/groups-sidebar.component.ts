import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IGroupResponse } from '@core/interfaces/community/group.interface';
import { GroupService } from '@core/services/community/group.service';

/** Feed sidebar (US-3.28): a Groups link plus a shortcut list of the employee's own groups. */
@Component({
  selector: 'app-groups-sidebar',
  standalone: false,
  templateUrl: './groups-sidebar.component.html',
  styleUrl: './groups-sidebar.component.scss',
})
export class GroupsSidebarComponent implements OnInit {
  myGroups: IGroupResponse[] = [];
  loading = true;

  constructor(
    private groupService: GroupService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.groupService.getMy().subscribe({
      next: (response) => {
        this.myGroups = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myGroups = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
