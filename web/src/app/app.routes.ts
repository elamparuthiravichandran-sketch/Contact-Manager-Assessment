import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './core/auth.service';
import { LoginComponent } from './login.component';
import { ContactListComponent } from './contacts/contact-list.component';
const authenticated: CanActivateFn = () => inject(AuthService).accessToken() ? true : inject(Router).createUrlTree(['/login']);
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'contacts', component: ContactListComponent, canActivate: [authenticated], children: [
    { path: 'new', loadComponent: () => import('./contacts/add-contact.component').then(m => m.AddContactComponent) },
    { path: ':id/edit', loadComponent: () => import('./contacts/edit-contact.component').then(m => m.EditContactComponent) },
    { path: ':id/delete', loadComponent: () => import('./contacts/delete-contact.component').then(m => m.DeleteContactComponent) }
  ] },
  { path: '**', redirectTo: 'contacts' }
];
