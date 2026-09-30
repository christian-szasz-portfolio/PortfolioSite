import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, from, of, tap } from 'rxjs';
import { BrowserEnvironment, ControlGlyphs } from '@christian-szasz-portfolio/common-web';

/** What the button is showing: waiting, or the result of the last attempt */
export enum CopyState {
  Idle = 'idle',
  Copied = 'copied',
  Failed = 'failed',
}

/** How an attempt ended, so never `idle` */
export type CopyOutcome = Exclude<CopyState, CopyState.Idle>;

const SETTLE_MS = 2000;

/** Copies a string, and says so where a screen reader will hear it */
@Component({
  selector: 'lpg-copy-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copy-button.component.html',
  styleUrl: './copy-button.component.scss',
})
export class CopyButtonComponent {
  protected readonly glyphs = ControlGlyphs;

  public readonly value = input.required<string>();
  /** Names what is being copied, since the glyph alone cannot */
  public readonly label = input('code');

  private readonly environment = inject(BrowserEnvironment);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<CopyState>(CopyState.Idle);

  protected readonly buttonLabel = computed(() => `Copy the ${this.label()}`);

  protected readonly announcement = computed(() => {
    if (this.state() === CopyState.Copied) {
      return `The ${this.label()} was copied.`;
    }
    if (this.state() === CopyState.Failed) {
      return `The ${this.label()} could not be copied.`;
    }
    return '';
  });

  /** The clipboard answers with a native promise, which is wrapped rather than handed on */
  protected copy(): void {
    const clipboard = this.environment.window?.navigator.clipboard;

    if (clipboard === undefined) {
      this.settle(CopyState.Failed);
      return;
    }

    from(clipboard.writeText(this.value()))
      .pipe(
        tap(() => this.settle(CopyState.Copied)),
        // A denied permission is a refusal, not a defect: say so and move on.
        catchError(() => {
          this.settle(CopyState.Failed);
          return of(undefined);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private settle(state: CopyOutcome): void {
    this.state.set(state);

    const timer = setTimeout(() => this.state.set(CopyState.Idle), SETTLE_MS);
    this.destroyRef.onDestroy(() => clearTimeout(timer));
  }
}
