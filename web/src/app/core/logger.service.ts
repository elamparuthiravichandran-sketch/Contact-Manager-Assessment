import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
export type UiEvent = 'ui-error' | 'contact-created' | 'contact-updated' | 'contact-deleted' | 'list-loaded';
@Injectable({ providedIn: 'root' })
export class UiLogger {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  log(event: UiEvent, code = '') {
    if (!this.auth.accessToken()) return;
    this.http.post<void>('/api/client-logs', { event, code }).subscribe({ error: () => { /* Logging must never break user actions. */ } });
  }
}
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private injector = inject(Injector);
  handleError() { this.injector.get(UiLogger).log('ui-error', 'unhandled-client-error'); }
}
