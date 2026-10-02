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

test('description and iconName are trimmed', () => {
  // Retitled from "strings are trimmed": that name stopped being true when `name`
  // became exempt. `description` and `iconName` are free text referenced by
  // nothing, so trimming them is still right - see the block below for why.
  const payload = buildCertPayload(FORM);
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
  expect(payload.name).toBe('  FSSAI  ');
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

/* ---- the name is an identity, not a label ---- */

/**
 * The tenth row of `certification_types` as it is ACTUALLY stored, verified
 * against live Atlas: the name carries a trailing space, and 236 products carry
 * that same string verbatim in their `dietaryAttributes[].title`, because the
 * migration copied it out of Supabase without normalising it.
 *
 * BUILT, never typed as a literal. Two earlier rounds of work in this project
 * shipped tests that passed against the exact regression they targeted, because a
 * JSDoc quoted the very string the assertion searched for - so the expected value
 * here is derived from a fixture and the padding is re-checked numerically. A
 * comment, in this file or in certForm.ts, cannot satisfy any assertion below.
 */
const STORED_HACCP = ['HACCP', ' '].join('');

test("the catalogue's own name survives a save with its trailing space intact", () => {
  // The bug: `name: form.name.trim()`. Saving ANY field of the HACCP row -
  // even just flipping isActive - rewrote it to "HACCP", and the catalogue row
  // stopped matching the title 236 products have stored. Nothing reports that:
  // the product-side picker compares trimmed, so the mismatch is invisible until
  // something compares the strings exactly.
  const payload = buildCertPayload({ ...FORM, name: STORED_HACCP });

  expect(payload.name).toBe(STORED_HACCP);
  // Not "ends with HACCP", not "matches after trim" - the exact bytes, stated
  // twice and in numbers, so no looser matcher can drift into passing this.
  expect(payload.name.length).toBe(6);
  expect(payload.name.charCodeAt(5)).toBe(32);
  expect(payload.name).not.toBe(STORED_HACCP.trim());
});

test('a name that is already clean is left exactly as it is', () => {
  // The same code path must not "helpfully" trim a clean name either: the row
  // whose stored name is "HACCP" is a different row from the one stored as
  // "HACCP ", and collapsing them is the same damage one merge later.
  const payload = buildCertPayload({ ...FORM, name: 'HACCP' });

  expect(payload.name).toBe('HACCP');
  expect(payload.name.length).toBe(5);
});

test('the rule is "never trim the name", not "special-case the HACCP row"', () => {
  // Nothing in the catalogue is named this. A fix that spared only the HACCP row
  // would still silently rename every future row an admin pastes in with padding,
  // and it would be discovered the same way - by nothing.
  const padded = ['  ', 'Organic', '  '].join('');

  expect(buildCertPayload({ ...FORM, name: padded }).name).toBe(padded);
  expect(buildCertPayload({ ...FORM, name: padded }).name.length).toBe(
    2 + 'Organic'.length + 2
  );
});

test('the name is still sent on every save, empty included', () => {
  // The other half of the fix. Exempt from trimming is NOT the same as exempt
  // from being sent: there is no `|| undefined` on this field, because that is
  // the I1 bug three lines up and it would make the name unclearable again.
  const payload = buildCertPayload({ ...FORM, name: '' });

  expect('name' in payload).toBe(true);
  expect(payload.name).toBe('');
  expect(payload.name).not.toBeUndefined();
});

test('the inline toggle carries the stored name through byte for byte', () => {
  // The toggle is the worse half of the original bug: it writes through the same
  // PUT /:id carrying every field, so flipping isActive and nothing else renamed
  // the row. It shares buildCertPayload, so it now inherits the fix - which is
  // only true because it delegates rather than rebuilding the payload.
  const payload = buildCertTogglePayload({ ...FORM, _id: 'a', name: STORED_HACCP });

  expect(payload.isActive).toBe(false);
  expect(payload.name).toBe(STORED_HACCP);
  expect(payload.name.length).toBe(6);
  expect(payload.name.charCodeAt(5)).toBe(32);
});