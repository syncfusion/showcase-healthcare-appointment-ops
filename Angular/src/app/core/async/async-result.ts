import { DestroyRef, inject, signal } from '@angular/core';
import { Observable, Subject, switchMap, catchError, of, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function createAsyncResult<T>(
  factory: () => Observable<T>,
  options: { immediate?: boolean; initialData?: T; destroyRef?: DestroyRef } = {}
): AsyncState<T> {
  const { immediate = true, initialData, destroyRef: explicitDestroyRef } = options;
  const destroyRef = explicitDestroyRef ?? inject(DestroyRef);

  const data = signal<T | undefined>(initialData);
  const loading = signal(immediate);
  const error = signal<string | null>(null);

  const refresh$ = new Subject<void>();
  let version = 0;

  const run = () => {
    version += 1;
    const currentVersion = version;
    loading.set(true);
    error.set(null);

    factory()
      .pipe(
        takeUntilDestroyed(destroyRef),
        finalize(() => {
          if (currentVersion === version) {
            loading.set(false);
          }
        }),
        catchError((err: unknown) => {
          if (currentVersion === version) {
            error.set(err instanceof Error ? err.message : 'Unknown error');
          }
          return of(undefined);
        })
      )
      .subscribe((result) => {
        if (currentVersion === version && result !== undefined) {
          data.set(result);
        }
      });
  };

  refresh$
    .pipe(
      takeUntilDestroyed(destroyRef),
      switchMap(() => {
        run();
        return of(undefined);
      })
    )
    .subscribe();

  if (immediate) {
    run();
  }

  return {
    get data() {
      return data();
    },
    get loading() {
      return loading();
    },
    get error() {
      return error();
    },
    refresh: () => refresh$.next(),
  };
}
