import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { Token } from './models';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private token = signal<Token | null>(null);
  private timer?: ReturnType<typeof setTimeout>;
  readonly user = () => this.token()?.username;
  readonly accessToken = () => this.token()?.accessToken;
  login(username: string, password: string) {
    return this.http.post<Token>('/api/auth/login', { username, password }).pipe(tap(token => {
      this.token.set(token);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.logout(), Math.max(0, Date.parse(token.expiresAtUtc) - Date.now()));
    }));
  }
  logout() { clearTimeout(this.timer); this.token.set(null); void this.router.navigateByUrl('/login'); }
}
