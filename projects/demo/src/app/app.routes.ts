import { Routes } from '@angular/router';

import { HomePage } from './home-page';
import { OtherPage } from './other-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'other', component: OtherPage },
];
