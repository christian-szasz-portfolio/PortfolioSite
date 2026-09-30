import { Service } from '@angular/core';
import { Observable, from, map, switchMap, throwError } from 'rxjs';

/** Zips files in the browser; fflate is imported at use, so it stays out of the initial bundle */
@Service()
export class ArchiveService {
  /** Text is encoded as UTF-8; anything already in bytes is taken as it is */
  public pack(files: Record<string, Uint8Array | string>): Observable<Blob> {
    const names = Object.keys(files);
    if (names.length === 0) {
      return throwError(() => new Error('there is nothing to pack'));
    }

    const encoder = new TextEncoder();
    const bytes: Record<string, Uint8Array> = {};

    for (const name of names) {
      const content = files[name];
      bytes[name] =
        typeof content === 'string' ? encoder.encode(content) : (content ?? new Uint8Array());
    }

    return this.deflate(bytes).pipe(
      map((packed) => new Blob([new Uint8Array(packed)], { type: 'application/zip' })),
    );
  }

  /** Wraps fflate's callback, which is the only shape it offers */
  private deflate(files: Record<string, Uint8Array>): Observable<Uint8Array> {
    return from(import('fflate')).pipe(
      switchMap(
        ({ zip }) =>
          new Observable<Uint8Array>((subscriber) => {
            const cancel = zip(files, { level: 9 }, (error, data) => {
              if (error) {
                subscriber.error(error);
                return;
              }

              subscriber.next(data);
              subscriber.complete();
            });

            // Unsubscribing stops the worker rather than letting it finish
            return () => cancel();
          }),
      ),
    );
  }
}
