import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ContactsApi, errorMessage } from '../core/api.service';
import { Contact } from '../core/models';
import { UiLogger } from '../core/logger.service';
import { DialogComponent } from './dialog.component';
@Component({ selector: 'app-delete-contact', standalone: true, imports: [DialogComponent], template: `
  <app-dialog title="Delete contact" [busy]="busy()" (closed)="close()">
    @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
    @if (contact(); as c) {
      <p>Delete <strong>{{ c.firstName }} {{ c.lastName }}</strong>?</p><p class="text-secondary">This permanently removes the contact. This action cannot be undone.</p>
      <div class="d-flex justify-content-end gap-2 mt-4"><button class="btn btn-outline-secondary" [disabled]="busy()" (click)="close()">Cancel</button><button class="btn btn-danger" [disabled]="busy()" (click)="remove()">{{ busy() ? 'Deleting…' : 'Delete contact' }}</button></div>
    } @else if (!error()) { <p role="status">Loading contact…</p> }
  </app-dialog>` })
export class DeleteContactComponent {
  private api = inject(ContactsApi); private router = inject(Router); private logger = inject(UiLogger);
  contact = signal<Contact | null>(null); busy = signal(false); error = signal('');
  constructor() { this.api.get(inject(ActivatedRoute).snapshot.paramMap.get('id')!).subscribe({ next: c => this.contact.set(c), error: e => this.error.set(errorMessage(e)) }); }
  close() { void this.router.navigateByUrl('/contacts'); }
  remove() {
    const contact = this.contact(); if (!contact || this.busy()) return;
    this.busy.set(true); this.error.set('');
    this.api.delete(contact).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => { this.api.highlightedId.set(null); this.api.notice.set('Contact deleted.'); this.logger.log('contact-deleted'); this.close(); },
      error: e => { this.error.set(errorMessage(e)); this.logger.log('ui-error', 'delete-failed'); }
    });
  }
}
