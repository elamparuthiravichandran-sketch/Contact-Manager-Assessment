import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ContactsApi, errorMessage } from '../core/api.service';
import { ContactInput } from '../core/models';
import { UiLogger } from '../core/logger.service';
import { DialogComponent } from './dialog.component';
import { ContactFormComponent } from './contact-form.component';
@Component({ selector: 'app-add-contact', standalone: true, imports: [DialogComponent, ContactFormComponent], template: `
  <app-dialog title="Add contact" [busy]="busy()" (closed)="close()">
    @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
    <app-contact-form [busy]="busy()" submitLabel="Create contact" (saved)="save($event)" (cancelled)="close()" />
  </app-dialog>` })
export class AddContactComponent {
  private api = inject(ContactsApi); private router = inject(Router); private logger = inject(UiLogger);
  busy = signal(false); error = signal('');
  close() { void this.router.navigateByUrl('/contacts'); }
  save(input: ContactInput) {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    this.api.create(input).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: contact => { this.api.highlightedId.set(contact.id); this.api.notice.set('Contact created. The new contact is highlighted at the top.'); this.logger.log('contact-created'); this.close(); },
      error: e => { this.error.set(errorMessage(e)); this.logger.log('ui-error', 'create-failed'); }
    });
  }
}
