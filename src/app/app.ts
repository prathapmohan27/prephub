import { Component, signal } from '@angular/core';
import { Questions } from '@components/questions';

@Component({
  selector: 'app-root',
  imports: [Questions],
  template: `<app-questions />`,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class App {
  protected readonly title = signal('prepHup');
}
