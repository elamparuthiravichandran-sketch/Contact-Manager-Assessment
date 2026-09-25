import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './core/auth.service';
import { errorMessage } from './core/api.service';
@Component({ selector: 'app-login', standalone: true, imports: [ReactiveFormsModule], template: `
  <section class="login-panel card border-0 shadow-sm mx-auto">
    <p class="eyebrow">YOUR CONTACT WORKSPACE</p><h1>Welcome back</h1>
    <p class="text-secondary">Sign in to keep your connections organized.</p>
    @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="mb-3"><label for="username" class="form-label">Username</label><input id="username" class="form-control" formControlName="username" autocomplete="username" required maxlength="100"></div>
      <div class="mb-4"><label for="password" class="form-label">Password</label><input id="password" class="form-control" formControlName="password" type="password" autocomplete="current-password" required maxlength="200"></div>
      <button class="btn btn-primary w-100" [disabled]="busy() || form.invalid">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
    </form><p class="small text-secondary mt-3 mb-0">Use the reviewer credentials configured during setup.</p>
  </section>` })
export class LoginComponent {
  private auth = inject(AuthService); private router = inject(Router);
  form = inject(FormBuilder).nonNullable.group({ username: ['', Validators.required], password: ['', Validators.required] });
  busy = signal(false); error = signal('');
  submit() {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true); this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/contacts'), error: e => this.error.set(errorMessage(e))
    });
  }
}
