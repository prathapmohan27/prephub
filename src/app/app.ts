import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNav } from './components/app-nav/app-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNav],
  template: `
    <app-nav />
    <div id="main" tabindex="-1" class="app-main">
      <router-outlet />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .app-main:focus {
        outline: none;
      }
      @media (max-width: 640px) {
        .app-main {
          padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
        }
      }
    `,
  ],
})
export class App {}
