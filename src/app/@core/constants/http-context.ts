import { HttpContextToken } from '@angular/common/http';

export const DISABLE_TOAST = new HttpContextToken<boolean>(() => false);

export const SHOW_SUCCESS_TOAST = new HttpContextToken<boolean>(() => true);
