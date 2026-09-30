import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { LpgComponent } from './app/lpg.component';
import { config } from './app/lpg.config.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(LpgComponent, config, context);

export default bootstrap;
