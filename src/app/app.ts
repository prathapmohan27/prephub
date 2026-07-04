import { Component, signal } from '@angular/core';
import { QuestionsComponent } from './components/questions.component';

@Component({
  selector: 'app-root',
  imports: [QuestionsComponent],
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
  protected readonly title = signal('angular-interview');
}
