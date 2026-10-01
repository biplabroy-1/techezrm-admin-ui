import { test, expect } from '../../../test-utils/bunTest';
import { buildUpdateProductFormData } from '../buildUpdateProductFormData';

test('sends specifications as a JSON string', () => {
  const fd = buildUpdateProductFormData({
    name: 'Zinc Glycinate Powder',
    description: 'chelated zinc',
    price: 2222,
    category: 'amino-acids-derivatives',
    inStock: true,
    status: 'active',
    specifications: { Form: 'Crystalline Powder', 'Shelf Life ': '24 months' },
  });
  expect(JSON.parse(fd.get('specifications') as string)).toEqual({
    Form: 'Crystalline Powder',
    'Shelf Life ': '24 months',
  });
});

test('sends dietaryAttributes, not an empty array', () => {
  const fd = buildUpdateProductFormData({
    name: 'KOSHER Product',
    description: 'd',
    price: 2222,
    category: 'c',
    inStock: true,
    status: 'active',
    dietaryAttributes: [
      { title: 'KOSHER', logo: 'FileCheck', certificateLink: 'https://x/k.pdf' },
    ],
  });
  expect(JSON.parse(fd.get('dietaryAttributes') as string)).toEqual([
    { title: 'KOSHER', logo: 'FileCheck', certificateLink: 'https://x/k.pdf' },
  ]);
});

test('a second save sends the same attributes, not duplicates', () => {
  const attrs = [
    { title: 'FSSAI', logo: 'FileCheck', certificateLink: 'https://x/f.pdf' },
  ];
  const a = buildUpdateProductFormData({
    name: 'n',
    description: 'd',
    price: 2222,
    category: 'c',
    inStock: true,
    status: 'active',
    dietaryAttributes: attrs,
  });
  const b = buildUpdateProductFormData({
    name: 'n',
    description: 'd',
    price: 2222,
    category: 'c',
    inStock: true,
    status: 'active',
    dietaryAttributes: attrs,
  });
  expect(a.get('dietaryAttributes')).toBe(b.get('dietaryAttributes'));
  expect(JSON.parse(b.get('dietaryAttributes') as string)).toHaveLength(1);
});

test('specifications keys survive the round trip with their trailing space', () => {
  const fd = buildUpdateProductFormData({
    name: 'n',
    description: 'd',
    price: 2222,
    category: 'c',
    inStock: true,
    status: 'active',
    specifications: { 'Shelf Life ': '24 months' },
  });
  expect(
    Object.keys(JSON.parse(fd.get('specifications') as string))
  ).toEqual(['Shelf Life ']);
});

test('clearing every spec row sends {}, so the server actually clears them', () => {
  // The admin save is a full-form replace, so an emptied field must be sent as an
  // empty value. Omitting the key makes the server skip the field and the
  // previously-saved rows survive a delete the admin thought they had made.
  const fd = buildUpdateProductFormData({
    name: 'n',
    description: 'd',
    price: 2222,
    category: 'c',
    inStock: true,
    status: 'active',
    specifications: {},
  });
  expect(JSON.parse(fd.get('specifications') as string)).toEqual({});
});

test('clearing dietaryAttributes sends [], not an absent key', () => {
  const fd = buildUpdateProductFormData({
    name: 'n',
    description: 'd',
    price: 2222,
    category: 'c',
    inStock: true,
    status: 'active',
    dietaryAttributes: [],
  });
  expect(JSON.parse(fd.get('dietaryAttributes') as string)).toEqual([]);
});
