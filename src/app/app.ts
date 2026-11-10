import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';
import { AppNav } from './components/app-nav/app-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, AppNav],
  // <tui-root> hosts Taiga UI's portals (dialogs, dropdowns, hints) and global behaviour
  template: `
    <tui-root>
      <app-nav />
      <div id="main" tabindex="-1" class="app-main">
        <router-outlet />
      </div>
    </tui-root>
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
