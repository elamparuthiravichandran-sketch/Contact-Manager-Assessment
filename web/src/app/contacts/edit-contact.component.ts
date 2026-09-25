import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ContactsApi, errorMessage } from '../core/api.service';
import { Contact, ContactInput } from '../core/models';
import { UiLogger } from '../core/logger.service';
import { DialogComponent } from './dialog.component';
import { ContactFormComponent } from './contact-form.component';
@Component({ selector: 'app-edit-contact', standalone: true, imports: [DialogComponent, ContactFormComponent, RouterLink], template: `
  <app-dialog title="Edit contact" [busy]="busy()" (closed)="close()">
    @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
    @if (contact(); as c) {
      <app-contact-form [initial]="c" [busy]="busy()" (saved)="save($event)" (cancelled)="close()" />
      @if (!busy()) { <a class="btn btn-link text-danger p-0 mt-3" [routerLink]="['/contacts', c.id, 'delete']">Delete this contact</a> }
    } @else if (!error()) { <p role="status">Loading contact…</p> }
  </app-dialog>` })
export class EditContactComponent {
  private api = inject(ContactsApi); private router = inject(Router); private logger = inject(UiLogger);
  contact = signal<Contact | null>(null); busy = signal(false); error = signal('');
  constructor() { this.api.get(inject(ActivatedRoute).snapshot.paramMap.get('id')!).subscribe({ next: c => this.contact.set(c), error: e => this.error.set(errorMessage(e)) }); }
  close() { void this.router.navigateByUrl('/contacts'); }
  save(input: ContactInput) {
    const contact = this.contact(); if (!contact || this.busy()) return;
    this.busy.set(true); this.error.set('');
    this.api.update(contact, input).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => { this.api.highlightedId.set(null); this.api.notice.set('Contact updated.'); this.logger.log('contact-updated'); this.close(); },
      error: e => { this.error.set(errorMessage(e)); this.logger.log('ui-error', 'update-failed'); }
    });
  }
}
