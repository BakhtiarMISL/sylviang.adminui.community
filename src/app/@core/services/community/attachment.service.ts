import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IFileUploadResponse } from '@core/interfaces/community/attachment.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Uploads a single file's bytes to the backend's FileUploadController, which writes it to
   * disk and creates a FileStorage metadata record. Angular's HttpClient sets the multipart
   * boundary itself for FormData bodies - do not set a Content-Type header manually here.
   */
  upload(file: File, module: string, entityId?: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);
    if (entityId != null) {
      formData.append('entityId', String(entityId));
    }

    return this.httpClient.post<ApiResponse<IFileUploadResponse>>(`${BASE_URL_Community}/file-upload`, formData);
  }
}
