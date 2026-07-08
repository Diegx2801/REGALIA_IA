import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// FLUJO ANGULAR: bootstrapApplication inicia la app cargando App como componente raiz.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
