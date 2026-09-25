import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
@Component({ selector: 'app-root', standalone: true, imports: [RouterLink, RouterOutlet], template: `
  <a href="#main" class="visually-hidden-focusable skip-link">Skip to content</a>
  <header><nav class="navbar navbar-expand border-bottom bg-white" aria-label="Main navigation"><div class="container-fluid px-3 px-lg-4 gap-2 flex-wrap">
    <a class="navbar-brand fw-bold" routerLink="/contacts"><span class="brand-mark" aria-hidden="true">C</span> Contact Manager</a>
    @if (auth.user()) { <a class="nav-link active me-auto" routerLink="/contacts">Contacts</a><span class="small text-secondary d-none d-sm-inline">{{ auth.user() }}</span><button class="btn btn-outline-secondary btn-sm ms-2" (click)="auth.logout()">Sign out</button> }
  </div></nav></header>
  <main id="main" class="container-fluid px-3 px-lg-4 py-4 py-lg-5"><router-outlet /></main>
  <footer class="px-4 py-3 border-top d-flex flex-wrap justify-content-between gap-2"><span>Contact Manager</span><span>Contact directory</span></footer>` })
export class AppComponent { auth = inject(AuthService); }
