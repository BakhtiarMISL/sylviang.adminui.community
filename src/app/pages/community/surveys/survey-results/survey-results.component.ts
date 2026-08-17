import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ISurveyResponse, ISurveyResultsResponse } from '@core/interfaces/community/survey.interface';
import { SurveyService } from '@core/services/community/survey.service';

/** US-5.6: HR/Admin-only aggregate results view - backed by GET community/survey/{id}/results. */
@Component({
  selector: 'app-survey-results',
  standalone: false,
  templateUrl: './survey-results.component.html',
  styleUrl: './survey-results.component.scss',
})
export class SurveyResultsComponent implements OnInit {
  surveyId!: number;
  survey: ISurveyResponse | null = null;
  results: ISurveyResultsResponse | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private surveyService: SurveyService,
  ) {}

  ngOnInit(): void {
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.surveyService.getById(this.surveyId).subscribe((response) => {
      this.survey = !response.hasError && response.content ? response.content : null;
    });

    this.surveyService.getResults(this.surveyId).subscribe({
      next: (response) => {
        this.results = !response.hasError && response.content ? response.content : null;
        this.loading = false;
      },
      error: () => {
        this.results = null;
        this.loading = false;
      },
    });
  }
}
