import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';

import { DiagramViewerComponent, DiagramViewerData } from '../../../../shared/components/overlay/diagram-viewer/diagram-viewer.component';
import { DialogService } from '../dialog/dialog.service';
import { DiagramDialogService } from './diagram-dialog.service';

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
interface DiagramDialogTestBed {
  readonly service: DiagramDialogService;
  readonly dialog: DialogStub;
}

function configure(): DiagramDialogTestBed {
  const dialog = new DialogStub();

  TestBed.configureTestingModule({
    providers: [{ provide: DialogService, useValue: dialog }],
  });

  return { service: TestBed.inject(DiagramDialogService), dialog };
}

const DATA: DiagramViewerData = {
  src: 'assets/img/diagrams/taskly/erd/en.svg',
  alt: 'The Taskly schema',
  caption: 'Entity relationships',
  width: 1200,
  height: 800,
};

describe('DiagramDialogService', () => {
  it('opens the viewer with the drawing it was handed', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open(DATA));

    expect(dialog.opened.length).toBe(1);
    expect(dialog.opened[0]?.component).toBe(DiagramViewerComponent);
    expect(dialog.opened[0]?.config['data']).toEqual(DATA);
  });

  it('uses the shared panel in its wide form, and labels itself by its own title', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open(DATA));

    expect(dialog.opened[0]?.config['panelClass']).toEqual(['cv-dialog', 'cv-dialog--wide']);
    expect(dialog.opened[0]?.config['backdropClass']).toBe('cv-dialog__backdrop');
    expect(dialog.opened[0]?.config['ariaLabelledBy']).toBe('diagram-modal-title');
  });
});
