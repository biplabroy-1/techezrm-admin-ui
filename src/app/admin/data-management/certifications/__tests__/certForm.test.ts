import { test, expect } from '../../../../../test-utils/bunTest';
import {
  buildCertPayload,
  buildCertTogglePayload,
  type CertFormState,
} from '../certForm';

/**
 * I1 - two "clear this field" controls that silently did nothing.
 *
 * `findByIdAndUpdate` strips `undefined` (verified against this mongoose version:
 * `_castUpdate` drops it), so a key sent as `undefined` leaves the stored value in
 * place and the admin gets a success toast. The `fileUrl` case was the worst of the
 * three: the "PDF uploaded" chip's own onDelete sets `fileUrl: ''`, and the payload
 * then omitted the key entirely - so the control whose whole purpose is to clear the
 * field did nothing at all.
 *
 * Pure function extracted from page.tsx because no renderer is installed here; see
 * the note at the top of certForm.ts.
 */

const FORM: CertFormState = {
  name: '  FSSAI  ',
  description: '  Food safety certification.  ',
  iconName: '  VerifiedUser  ',
  displayOrder: 2,
  isActive: true,
  fileUrl: 'https://cdn.example/fssai.pdf',
};

/* ---- I1: clearing iconName ---- */

test('a blank iconName is sent as an empty string, so clearing actually clears', () => {
  // The bug: `iconName: form.iconName.trim() || undefined`. mongoose strips
  // undefined, so the stored icon survived every save and there was no way to remove
  // one.
  const payload = buildCertPayload({ ...FORM, iconName: '' });

  expect(payload.iconName).toBe('');
  expect('iconName' in payload).toBe(true);
  expect(payload.iconName).not.toBeUndefined();
});

test('a whitespace-only iconName counts as blank', () => {
  expect(buildCertPayload({ ...FORM, iconName: '   ' }).iconName).toBe('');
});

/* ---- I1: clearing fileUrl ---- */

test('an emptied fileUrl is sent, so the chip onDelete really clears the PDF', () => {
  // The bug: `...(form.fileUrl ? { fileUrl } : {})`, so a cleared URL omitted the
  // key and findByIdAndUpdate kept the stored value. Reopening the dialog showed the
  // PDF still attached - the control did nothing at all.
  const cleared = buildCertPayload({ ...FORM, fileUrl: '' });

  expect(cleared.fileUrl).toBe('');
  expect('fileUrl' in cleared).toBe(true);
  expect(cleared.fileUrl).not.toBeUndefined();
});

test('an unchanged fileUrl is still sent, not omitted', () => {
  // The other half: a conditional-spread payload cannot distinguish "unchanged" from
  // "cleared", so one form has to be wrong. Sending it unconditionally is what makes
  // both directions work.
  expect(buildCertPayload(FORM).fileUrl).toBe('https://cdn.example/fssai.pdf');
});

/* ---- clearing description ---- */

test('a blank description is sent as an empty string', () => {
  const payload = buildCertPayload({ ...FORM, description: '' });
  expect(payload.description).toBe('');
  expect('description' in payload).toBe(true);
});

/* ---- the falsy values ---- */

test('displayOrder 0 is preserved, not defaulted up', () => {
  // 0 is the legitimate "show this row first". Anything like `|| 1` would quietly
  // refuse to put a row first.
  const payload = buildCertPayload({ ...FORM, displayOrder: 0 });
  expect(payload.displayOrder).toBe(0);
});

test('isActive false is preserved, so a row can be deactivated', () => {
  // Without this a row could never leave the storefront's certification strip.
  const payload = buildCertPayload({ ...FORM, isActive: false });
  expect(payload.isActive).toBe(false);
});

/* ---- the sweep ---- */

test('no field of the payload is ever undefined', () => {
  // One sweep over the whole payload: any field that can become undefined is a field
  // that cannot be cleared, and each of the three original bugs was one `|| undefined`
  // or one conditional spread away.
  const payload = buildCertPayload({
    ...FORM,
    description: '',
    iconName: '',
    fileUrl: '',
    isActive: false,
    displayOrder: 0,
  });

  for (const [key, value] of Object.entries(payload)) {
    expect({ key, isUndefined: value === undefined }).toEqual({
      key,
      isUndefined: false,
    });
  }
});

test('strings are trimmed', () => {
  const payload = buildCertPayload(FORM);
  expect(payload.name).toBe('FSSAI');
  expect(payload.description).toBe('Food safety certification.');
  expect(payload.iconName).toBe('VerifiedUser');
});

/* ---- the inline toggle ---- */

test('the toggle flips isActive and carries the rest of the row through', () => {
  const payload = buildCertTogglePayload({ ...FORM, _id: 'a' });

  expect(payload.isActive).toBe(false);
  // Carried, not dropped: this writes through the general PUT, so a payload holding
  // only isActive depends on the server treating an absent key as "leave alone" -
  // which is precisely the assumption that broke the clear-field controls above.
  expect(payload.name).toBe('FSSAI');
  expect(payload.displayOrder).toBe(2);
  expect(payload.fileUrl).toBe('https://cdn.example/fssai.pdf');
});

test('the toggle flips an inactive row back on', () => {
  expect(buildCertTogglePayload({ ...FORM, _id: 'a', isActive: false }).isActive).toBe(
    true
  );
});

test('the toggle does not leak the row id into the payload', () => {
  // `_id` is the path parameter, not a body field. Sending it would either be
  // rejected or, worse, be taken as an instruction to change the document's identity.
  const payload: any = buildCertTogglePayload({ ...FORM, _id: 'a' });
  expect('_id' in payload).toBe(false);
});