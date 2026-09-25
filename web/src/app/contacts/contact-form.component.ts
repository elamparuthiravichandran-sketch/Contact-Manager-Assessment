import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactInput, fields } from '../core/models';
@Component({ selector: 'app-contact-form', standalone: true, imports: [ReactiveFormsModule], template: `
  <p class="text-secondary small">All fields are required.</p>
  <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
    <fieldset [disabled]="busy"><div class="row g-3">
      @for (field of fields; track field.key) {
        <div [class]="field.key === 'address' ? 'col-12' : 'col-12 col-sm-6'">
          <label [for]="field.key" class="form-label">{{ field.label }}</label>
          <input class="form-control" [class.is-invalid]="invalid(field.key)" [id]="field.key" [type]="field.type" [formControlName]="field.key" [maxlength]="field.max" [autocomplete]="field.autocomplete" [attr.aria-invalid]="invalid(field.key)" [attr.aria-describedby]="field.key + '-error'" required>
          <div [id]="field.key + '-error'" class="invalid-feedback">{{ message(field.key) }}</div>
        </div>
      }
    </div></fieldset>
    <div class="d-flex justify-content-end gap-2 mt-4"><button type="button" class="btn btn-outline-secondary" [disabled]="busy" (click)="cancelled.emit()">Cancel</button><button class="btn btn-primary" [disabled]="busy">{{ busy ? 'Saving…' : submitLabel }}</button></div>
  </form>` })
export class ContactFormComponent implements OnInit {
  @Input() initial?: ContactInput; @Input() busy = false; @Input() submitLabel = 'Save contact';
  @Output() saved = new EventEmitter<ContactInput>(); @Output() cancelled = new EventEmitter<void>();
  fields = fields;
  private fb = inject(FormBuilder).nonNullable;
  form = this.fb.group({ firstName: [''], lastName: [''], email: [''], phoneNumber: [''], address: [''], city: [''], state: [''], country: [''], postalCode: [''] });
  ngOnInit() {
    for (const field of fields) this.form.controls[field.key].setValidators([Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(field.max)]);
    this.form.controls.email.addValidators(Validators.email);
    this.form.controls.phoneNumber.addValidators(Validators.pattern(/^[+0-9() .-]{7,30}$/));
    if (this.initial) this.form.patchValue(this.initial);
    for (const control of Object.values(this.form.controls)) control.updateValueAndValidity();
  }
  invalid(key: keyof ContactInput) { const c = this.form.controls[key]; return c.touched && c.invalid; }
  message(key: keyof ContactInput) {
    const c = this.form.controls[key];
    if (c.hasError('required')) return 'This field is required.';
    if (c.hasError('email')) return 'Enter a valid email address.';
    if (key === 'phoneNumber' && c.hasError('pattern')) return 'Use 7–30 characters: digits, spaces, +, -, . or parentheses.';
    return 'Enter a valid value within the allowed length.';
  }
  submit() {
    for (const c of Object.values(this.form.controls)) c.setValue(c.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy) return;
    this.saved.emit(this.form.getRawValue());
  }
}
