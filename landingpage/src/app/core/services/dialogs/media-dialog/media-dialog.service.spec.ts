import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';

import { MediaViewerComponent, MediaViewerData } from '../../../../shared/components/overlay/media-viewer/media-viewer.component';
import { DialogService } from '../dialog/dialog.service';
import { MediaDialogService } from './media-dialog.service';

/** One recorded call to the dialog service */
interface OpenedDialog {
  readonly component: unknown;
  readonly config: Record<string, unknown>;
}

class DialogStub {
  public opened: OpenedDialog[] = [];

  public open(component: unknown, config: Record<string, unknown>): Observable<void> {
    this.opened.push({ component, config });
    return of(undefined);
  }
}

/** The service under test and the dialog it was given */
interface MediaDialogTestBed {
  readonly service: MediaDialogService;
  readonly dialog: DialogStub;
}

function configure(): MediaDialogTestBed {
  const dialog = new DialogStub();

  TestBed.configureTestingModule({
    providers: [{ provide: DialogService, useValue: dialog }],
  });

  return { service: TestBed.inject(MediaDialogService), dialog };
}

const DATA: MediaViewerData = {
  poster: 'assets/img/stack86-1280.jpg',
  alt: 'A screenshot',
  label: 'stack86 · compiler',
  clip: 'assets/clip/stack86.webm',
};

describe('MediaDialogService', () => {
  it('opens the viewer with the picture it was handed', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open(DATA));

    expect(dialog.opened.length).toBe(1);
    expect(dialog.opened[0]?.component).toBe(MediaViewerComponent);
    expect(dialog.opened[0]?.config['data']).toEqual(DATA);
  });

  it('shares the panel, backdrop and labelling the other pop-ups use', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open(DATA));

    expect(dialog.opened[0]?.config['panelClass']).toBe('cv-dialog');
    expect(dialog.opened[0]?.config['backdropClass']).toBe('cv-dialog__backdrop');
    expect(dialog.opened[0]?.config['ariaLabelledBy']).toBe('media-modal-title');
  });
});
