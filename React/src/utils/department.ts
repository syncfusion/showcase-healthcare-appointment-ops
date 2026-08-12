import type { DepartmentDto } from '@models/dtos';

export interface DepartmentOption extends DepartmentDto {
  displayLabel: string;
}


export function withDepartmentLabel(departments: DepartmentDto[]): DepartmentOption[] {
  return departments.map((d) => ({ ...d, displayLabel: `${d.departmentName} — ${d.locationName}` }));
}
