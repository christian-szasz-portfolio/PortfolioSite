import { bootstrapApplication } from '@angular/platform-browser';

import { AdmComponent } from './app/adm.component';
import { admConfig } from './app/adm.config';

bootstrapApplication(AdmComponent, admConfig).catch((error: unknown) => console.error(error));
