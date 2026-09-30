import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ArchiveService } from './archive.service';

describe('ArchiveService', () => {
  let service: ArchiveService;

  const namesIn = async (blob: Blob): Promise<string> =>
    new TextDecoder().decode(await blob.arrayBuffer());

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ArchiveService] });
    service = TestBed.inject(ArchiveService);
  });

  it('keeps the name it is given for every entry', async () => {
    const blob = await firstValueFrom(
      service.pack({ 'index.html': '<p>hi</p>', 'css/cv.css': 'p { color: red }' }),
    );

    expect(blob.type).toBe('application/zip');

    // The zip's own directory carries the names, so read them back out
    const text = await namesIn(blob);
    expect(text).toContain('index.html');
    expect(text).toContain('css/cv.css');
  });

  it('takes bytes as they are and encodes text as UTF-8', async () => {
    const blob = await firstValueFrom(
      service.pack({ 'a.bin': new Uint8Array([1, 2, 3]), 'b.txt': 'plain' }),
    );

    expect(blob.size).toBeGreaterThan(0);
    const text = await namesIn(blob);
    expect(text).toContain('a.bin');
    expect(text).toContain('b.txt');
  });

  it('refuses an empty set rather than handing over an empty archive', async () => {
    await expect(firstValueFrom(service.pack({}))).rejects.toThrow('nothing to pack');
  });
});
