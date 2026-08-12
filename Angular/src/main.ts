import 'zone.js';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import { bootstrapApplication } from '@angular/platform-browser';
import { registerLicense, setCulture, setCurrencyCode } from '@syncfusion/ej2-base';
import { environment } from './environments/environment';
import { initTheme } from './app/core/theme/theme.service';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeEn);

if (environment.syncfusionLicenseKey) {
  registerLicense(environment.syncfusionLicenseKey);
}

setCulture('en-US');
setCurrencyCode('USD');

initTheme();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
