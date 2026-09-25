import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
@Component({ selector: 'app-dialog', standalone: true, template: `
  <dialog #dialog aria-labelledby="dialog-title" (cancel)="onCancel($event)" (keydown)="onKeydown($event)">
    <div class="dialog-heading"><h2 id="dialog-title" class="h4 mb-0">{{ title }}</h2><button type="button" class="btn-close" aria-label="Close dialog" [disabled]="busy" (click)="closed.emit()"></button></div>
    <div class="dialog-body"><ng-content /></div>
  </dialog>` })
export class DialogComponent implements AfterViewInit, OnDestroy {
  @Input() title = ''; @Input() busy = false; @Output() closed = new EventEmitter<void>();
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  private previousFocus: HTMLElement | null = null;
  ngAfterViewInit() { this.previousFocus = document.activeElement as HTMLElement; this.dialog.nativeElement.showModal(); }
  onCancel(event: Event) { event.preventDefault(); if (!this.busy) this.closed.emit(); }
  onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const elements = Array.from(this.dialog.nativeElement.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.matches(':disabled') && element.offsetParent !== null);
    const first = elements[0]; const last = elements[elements.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  ngOnDestroy() { this.dialog.nativeElement.close(); this.previousFocus?.focus(); }
}
