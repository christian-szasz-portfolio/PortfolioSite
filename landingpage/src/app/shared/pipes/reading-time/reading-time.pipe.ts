import { Pipe, PipeTransform } from '@angular/core';

/** Words a minute: the usual figure for adult reading of technical prose */
const RATE = 220;

/** Turns a word count into how long the page will take */
@Pipe({ name: 'readingTime' })
export class ReadingTimePipe implements PipeTransform {
  public transform(words: number): string {
    if (!Number.isFinite(words) || words <= 0) {
      return 'A short read';
    }

    const minutes = Math.max(1, Math.round(words / RATE));
    return `${minutes} minute read`;
  }
}
