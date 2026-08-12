import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="field-error" role="alert">{{ message }}</div>`,
  styles: [
    `
      .field-error {
        color: var(--color-sf-fg-error-primary);
        font-size: 12px;
        margin-top: 4px;
      }
    `,
  ],
})
export class FormFieldErrorComponent {
  @Input({ required: true }) message!: string;
}
