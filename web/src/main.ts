import { ErrorHandler } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import { GlobalErrorHandler } from './app/core/logger.service';
bootstrapApplication(AppComponent, { providers: [provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor])), { provide: ErrorHandler, useClass: GlobalErrorHandler }] }).catch(() => { document.body.textContent = 'The application could not start. Please refresh the page.'; });
