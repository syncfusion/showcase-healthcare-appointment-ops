import { Injectable, Renderer2, RendererFactory2, signal, computed, Signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'healthops-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStoredMode(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'system' ? stored : 'light';
}

function resolveMode(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return typeof matchMedia !== 'undefined' && matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset['theme'] = resolved;
  document.body.classList.toggle('e-dark-mode', resolved === 'dark');
}

export function initTheme(): void {
  applyTheme(resolveMode(readStoredMode()));
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly renderer: Renderer2;
  private readonly mode = signal<ThemeMode>(readStoredMode());
  readonly resolved: Signal<ResolvedTheme> = computed(() => resolveMode(this.mode()));

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.apply(this.resolved());

    if (typeof matchMedia !== 'undefined') {
      const mql = matchMedia(DARK_QUERY);
      mql.addEventListener('change', () => {
        if (this.mode() === 'system') {
          this.apply(this.resolved());
        }
      });
    }
  }

  getMode(): ThemeMode {
    return this.mode();
  }

  setMode(next: ThemeMode): void {
    this.mode.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
    }
    this.apply(this.resolved());
  }

  private apply(resolved: ResolvedTheme): void {
    if (typeof document === 'undefined') return;
    this.renderer.setAttribute(document.documentElement, 'data-theme', resolved);
    if (resolved === 'dark') {
      this.renderer.addClass(document.body, 'e-dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'e-dark-mode');
    }
  }
}
