import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'enumName', standalone: true })
export class EnumNamePipe implements PipeTransform {
  transform(value: number, enumType: any): string {
    const key = Object.keys(enumType).find((k) => enumType[k] === value);
    return key ? key.charAt(0).toUpperCase() + key.slice(1).toLowerCase() : 'N/A';
  }
}
