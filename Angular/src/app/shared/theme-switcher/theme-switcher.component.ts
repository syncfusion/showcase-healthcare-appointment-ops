import { Component, inject, signal, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideSun, LucideMoon, LucideMonitor, LucideCheck } from '@lucide/angular';
import { ThemeMode, ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, LucideSun, LucideMoon, LucideMonitor, LucideCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="theme-switcher">
      <button
        type="button"
        class="theme-trigger"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        aria-label="Change theme"
        title="Change theme"
        (click)="open.set(!open())">
        @if (themeService.resolved() === 'dark') {
          <svg lucideMoon [size]="18" [strokeWidth]="1.75"></svg>
        } @else {
          <svg lucideSun [size]="18" [strokeWidth]="1.75"></svg>
        }
      </button>

      @if (open()) {
        <div class="theme-menu" role="menu">
          <button
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="themeService.getMode() === 'light'"
            class="theme-menu-item"
            [class.active]="themeService.getMode() === 'light'"
            (click)="onSelect('light')">
            <svg lucideSun [size]="16" [strokeWidth]="1.75"></svg>
            <span class="theme-menu-label">Light</span>
            @if (themeService.getMode() === 'light') { <svg lucideCheck [size]="15" [strokeWidth]="2.25"></svg> }
          </button>
          <button
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="themeService.getMode() === 'dark'"
            class="theme-menu-item"
            [class.active]="themeService.getMode() === 'dark'"
            (click)="onSelect('dark')">
            <svg lucideMoon [size]="16" [strokeWidth]="1.75"></svg>
            <span class="theme-menu-label">Dark</span>
            @if (themeService.getMode() === 'dark') { <svg lucideCheck [size]="15" [strokeWidth]="2.25"></svg> }
          </button>
          <button
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="themeService.getMode() === 'system'"
            class="theme-menu-item"
            [class.active]="themeService.getMode() === 'system'"
            (click)="onSelect('system')">
            <svg lucideMonitor [size]="16" [strokeWidth]="1.75"></svg>
            <span class="theme-menu-label">System</span>
            @if (themeService.getMode() === 'system') { <svg lucideCheck [size]="15" [strokeWidth]="2.25"></svg> }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .theme-switcher {
      position: relative;
      display: flex;
      align-items: center;
    }
    .theme-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: var(--radius-8);
      border: 1px solid var(--color-sf-border-secondary);
      background: var(--color-sf-bg-primary);
      color: var(--color-sf-fg-tertiary);
      cursor: pointer;
      padding: 0;
    }
    .theme-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 160px;
      background: var(--color-sf-bg-primary);
      border: 1px solid var(--color-sf-border-secondary);
      border-radius: var(--radius-8);
      box-shadow: var(--shadow-lg);
      padding: 4px;
      z-index: 1000;
    }
    .theme-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      border-radius: var(--radius-6);
      background: transparent;
      color: var(--color-sf-fg-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
    }
    .theme-menu-label {
      flex: 1;
    }
    .theme-menu-item.active {
      background: var(--color-sf-bg-brand-primary);
      color: var(--color-sf-fg-brand-primary);
      font-weight: 600;
    }
    .theme-menu-item:hover {
      background: var(--color-sf-bg-brand-secondary);
    }
  `],
})
export class ThemeSwitcherComponent {
  protected themeService = inject(ThemeService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly open = signal(false);

  onSelect(id: ThemeMode): void {
    this.themeService.setMode(id);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
