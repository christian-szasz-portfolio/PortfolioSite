import { bootstrapApplication } from '@angular/platform-browser';
import { lpgConfig } from './app/lpg.config';
import { LpgComponent } from './app/lpg.component';

bootstrapApplication(LpgComponent, lpgConfig).catch((err) => console.error(err));
