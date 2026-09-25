import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize } from 'rxjs';
import { ContactsApi, errorMessage } from '../core/api.service';
import { Contact, ContactInput, fields } from '../core/models';
import { UiLogger } from '../core/logger.service';
@Component({ selector: 'app-contact-list', standalone: true, imports: [FormsModule, RouterLink, RouterOutlet], template: `
  <section>
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
      <div><p class="eyebrow">PEOPLE & CONNECTIONS</p><h1>Contacts <span class="count-badge">{{ contacts().length }}</span></h1><p class="text-secondary mb-0">All your connections, in one place.</p></div>
      <a class="btn btn-primary" routerLink="/contacts/new">+ Add contact</a>
    </div>
    @if (api.notice()) { <div class="alert alert-success d-flex justify-content-between gap-2" role="status">{{ api.notice() }}<button type="button" class="btn-close" aria-label="Dismiss notification" (click)="api.notice.set('')"></button></div> }
    @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }} <button class="btn btn-sm btn-outline-danger" (click)="load()">Retry</button></div> }
    <div class="card border-0 shadow-sm overflow-hidden">
      <div class="d-flex flex-wrap align-items-end gap-3 p-3 border-bottom">
        <div class="search-box"><label for="search" class="form-label small fw-semibold">Search contacts</label><input id="search" class="form-control" type="search" placeholder="Search any field…" [ngModel]="query()" (ngModelChange)="query.set($event)"></div>
        <button class="btn btn-outline-secondary" [disabled]="loading()" (click)="load()">Refresh</button>
        <span class="small text-secondary ms-sm-auto pb-2" aria-live="polite">{{ visible().length }} contacts shown</span>
      </div>
      @if (loading()) { <div class="p-4 text-secondary" role="status">Loading contacts…</div> }
      @else {
        <div class="table-responsive" tabindex="0" role="region" aria-label="Contacts table; scroll horizontally to see every field">
          <table class="table align-middle mb-0">
            <caption class="visually-hidden">Contacts. Click any field heading to sort. Each row has edit and delete actions.</caption>
            <thead><tr>@for (field of fields; track field.key) {
              <th scope="col" [attr.aria-sort]="sortKey() === field.key ? (ascending() ? 'ascending' : 'descending') : 'none'">
                <button class="sort-button" (click)="sort(field.key)">{{ field.label }} <span aria-hidden="true">{{ sortKey() === field.key ? (ascending() ? '↑' : '↓') : '↕' }}</span></button>
              </th>
            }<th scope="col">Actions</th></tr></thead>
            <tbody>@for (contact of visible(); track contact.id) {
              <tr [class.new-contact]="contact.id === api.highlightedId()">
                @for (field of fields; track field.key) { <td>{{ contact[field.key] }} @if (field.key === 'firstName' && contact.id === api.highlightedId()) { <span class="badge text-bg-success ms-1">New</span> }</td> }
                <td class="text-nowrap"><a class="btn btn-sm btn-outline-primary me-2" [routerLink]="['/contacts', contact.id, 'edit']" [attr.aria-label]="'Edit ' + contact.firstName + ' ' + contact.lastName">Edit</a><a class="btn btn-sm btn-outline-danger" [routerLink]="['/contacts', contact.id, 'delete']" [attr.aria-label]="'Delete ' + contact.firstName + ' ' + contact.lastName">Delete</a></td>
              </tr>
            } @empty { <tr><td colspan="10" class="text-center py-5 text-secondary">{{ query() ? 'No contacts match your search.' : 'No contacts yet. Add your first contact to get started.' }}</td></tr> }</tbody>
          </table>
        </div>
      }
      <div class="p-3 small text-secondary border-top">Click a column heading to sort. On mobile, swipe the table to see all fields.</div>
    </div>
  </section><router-outlet />` })
export class ContactListComponent {
  api = inject(ContactsApi); private logger = inject(UiLogger); private router = inject(Router); private destroyRef = inject(DestroyRef);
  fields = fields; contacts = signal<Contact[]>([]); loading = signal(false); error = signal(''); query = signal('');
  sortKey = signal<keyof ContactInput | null>(null); ascending = signal(true);
  visible = computed(() => {
    const q = this.query().trim().toLocaleLowerCase(); const key = this.sortKey();
    const result = this.contacts().filter(c => fields.some(f => c[f.key].toLocaleLowerCase().includes(q)));
    return result.sort((a, b) => key ? (a[key].localeCompare(b[key], undefined, { numeric: true, sensitivity: 'base' }) * (this.ascending() ? 1 : -1)) : b.createdAtUtc.localeCompare(a.createdAtUtc));
  });
  constructor() {
    this.load();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd && e.urlAfterRedirects === '/contacts'), takeUntilDestroyed()).subscribe(() => {
      if (this.api.highlightedId()) { this.query.set(''); this.sortKey.set(null); }
      this.load();
    });
  }
  sort(key: keyof ContactInput) { this.ascending.set(this.sortKey() === key ? !this.ascending() : true); this.sortKey.set(key); }
  load() {
    this.loading.set(true); this.error.set('');
    this.api.list().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({
      next: c => { this.contacts.set(c); this.logger.log('list-loaded'); },
      error: e => { this.error.set(errorMessage(e)); this.logger.log('ui-error', 'list-load-failed'); }
    });
  }
}
