import { test, expect } from '../../../test-utils/bunTest';
import { buildCreateCustomerPayload, type CustomerFormValues } from '../buildCreateCustomerPayload';

/**
 * The payload `customers/add/page.tsx` POSTs to `/private/customers`.
 *
 * WHY THIS FUNCTION EXISTS
 * -----------------------
 * A customer added through the form failed with 400:
 *
 *     Customer validation failed: employeeCount: `` is not a valid enum value
 *     for path `employeeCount`., annualRevenue: `` is not a valid enum value for
 *     path `annualRevenue`., businessType: `` is not a valid enum value for path
 *     `businessType`.
 *
 * `businessType`, `annualRevenue` and `employeeCount` are optional ENUM fields on
 * the model (`server/src/models/customer.ts`), and each dropdown in the form has a
 * "None" option whose value is the empty string - which is what a Select reports
 * when the admin picks nothing.
 *
 * `""` is not "absent". It is a value, it is not a member of the enum, and
 * mongoose rejects the WHOLE document for it. So an admin who filled in a name and
 * an email and left three dropdowns alone got a failure naming three fields they
 * had never touched.
 *
 * This was caught only by driving the real form in a real browser. The endpoint
 * had been probed with every field populated, which is the payload the form sends
 * when the admin fills in EVERYTHING - not the payload it sends in the ordinary
 * case.
 *
 * THE RULE
 * --------
 * An optional field left blank is OMITTED, never sent as "". On create there is no
 * "clear this field" semantics to preserve: an omitted field takes the schema
 * default or stays undefined, which is what an empty string was standing in for
 * anyway. That makes the blank-means-absent rule safe here in a way it would not
 * be on update, where sending "" is how an admin clears a field.
 *
 * The server-side of the same mistake is checked in
 * `server/src/controllers/__tests__/customerIdGuard.test.ts`, which pins the
 * create handler's answer for a ValidationError.
 */

const BLANK_ENUMS: CustomerFormValues = {
  name: 'Probe Industries',
  email: 'probe@example.com',
  phone: '+1 555 0199',
  companyName: 'Probe Industries',
  industry: 'Manufacturing',
  website: '',
  employeeCount: '',
  annualRevenue: '',
  businessType: '',
  taxId: 'TX-1',
  registrationNumber: '',
  contactPerson: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
  notes: '',
  status: 'active',
  membershipTier: 'bronze',
  signupStep: 'approved',
};

test('a blank enum is omitted, not sent as an empty string', () => {
  const payload = buildCreateCustomerPayload(BLANK_ENUMS);
  // The exact assertion the failure turned on: mongoose reads a present `""` as a
  // value and rejects it, and reads an absent key as undefined.
  for (const field of ['employeeCount', 'annualRevenue', 'businessType']) {
    expect(field in payload).toBe(false);
  }
});

test('the payload contains no empty-string value at all', () => {
  // The general form of the rule above. Anything that is still "" after the build
  // is a field the form can leave blank but the function is sending - i.e. the
  // same defect under another name.
  const payload = buildCreateCustomerPayload(BLANK_ENUMS);
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      expect(value.trim() === '').toBe(false);
    }
  }
});

test('a chosen enum value survives', () => {
  // The complementary risk: a fix that dropped enum fields unconditionally would
  // make the dropdowns decorative.
  const payload = buildCreateCustomerPayload({
    ...BLANK_ENUMS,
    businessType: 'Manufacturing',
    employeeCount: '51-100',
    annualRevenue: '$1M - $5M',
  });
  expect(payload.businessType).toBe('Manufacturing');
  expect(payload.employeeCount).toBe('51-100');
  expect(payload.annualRevenue).toBe('$1M - $5M');
});

test('every field the model defines can be sent', () => {
  const payload = buildCreateCustomerPayload({
    ...BLANK_ENUMS,
    website: 'https://probe.example.com',
    registrationNumber: 'RG-9',
    contactPerson: 'Rae Probe',
    contactPersonEmail: 'rae@probe.example.com',
    contactPersonPhone: '+1 555 0101',
    notes: 'a note',
  });
  for (const field of [
    'website',
    'registrationNumber',
    'contactPerson',
    'contactPersonEmail',
    'contactPersonPhone',
    'notes',
  ] as const) {
    expect(payload[field]).toBeTruthy();
  }
});

test('name, email and the enum-backed defaults are always present', () => {
  // The fields a customer cannot be created without, plus the three the form
  // always has a non-blank value for. Dropping any of these would turn the
  // "blank means absent" rule into data loss rather than tidiness.
  const payload = buildCreateCustomerPayload(BLANK_ENUMS);
  expect(payload.name).toBe('Probe Industries');
  expect(payload.email).toBe('probe@example.com');
  expect(payload.status).toBe('active');
  expect(payload.membershipTier).toBe('bronze');
  expect(payload.signupStep).toBe('approved');
});

test('loginApproval and addresses are set by the build, not the form', () => {
  // The form cannot express these, so the builder owns them. `loginApproval: true`
  // because an admin-created customer is not pending sign-up approval, and
  // `addresses: []` because CreateCustomerRequest requires the key.
  const payload = buildCreateCustomerPayload(BLANK_ENUMS);
  expect(payload.loginApproval).toBe(true);
  expect(payload.addresses).toEqual([]);
});

test('email is trimmed but NOT lowercased', () => {
  // The model lowercases and trims on save, so lowercasing here would only
  // duplicate it. Trimming is done because the browser hands over what was typed,
  // including the trailing space a paste leaves behind.
  const payload = buildCreateCustomerPayload({ ...BLANK_ENUMS, email: '  Probe@Example.com  ' });
  expect(payload.email).toBe('Probe@Example.com');
});

test('a whitespace-only value counts as blank', () => {
  // A field containing only spaces passes a naive `!== ''` check and is stored as
  // spaces. For an enum that is still not a member, so the same failure returns
  // through a different door.
  const payload = buildCreateCustomerPayload({ ...BLANK_ENUMS, businessType: '   ' });
  expect('businessType' in payload).toBe(false);
});

test('the build does not mutate the form state', () => {
  // Snapshot the WHOLE state, not a couple of fields. Asserting on two fields let
  // a mutation of `email` pass - trimming in place instead of on the way out is
  // invisible to a test that only checks the enums and the name.
  const form: CustomerFormValues = { ...BLANK_ENUMS, email: '  Padded@Example.com  ' };
  const before = { ...form };
  buildCreateCustomerPayload(form);
  expect(form).toEqual(before);
});

test('the source must not build the payload inline in the component', () => {
  // Guards against the shape drifting back to an inline object literal, which is
  // what shipped the bug and what cannot be tested without a DOM. Same technique
  // as `uploadResponseShape.test.ts`: read the real file.
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'app', 'admin', 'data-management', 'customers', 'add', 'page.tsx'),
    'utf8'
  );
  expect(src).toContain('buildCreateCustomerPayload');
});