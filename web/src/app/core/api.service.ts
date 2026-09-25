import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Contact, ContactInput } from './models';
@Injectable({ providedIn: 'root' })
export class ContactsApi {
  private http = inject(HttpClient);
  readonly highlightedId = signal<string | null>(null);
  readonly notice = signal('');
  list() { return this.http.get<Contact[]>('/api/contacts'); }
  get(id: string) { return this.http.get<Contact>(`/api/contacts/${encodeURIComponent(id)}`); }
  create(input: ContactInput) { return this.http.post<Contact>('/api/contacts', input); }
  update(contact: Contact, input: ContactInput) { return this.http.put<Contact>(`/api/contacts/${contact.id}`, { ...input, version: contact.version }); }
  delete(contact: Contact) { return this.http.delete<void>(`/api/contacts/${contact.id}`, { params: { version: contact.version } }); }
}
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Cannot reach the API. Check the connection and try again.';
    if (error.status === 429) return 'Too many requests. Please wait one minute and try again.';
    if (error.status === 401) return 'Your session ended or the credentials were incorrect. Please sign in.';
    if (error.error?.errors) return Object.values(error.error.errors).flat().join(' ');
    if (typeof error.error?.title === 'string') return error.error.title;
  }
  return 'Something went wrong. Please try again.';
}
