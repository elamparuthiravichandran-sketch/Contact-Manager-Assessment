import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isApi = request.url.startsWith('/api/');
  const login = request.url === '/api/auth/login';
  const token = auth.accessToken();
  const secured = isApi && !login && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  return next(secured).pipe(catchError((error: HttpErrorResponse) => {
    if (isApi && !login && error.status === 401) auth.logout();
    return throwError(() => error);
  }));
};
