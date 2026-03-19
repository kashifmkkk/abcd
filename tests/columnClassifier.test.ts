import { describe, it, expect } from 'vitest';
import { classifyColumn, classifyAllColumns } from '@/lib/ai/columnClassifier';

describe('columnClassifier', () => {
  it('returns id for Employee ID', () => {
    expect(classifyColumn('Employee ID', ['1', '2', '3'])).toBe('id');
  });

  it('returns text for email column', () => {
    expect(classifyColumn('email', ['a@x.com', 'b@y.com'])).toBe('text');
  });

  it('returns datetime for Date of Joining', () => {
    expect(classifyColumn('Date of Joining', ['2025-01-01', '2025-02-01'])).toBe('datetime');
  });

  it('returns continuous for Salary with many distinct numeric values', () => {
    const values = Array.from({ length: 1000 }, (_, i) => String(i + 1));
    expect(classifyColumn('Salary', values)).toBe('continuous');
  });

  it('returns categorical for Department with 6 unique strings', () => {
    const values = ['HR', 'IT', 'Sales', 'Finance', 'Ops', 'Legal', 'HR', 'IT'];
    expect(classifyColumn('Department', values)).toBe('categorical');
  });

  it('returns boolean for isActive with numeric and boolean-like values', () => {
    const values = ['1', '0', '1', '0', 'true', 'false'];
    expect(classifyColumn('isActive', values)).toBe('boolean');
  });

  it('returns categorical for Status values', () => {
    expect(classifyColumn('Status', ['active', 'inactive', 'active'])).toBe('categorical');
  });

  it('returns text for empty values array', () => {
    expect(classifyColumn('Notes', [])).toBe('text');
  });

  it('classifyAllColumns returns expected mixed roles', () => {
    const rows = [
      {
        employee_id: '1',
        name: 'Alice',
        department: 'HR',
        salary: '90000',
        isActive: '1',
        joinedAt: '2025-01-10',
      },
      {
        employee_id: '2',
        name: 'Bob',
        department: 'IT',
        salary: '110000',
        isActive: '0',
        joinedAt: '2025-02-15',
      },
      {
        employee_id: '3',
        name: 'Cara',
        department: 'HR',
        salary: '95000',
        isActive: '1',
        joinedAt: '2025-03-20',
      },
    ];

    const result = classifyAllColumns(rows);
    const map = new Map(result.map((column) => [column.name, column.role]));

    expect(map.get('employee_id')).toBe('id');
    expect(map.get('name')).toBe('text');
    expect(map.get('department')).toBe('categorical');
    expect(map.get('salary')).toBe('continuous');
    expect(map.get('isActive')).toBe('boolean');
    expect(map.get('joinedAt')).toBe('datetime');
  });

  it('returns datetime when values are all dates even without date keyword', () => {
    expect(classifyColumn('eventWindow', ['2025-01-01', '2025-02-01', '2025-03-01'])).toBe('datetime');
  });
});
