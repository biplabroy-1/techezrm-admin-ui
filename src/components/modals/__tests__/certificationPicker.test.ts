import { test, expect } from '../../../test-utils/bunTest';
import {
  toDietaryAttribute,
  sortByDisplayOrder,
  findCertificationType,
  certificationStanding,
  pickerState,
  attachableCertifications,
  attachCertification,
  detachCertificationAt,
  type DietaryAttribute,
} from '../certificationPicker';
import { buildUpdateProductFormData } from '../buildUpdateProductFormData';
import type { CertificationType } from '../../../api/services/certificationTypes';

/* ------------------------------------------------------------------ *
 * FIXTURES - REAL DATA, READ OUT OF THE DATABASE ON 2026-10-02
 * ------------------------------------------------------------------ *
 * `certification_types` (10 rows, the whole collection) and three real
 * `products.dietaryAttributes` arrays, quoted verbatim - trailing spaces and all.
 *
 * Verbatim matters more here than anywhere else in this repo. The whole reason
 * these are fixtures and not plausible-looking fakes is that a test built from tidy
 * invented data cannot tell a faithful mapping from one that happens to agree with
 * the fiction. `"HACCP "` - a name with a trailing space - is a real catalogue row
 * and a real stored title on 236 products; a fixture writer tidying their fixture
 * would have deleted the exact character this file exists to defend.
 */

const CERT_TYPES: CertificationType[] = [
  {
    _id: '9517e237b442000000000000',
    name: 'ISO 22000:2018',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669725295-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%2022000%20SS%20(1).pdf',
    displayOrder: 1,
    isActive: true,
  },
  {
    _id: '37d3c53f1a87000000000000',
    name: 'ISO 9001:2015',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669768129-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%209001%20(1).pdf',
    displayOrder: 2,
    isActive: true,
  },
  {
    // The trailing space is in the database. See the fixture note above.
    _id: '9ac941e0e226000000000000',
    name: 'HACCP ',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669808959-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20HACCP%20-%20EAS%20(2026)%20(2).pdf',
    displayOrder: 3,
    isActive: true,
  },
  {
    _id: 'de3b5ec0ebb8000000000000',
    name: 'ISO 45001:2018',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669830235-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20%2045001%20-%20DELANO%20(2026)%20(1).pdf',
    displayOrder: 4,
    isActive: true,
  },
  {
    _id: '20ccd78f37d8000000000000',
    name: 'GMP EAS',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669853181-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20%20GMP%20EAS%20(2026)%20(1).pdf',
    displayOrder: 6,
    isActive: true,
  },
  {
    _id: 'f0fb901144f4000000000000',
    name: 'FSSAI',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1760529355043-FSSAI%20License%20Copy.pdf',
    displayOrder: 7,
    isActive: true,
  },
  {
    _id: 'ecc7d33330de000000000000',
    name: 'HALAL',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1781697773939-HALAL%20VINSTAR%20BIOTECH%20PVT.%20LTD..pdf',
    displayOrder: 8,
    isActive: true,
  },
  {
    // The one row whose `logo` is not "FileCheck", and the one whose link is a
    // site-relative path rather than a supabase.co URL. A mapping that assumed
    // either value's shape would pass on nine rows and fail on this one.
    _id: 'fcb98ea1040a000000000000',
    name: 'USFDA Registered',
    iconName: 'USFDAIcon',
    fileUrl: '/certifications/usfda-bta-certificate.pdf',
    displayOrder: 9,
    isActive: true,
  },
  {
    _id: '5bcba221e0a6000000000000',
    name: 'KOSHER',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1781002855286-VINSTAR%20BIOTECH%20PVT.%20LTD%20-%20KOSHER.pdf',
    displayOrder: 10,
    isActive: true,
  },
  {
    _id: '13a60eb9bec4000000000000',
    name: 'WHO-GMP',
    iconName: 'FileCheck',
    fileUrl:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778670038294-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20%20WHO%20-%20GMP%20EAS%20(2026)%20(1).pdf',
    displayOrder: 11,
    isActive: true,
  },
];

/** EZ-PI-00001 "Zinc Glycinate Powder" - six certifications, the common case. */
const STORED_EZ00001: DietaryAttribute[] = [
  {
    title: 'ISO 22000:2018',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669725295-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%2022000%20SS%20(1).pdf',
  },
  {
    title: 'ISO 9001:2015',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669768129-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%209001%20(1).pdf',
  },
  {
    title: 'HACCP ',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669808959-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20HACCP%20-%20EAS%20(2026)%20(2).pdf',
  },
  {
    title: 'ISO 45001:2018',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669830235-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20%2045001%20-%20DELANO%20(2026)%20(1).pdf',
  },
  {
    title: 'GMP EAS',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669853181-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20%20GMP%20EAS%20(2026)%20(1).pdf',
  },
  {
    title: 'FSSAI',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1760529355043-FSSAI%20License%20Copy.pdf',
  },
];

/**
 * EZ-PI-00229 - stored in an order that is NOT `displayOrder`.
 *
 * One of 12 products like it. This is the fixture that decides whether the chip
 * list may be sorted: sorting the attached entries by `displayOrder` reorders all
 * 12 on the first save that did not touch the picker.
 */
const STORED_EZ00229: DietaryAttribute[] = [
  {
    title: 'HACCP ',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669808959-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20HACCP%20-%20EAS%20(2026)%20(2).pdf',
  },
  {
    title: 'FSSAI',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1760529355043-FSSAI%20License%20Copy.pdf',
  },
  {
    title: 'GMP EAS',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1778669853181-VINSTAR%20BIOTECH%20PVT.%20LTD.%20-%20%20GMP%20EAS%20(2026)%20(1).pdf',
  },
  ...STORED_EZ00001.filter((e) => e.title === 'ISO 22000:2018'),
  ...STORED_EZ00001.filter((e) => e.title === 'ISO 9001:2015'),
  ...STORED_EZ00001.filter((e) => e.title === 'ISO 45001:2018'),
  {
    title: 'USFDA Registered',
    logo: 'USFDAIcon',
    certificateLink: '/certifications/usfda-bta-certificate.pdf',
  },
];

/**
 * EZ-PI-00239 - the only product with a DUPLICATE title.
 *
 * `"ISO 45001:2018"` appears twice, identically. It is the product that rules out
 * deleting a chip by value.
 */
const STORED_EZ00239: DietaryAttribute[] = [
  ...STORED_EZ00001.filter((e) => e.title === 'FSSAI'),
  ...STORED_EZ00001.filter((e) => e.title === 'GMP EAS'),
  ...STORED_EZ00001.filter((e) => e.title === 'HACCP '),
  ...STORED_EZ00001.filter((e) => e.title === 'ISO 22000:2018'),
  ...STORED_EZ00001.filter((e) => e.title === 'ISO 45001:2018'),
  ...STORED_EZ00001.filter((e) => e.title === 'ISO 45001:2018'),
  {
    title: 'USFDA Registered',
    logo: 'USFDAIcon',
    certificateLink: '/certifications/usfda-bta-certificate.pdf',
  },
];

/** The payload builder, with everything but the certifications held constant. */
function payloadOf(dietaryAttributes: DietaryAttribute[]): string {
  const fd = buildUpdateProductFormData({
    name: 'Zinc Glycinate Powder',
    description: 'chelated zinc',
    price: 2222,
    category: 'amino-acids-derivatives',
    inStock: true,
    status: 'active',
    dietaryAttributes,
  });
  return fd.get('dietaryAttributes') as string;
}

/* ------------------------------------------------------------------ *
 * THE MAPPING
 * ------------------------------------------------------------------ */

test('a certification type maps to exactly the shape the migration wrote', () => {
  // The headline assertion. `logo` is the icon NAME and `certificateLink` is the
  // file URL; swapping them, or mapping `logo` from `fileUrl`, produces entries
  // that look plausible and are wrong on every one of 236 products.
  expect(toDietaryAttribute(CERT_TYPES[5])).toEqual({
    title: 'FSSAI',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1760529355043-FSSAI%20License%20Copy.pdf',
  });
});

test('the mapping never introduces an _id', () => {
  // The `dietaryAttributes` subdocument schema has no id field. Spreading the type
  // in (`{ ...cert }`) is the one-line version of this mistake and it would add an
  // `_id` to every entry, which mongoose then has to reconcile against a schema
  // that does not declare one.
  // `as unknown` first, because `DietaryAttribute` does not overlap
  // `Record<string, unknown>` and TS2352 says so. The cast is the point of the
  // assertion: `Object.keys` on the declared type cannot see a surplus `_id`.
  const derived = toDietaryAttribute(CERT_TYPES[5]) as unknown as Record<
    string,
    unknown
  >;
  expect(Object.keys(derived).sort()).toEqual([
    'certificateLink',
    'logo',
    'title',
  ]);
  expect('_id' in derived).toBe(false);
});

test('a missing iconName becomes "", not an absent key', () => {
  // `?? ''` rather than letting the value through as `undefined`:
  // `JSON.stringify` DROPS undefined object properties, so the entry would go out
  // with two keys where every other entry has three, and the subdocument schema
  // declares `logo` as required.
  const derived = toDietaryAttribute({
    ...CERT_TYPES[5],
    iconName: undefined,
    fileUrl: undefined,
  });
  expect(derived).toEqual({ title: 'FSSAI', logo: '', certificateLink: '' });
  expect(Object.keys(derived)).toHaveLength(3);
  expect(payloadOf([derived])).toBe(
    '[{"title":"FSSAI","logo":"","certificateLink":""}]'
  );
});

test('the mapping keeps the trailing space in "HACCP "', () => {
  // The catalogue row really is named `"HACCP "`. A trim() here is invisible in
  // every test written from invented data and would leave the stored entry unable
  // to find its own catalogue row.
  expect(toDietaryAttribute(CERT_TYPES[2]).title).toBe('HACCP ');
  expect(toDietaryAttribute(CERT_TYPES[2]).title).not.toBe('HACCP');
});

test('a relative fileUrl and a non-FileCheck icon both survive the mapping', () => {
  // The USFDA row is the odd one out on both fields at once.
  expect(toDietaryAttribute(CERT_TYPES[7])).toEqual({
    title: 'USFDA Registered',
    logo: 'USFDAIcon',
    certificateLink: '/certifications/usfda-bta-certificate.pdf',
  });
});

/*
 * THE `??` VS `||` QUESTION - and what is actually true about it
 * -------------------------------------------------------------
 * A review asked for a `null` fixture "so the test can actually fail on `||`".
 * That fixture cannot exist, and the reason is worth writing down rather than
 * quietly satisfying.
 *
 * For a `string | null | undefined` field, `?? ''` and `|| ''` are IDENTICAL. The
 * only falsy value a `string` can hold is `''`, and both operators map `''` to
 * `''`; `null` and `undefined` are both falsy AND both nullish, so both operators
 * map them to `''`. Verified exhaustively in Bun 1.4.2 and Node 24 over
 * `{undefined, null, '', 'FileCheck', 'USFDAIcon'}` - zero differences. The two
 * operators diverge only on falsy values that are NOT nullish, i.e. `0`, `false`
 * and `NaN`, none of which can reach a field the schema declares as a `String`.
 *
 * So the honest split is:
 *
 * - These `null` tests pin BEHAVIOUR - a JSON document can hold `null` where the
 *   TypeScript declaration cannot express it, and it must normalise to `''` - not
 *   the choice of operator. A `||` implementation passes all of them. They are
 *   kept because the behaviour is real coverage, and their comments now say so
 *   rather than implying they discriminate.
 * - `the operator never fabricates a replacement for a value that is present`
 *   below is the one test that actually discriminates.
 */

/** `null` where the declaration allows only `undefined`. The cast is the point. */
const NULL_ICON_TYPE = {
  ...CERT_TYPES[5],
  iconName: null as unknown as string,
} as CertificationType;
const NULL_FILE_TYPE = {
  ...CERT_TYPES[5],
  fileUrl: null as unknown as string,
} as CertificationType;

test('a null iconName normalises to ""', () => {
  // Does NOT discriminate `??` from `||` - see the block comment. Pins that a
  // nullish value cannot survive into the payload, which is worth knowing and is
  // not the same as pinning the operator.
  expect(toDietaryAttribute(NULL_ICON_TYPE)).toEqual({
    title: 'FSSAI',
    logo: '',
    certificateLink: CERT_TYPES[5].fileUrl,
  });
});

test('a null fileUrl normalises to ""', () => {
  expect(toDietaryAttribute(NULL_FILE_TYPE)).toEqual({
    title: 'FSSAI',
    logo: 'FileCheck',
    certificateLink: '',
  });
});

test('a null field is serialised as an empty string on the wire', () => {
  // The end-to-end consequence, and the reason the behaviour is worth a fixture
  // at all: the payload is the only thing standing between a null and 236
  // products. Also operator-agnostic.
  const sent = payloadOf([toDietaryAttribute(NULL_ICON_TYPE)]);
  expect(sent).toContain('"logo":""');
  expect(sent).not.toContain('null');
  expect(JSON.parse(sent)[0].logo).toBe('');
});

test('both fields null still yields an entry with all three keys', () => {
  const bothNull = {
    ...CERT_TYPES[5],
    iconName: null as unknown as string,
    fileUrl: null as unknown as string,
  } as CertificationType;
  const derived = toDietaryAttribute(bothNull);
  expect(Object.keys(derived).sort()).toEqual([
    'certificateLink',
    'logo',
    'title',
  ]);
  expect(payloadOf([derived])).toBe(
    '[{"title":"FSSAI","logo":"","certificateLink":""}]'
  );
});

test('the operator never fabricates a replacement for a value that is present', () => {
  // THE test that discriminates, and the actual reason `??` is specified here.
  //
  // `??` substitutes only for nullish. `||` substitutes for anything falsy, so it
  // REWRITES a value that was present. On a well-typed `string` field the two are
  // indistinguishable - the only falsy string is `''` - but a JSON document can
  // carry a number or a boolean where the declaration says string, and there `||`
  // would silently discard a stored value and replace it with `''`. `??` passes it
  // through, so the bad data is preserved and visible rather than laundered into
  // something plausible.
  //
  // `0` cannot legitimately reach this field; that is the point. The contract
  // being pinned is "do not fabricate", and a mapper that only ever substitutes
  // for absence is the one that can be trusted to be shown what it was given.
  const zeroIcon = { ...CERT_TYPES[5], iconName: 0 as unknown as string };
  expect(toDietaryAttribute(zeroIcon).logo).toBe(0 as unknown as string);

  const falseFile = { ...CERT_TYPES[5], fileUrl: false as unknown as string };
  expect(toDietaryAttribute(falseFile).certificateLink).toBe(
    false as unknown as string
  );
});

test('an absent field is replaced, and the key survives', () => {
  // The half of the fallback contract that `||` also satisfies, and the one that
  // actually bites: `undefined` must become `''` and not stay `undefined`, because
  // `JSON.stringify` DROPS an undefined property, which would send an entry with
  // two keys where every other entry has three.
  const derived = toDietaryAttribute({
    ...CERT_TYPES[5],
    iconName: undefined,
    fileUrl: undefined,
  });
  expect(Object.keys(derived)).toHaveLength(3);
  expect(payloadOf([derived])).toBe(
    '[{"title":"FSSAI","logo":"","certificateLink":""}]'
  );
});

/* ------------------------------------------------------------------ *
 * SORTING
 * ------------------------------------------------------------------ */

test('sortByDisplayOrder sorts ascending', () => {
  const shuffled = [
    CERT_TYPES[9],
    CERT_TYPES[0],
    CERT_TYPES[5],
    CERT_TYPES[2],
  ];
  expect(sortByDisplayOrder(shuffled).map((t) => t.displayOrder)).toEqual([
    1, 3, 7, 11,
  ]);
});

test('sortByDisplayOrder leaves the array it was given alone', () => {
  // The input is react-query's cached array, and the certifications admin screen
  // renders from that same cache. An in-place sort would reorder its table too.
  const shuffled = [CERT_TYPES[9], CERT_TYPES[0]];
  const before = shuffled.map((t) => t._id);
  sortByDisplayOrder(shuffled);
  expect(shuffled.map((t) => t._id)).toEqual(before);
});

test('equal displayOrder values keep their original relative order', () => {
  // THIS TEST CANNOT FAIL, and it is kept anyway - read this comment before
  // trusting it to catch anything.
  //
  // The previous version of this test claimed an unstable comparator "would make
  // the payload of two identical no-op saves differ", citing `EZ-PI-00239`'s
  // duplicated title. Both halves were wrong. `Array.prototype.sort` has been
  // stable by specification since ES2019 (measured identical in Bun 1.4.2 and
  // Node 24 on a 12-element array, 11 of them tied), and `sortByDisplayOrder` is
  // only ever called on CATALOGUE rows inside `attachableCertifications` - the
  // attached entries, duplicates included, never pass through it.
  //
  // So what this actually pins is the LANGUAGE guarantee, and it earns its place
  // only as a tripwire on the IMPLEMENTATION: if someone rewrites the sort to
  // decorate into a keyed record and sort the keys - which reorders on numeric-like
  // keys, and `_id`s are hex strings, so `sort()` on them is lexicographic and
  // stable in practice, but a `displayOrder` record would not be - this fails. The
  // claim it used to make was stronger than the claim it can support, and the
  // honest version is the one above.
  const a = { ...CERT_TYPES[3], _id: 'a', name: 'A' };
  const b = { ...CERT_TYPES[3], _id: 'b', name: 'B' };
  const c = { ...CERT_TYPES[3], _id: 'c', name: 'C' };
  expect(sortByDisplayOrder([a, b, c]).map((t) => t.name)).toEqual([
    'A',
    'B',
    'C',
  ]);
});

test('sortByDisplayOrder really does leave a tie alone, on a large tied array', () => {
  // The same tripwire, at a size where a sort that is only accidentally stable on
  // small inputs would show up. 60 rows, 59 of them tied at the same
  // `displayOrder`, one at 0.
  const tied = Array.from({ length: 59 }, (_, i) => ({
    ...CERT_TYPES[3],
    _id: `t${i}`,
    name: `T${i}`,
    displayOrder: 5,
  }));
  const first = { ...CERT_TYPES[3], _id: 'first', name: 'FIRST', displayOrder: 0 };
  const sorted = sortByDisplayOrder([...tied, first]);
  expect(sorted[0].name).toBe('FIRST');
  expect(sorted.slice(1).map((t) => t.name)).toEqual(
    tied.map((t) => t.name)
  );
});

/* ------------------------------------------------------------------ *
 * MATCHING AN ATTACHED ENTRY BACK TO THE CATALOGUE
 * ------------------------------------------------------------------ */

test('an exact title match wins over a trimmed one', () => {
  const types: CertificationType[] = [
    { ...CERT_TYPES[0], name: 'HACCP' },
    { ...CERT_TYPES[0], name: 'HACCP ' },
  ];
  expect(findCertificationType(types, 'HACCP ')?.name).toBe('HACCP ');
});

test('a title is found by its trimmed form when there is no exact row', () => {
  // A product that stored "HACCP" (no trailing space) against a catalogue row named
  // "HACCP " is still recognised as holding that certification, so it is not
  // offered a second time.
  expect(findCertificationType(CERT_TYPES, 'HACCP')?.name).toBe('HACCP ');
});

test('a title with no catalogue row resolves to undefined', () => {
  expect(findCertificationType(CERT_TYPES, 'HALAL')?.displayOrder).toBe(8);
  expect(findCertificationType(CERT_TYPES, 'BRC')).toBeUndefined();
});

test('an inactive catalogue row counts as retired', () => {
  const types = CERT_TYPES.map((t) =>
    t.name === 'HALAL' ? { ...t, isActive: false } : t
  );
  expect(certificationStanding(types, 'HALAL', 'ready')).toBe('retired');
  expect(certificationStanding(types, 'FSSAI', 'ready')).toBe('active');
});

test('a deleted catalogue row counts as retired', () => {
  // Retired is the union of the two ways a product can be holding a certification
  // the catalogue no longer offers. Treating "row deleted" as "not retired" would
  // show an unqualified chip that the admin cannot act on.
  const types = CERT_TYPES.filter((t) => t.name !== 'HALAL');
  expect(certificationStanding(types, 'HALAL', 'ready')).toBe('retired');
});

/* ------------------------------------------------------------------ *
 * THE THREE CATALOGUE STATES
 * ------------------------------------------------------------------ *
 * The bug these pin: `isRetiredCertification(types, title)` answered `true`
 * whenever no matching row was found, and `types` is `[]` on a failed request. So
 * one 500 rendered every attached certification as a grey `(retired)` chip
 * asserting "no longer offered by the active catalogue", with the add control
 * disabled and no reason given. An admin's reasonable response to that is to
 * detach them, which is the one action this control exists to enable.
 *
 * The fix is a tri-state: 'retired' is a CLAIM ABOUT THE CATALOGUE, so it is only
 * reachable once the catalogue has arrived.
 */

test('a LOADED catalogue is the only state that may claim anything is retired', () => {
  // The core of the fix, and the assertion the old boolean could not make.
  const emptyCatalogue: CertificationType[] = [];
  expect(
    certificationStanding(emptyCatalogue, 'FSSAI', 'ready')
  ).toBe('retired');
  expect(
    certificationStanding(emptyCatalogue, 'FSSAI', 'error')
  ).not.toBe('retired');
  expect(
    certificationStanding(emptyCatalogue, 'FSSAI', 'loading')
  ).not.toBe('retired');
});

test('a FAILED catalogue claims nothing, even for a title that is gone', () => {
  // Same world, same empty array - the two must be told apart by the status, not
  // inferred from the data. Without the status parameter there is nothing to tell
  // them apart with, which is precisely the original defect.
  const types = CERT_TYPES.filter((t) => t.name !== 'HALAL');
  expect(certificationStanding(types, 'HALAL', 'ready')).toBe('retired');
  expect(certificationStanding(types, 'HALAL', 'error')).toBe('unknown');
  expect(certificationStanding(types, 'HALAL', 'loading')).toBe('unknown');
});

test('a LOADING catalogue claims nothing about a row that is still active', () => {
  expect(certificationStanding(CERT_TYPES, 'FSSAI', 'loading')).toBe('unknown');
});

test('an errored catalogue never reports a retired count', () => {
  // The number is what a notice line is built from, so if it could be non-zero in
  // the error state the "no longer offered by the active catalogue" sentence would
  // still reach the screen.
  const state = pickerState({
    status: 'error',
    types: [],
    attached: STORED_EZ00001,
  });
  expect(state.retiredCount).toBe(0);
  expect(state.unknownCount).toBe(6);
  expect(state.standings.every((s) => s === 'unknown')).toBe(true);
});

test('a loading catalogue never reports a retired count either', () => {
  const state = pickerState({
    status: 'loading',
    types: [],
    attached: STORED_EZ00001,
  });
  expect(state.retiredCount).toBe(0);
  expect(state.unknownCount).toBe(6);
});

test('a loaded catalogue reports the genuine retirements, and only those', () => {
  // Two genuine retirements against a catalogue that arrived: HALAL is present but
  // deactivated, and BRC is not in the catalogue at all. Those are the only two
  // ways a certification can actually be retired, and this is the only state in
  // which the picker is entitled to report either.
  //
  // (`STORED_EZ00001` holds no HALAL, so the deactivated row has to be attached
  // explicitly here - an earlier draft of this test assumed it was there and
  // counted one.)
  const types = CERT_TYPES.map((t) =>
    t.name === 'HALAL' ? { ...t, isActive: false } : t
  );
  const attached = [
    ...STORED_EZ00001,
    { title: 'HALAL', logo: 'FileCheck', certificateLink: '/halal.pdf' },
    { title: 'BRC', logo: 'FileCheck', certificateLink: '/brc.pdf' },
  ];
  const state = pickerState({ status: 'ready', types, attached });
  expect(state.retiredCount).toBe(2);
  expect(state.unknownCount).toBe(0);
  expect(state.standings[0]).toBe('active'); // FSSAI, live
  expect(state.standings[6]).toBe('retired'); // HALAL, deactivated
  expect(state.standings[7]).toBe('retired'); // BRC, no such row
});

test('a deactivated row is retired, a deleted row is retired, an active one is not', () => {
  // The same three claims, asserted one per line so a failure names which of them
  // broke. All three are 'retired'/'active' - NOT 'unknown' - because the catalogue
  // loaded.
  const deactivated = CERT_TYPES.map((t) =>
    t.name === 'HALAL' ? { ...t, isActive: false } : t
  );
  const deleted = CERT_TYPES.filter((t) => t.name !== 'HALAL');
  expect(certificationStanding(deactivated, 'HALAL', 'ready')).toBe('retired');
  expect(certificationStanding(deleted, 'HALAL', 'ready')).toBe('retired');
  expect(certificationStanding(CERT_TYPES, 'HALAL', 'ready')).toBe('active');
});

test('a product with no attached entries has nothing unknown to explain', () => {
  // The create form's starting state. `unknownCount` must not be a count of the
  // catalogue failing to load either - it is a count of ATTACHED entries, so an
  // empty product in a failed catalogue reads as "nothing to worry about", which is
  // true: there is nothing at risk.
  const state = pickerState({ status: 'error', types: [], attached: [] });
  expect(state.unknownCount).toBe(0);
  expect(state.retiredCount).toBe(0);
});

test('the add control is disabled unless the catalogue is loaded', () => {
  const args = { types: CERT_TYPES, attached: [] as DietaryAttribute[] };
  expect(pickerState({ ...args, status: 'ready' }).canAttach).toBe(true);
  expect(pickerState({ ...args, status: 'loading' }).canAttach).toBe(false);
  expect(pickerState({ ...args, status: 'error' }).canAttach).toBe(false);
});

test('nothing is offered from a catalogue that is not loaded', () => {
  // Even if a previous load is still in the cache. Offering from stale rows during
  // a loading state would be its own kind of lie, and the admin could attach a
  // certification the catalogue no longer offers.
  const args = { types: CERT_TYPES, attached: [] as DietaryAttribute[] };
  expect(pickerState({ ...args, status: 'loading' }).attachable).toEqual([]);
  expect(pickerState({ ...args, status: 'error' }).attachable).toEqual([]);
});

test('a loaded catalogue with nothing left to offer is not attachable', () => {
  // Distinct from the two states above: here the control is disabled because the
  // product already has everything, which is a different message.
  const all = CERT_TYPES.map(toDietaryAttribute);
  const state = pickerState({ status: 'ready', types: CERT_TYPES, attached: all });
  expect(state.canAttach).toBe(false);
  expect(state.attachable).toEqual([]);
  expect(state.unknownCount).toBe(0);
  expect(state.retiredCount).toBe(0);
});

/* ------------------------------------------------------------------ *
 * WHAT THE "ADD" CONTROL OFFERS
 * ------------------------------------------------------------------ */

test('the picker offers the certifications this product does not have', () => {
  // EZ-PI-00001 holds six of the ten. The remaining four, in displayOrder:
  // HALAL 8, USFDA Registered 9, KOSHER 10, WHO-GMP 11.
  expect(attachableCertifications(CERT_TYPES, STORED_EZ00001).map((t) => t.name)).toEqual([
    'HALAL',
    'USFDA Registered',
    'KOSHER',
    'WHO-GMP',
  ]);
});

test('the picker offers the whole catalogue for a product with none', () => {
  expect(attachableCertifications(CERT_TYPES, []).map((t) => t.displayOrder)).toEqual([
    1, 2, 3, 4, 6, 7, 8, 9, 10, 11,
  ]);
});

test('the picker sorts by displayOrder whatever order the API returned', () => {
  // The server happens to sort too (`CertificationType.find().sort({displayOrder: 1})`
  // at certificationType.controller.ts:131), which means a test written against
  // the fixture as-is cannot tell a sorted picker from an unsorted one: CERT_TYPES
  // is already in `displayOrder` order, so both pass. The shuffle is what makes the
  // assertion mean anything - and the client must not depend on the server's sort
  // anyway, since that is a controller detail this screen does not control.
  const shuffled = [
    CERT_TYPES[7], // 9
    CERT_TYPES[2], // 3
    CERT_TYPES[9], // 11
    CERT_TYPES[4], // 6
    CERT_TYPES[0], // 1
    CERT_TYPES[8], // 10
    CERT_TYPES[5], // 7
    CERT_TYPES[1], // 2
    CERT_TYPES[3], // 4
    CERT_TYPES[6], // 8
  ];
  expect(attachableCertifications(shuffled, []).map((t) => t.displayOrder)).toEqual([
    1, 2, 3, 4, 6, 7, 8, 9, 10, 11,
  ]);
});

test('the picker sorts before it filters, not by chance of the input', () => {
  // Same assertion as above through a different door: the fixture is untouched, but
  // the offered SUBSET is what the admin reads, and the subset's order has to come
  // from the sort too. EZ-PI-00001 holds six of the ten, so the four offered are
  // 8, 9, 10, 11.
  const offered = attachableCertifications(
    [CERT_TYPES[9], CERT_TYPES[6], CERT_TYPES[8], CERT_TYPES[7], CERT_TYPES[0]],
    STORED_EZ00001
  );
  expect(offered.map((t) => t.name)).toEqual([
    'HALAL',
    'USFDA Registered',
    'KOSHER',
    'WHO-GMP',
  ]);
});

test('the picker offers nothing once all ten are attached', () => {
  const all = CERT_TYPES.map(toDietaryAttribute);
  expect(attachableCertifications(CERT_TYPES, all)).toEqual([]);
});

test('the picker does not offer an inactive row', () => {
  const types = CERT_TYPES.map((t) =>
    t.name === 'HALAL' ? { ...t, isActive: false } : t
  );
  expect(attachableCertifications(types, []).map((t) => t.name)).not.toContain(
    'HALAL'
  );
});

test('the picker does not offer a row with no name', () => {
  // A titleless row would attach a chip labelled nothing, and then its own title
  // key would be `''` so the picker could never tell it was already attached.
  const types: CertificationType[] = [
    ...CERT_TYPES,
    { ...CERT_TYPES[0], _id: 'blank', name: '   ', displayOrder: 0 },
  ];
  expect(attachableCertifications(types, []).map((t) => t.name)).not.toContain(
    '   '
  );
});

test('the attached "HACCP " is not offered again as "HACCP "', () => {
  // The trim in the COMPARISON, not in the stored value. Without it the picker
  // would list a certification the product already has, and an admin adding it
  // would get a second, near-identical HACCP chip.
  expect(attachableCertifications(CERT_TYPES, STORED_EZ00001).map((t) => t.name)).not.toContain(
    'HACCP '
  );
});

test('a duplicated attached title is still not offered again', () => {
  // `EZ-PI-00239` already holds "ISO 45001:2018" twice. The offer is withheld, so
  // the picker cannot make it three.
  expect(
    attachableCertifications(CERT_TYPES, STORED_EZ00239).map((t) => t.name)
  ).not.toContain('ISO 45001:2018');
});

/* ------------------------------------------------------------------ *
 * ATTACH
 * ------------------------------------------------------------------ */

test('attaching appends the derived entry', () => {
  const kosher = CERT_TYPES[8];
  const next = attachCertification(STORED_EZ00001, kosher);
  expect(next).toHaveLength(7);
  expect(next[6]).toEqual({
    title: 'KOSHER',
    logo: 'FileCheck',
    certificateLink:
      'https://agkhmcgbrlzcwllovggi.supabase.co/storage/v1/object/public/certifications/certifications/1781002855286-VINSTAR%20BIOTECH%20PVT.%20LTD%20-%20KOSHER.pdf',
  });
});

test('attaching leaves every existing entry byte-identical', () => {
  const next = attachCertification(STORED_EZ00001, CERT_TYPES[8]);
  expect(next.slice(0, STORED_EZ00001.length)).toEqual(STORED_EZ00001);
});

test('attaching does not mutate the array it was given', () => {
  const stored = [...STORED_EZ00001];
  attachCertification(stored, CERT_TYPES[8]);
  expect(stored).toHaveLength(6);
});

test('attaching an already-attached type returns the same array', () => {
  // Same REFERENCE, not just equal: a state update that changes nothing should not
  // re-render the form, and a copy would quietly re-key the whole chip list.
  const next = attachCertification(STORED_EZ00001, CERT_TYPES[2]);
  expect(next).toBe(STORED_EZ00001);
});

test('attaching a name-less type returns the same array', () => {
  const next = attachCertification(STORED_EZ00001, {
    ...CERT_TYPES[8],
    name: '  ',
  });
  expect(next).toBe(STORED_EZ00001);
});

/* ------------------------------------------------------------------ *
 * DETACH
 * ------------------------------------------------------------------ */

test('detaching removes exactly the entry at that index', () => {
  expect(detachCertificationAt(STORED_EZ00001, 0).map((e) => e.title)).toEqual([
    'ISO 9001:2015',
    'HACCP ',
    'ISO 45001:2018',
    'GMP EAS',
    'FSSAI',
  ]);
});

test('detaching one of two identical chips removes only that one', () => {
  // `EZ-PI-00239`. Deleting by value - which every other chip list in these two
  // modals does, e.g. `handleRemoveTag(tag)` - drops BOTH rows from a click on
  // one chip, and the two chips are visually identical, so the admin has no way to
  // tell them apart or to undo it.
  const next = detachCertificationAt(STORED_EZ00239, 4);
  expect(next).toHaveLength(6);
  expect(next.filter((e) => e.title === 'ISO 45001:2018')).toHaveLength(1);
  expect(next).toEqual([
    ...STORED_EZ00239.slice(0, 4),
    STORED_EZ00239[5],
    STORED_EZ00239[6],
  ]);
});

test('detaching the last entry leaves an empty array, not undefined', () => {
  // `[]` is what the server reads as "clear"; an absent key reads as "leave alone"
  // and the delete would silently undo itself.
  const one = attachCertification([], CERT_TYPES[5]);
  expect(detachCertificationAt(one, 0)).toEqual([]);
  expect(payloadOf(detachCertificationAt(one, 0))).toBe('[]');
});

test('an out-of-range index returns the same array rather than throwing', () => {
  expect(detachCertificationAt(STORED_EZ00001, 99)).toBe(STORED_EZ00001);
  expect(detachCertificationAt(STORED_EZ00001, -1)).toBe(STORED_EZ00001);
});

/* ------------------------------------------------------------------ *
 * THE ROUND TRIP - a save that did not touch the picker changes nothing
 * ------------------------------------------------------------------ */

test('a real product round-trips through the picker with no diff', () => {
  // No attach, no detach. The array in is the array out, in the array's own order.
  expect(attachCertification(STORED_EZ00001, { ...CERT_TYPES[5] })).toBe(
    STORED_EZ00001
  );
  expect(payloadOf(STORED_EZ00001)).toBe(JSON.stringify(STORED_EZ00001));
});

test('the picker never reorders the attached entries', () => {
  // `EZ-PI-00229` is stored out of `displayOrder` order, and 12 products are like
  // it. Sorting the chip list by `displayOrder` - the obvious reading of "sort by
  // displayOrder ascending" - rewrites all 12 on the first price-only save, with a
  // 200 and nothing in the log. So the ORDER is the add-picker's business; the
  // attached list keeps whatever order the product was stored in.
  const next = attachCertification(STORED_EZ00229, CERT_TYPES[8]);
  expect(next.slice(0, 7).map((e) => e.title)).toEqual(
    STORED_EZ00229.map((e) => e.title)
  );
  expect(payloadOf(STORED_EZ00229)).toBe(JSON.stringify(STORED_EZ00229));
});

/** Order-insensitive comparison: array order carries no meaning in this list. */
function byTitle(entries: DietaryAttribute[]): string[] {
  return entries.map((e) => e.title).sort();
}

test('detach then re-attach the same type changes no entry', () => {
  // The real round trip: the admin pulls a chip off and puts the same
  // certification back, which is the only way the picker ever touches an entry.
  // Every entry of all three real products, one at a time.
  //
  // The re-attached entry lands at the END rather than back in its old slot. That
  // is unavoidable - the picker appends, and it cannot know where the entry used to
  // sit - and it is harmless for the same reason the reordering products above are
  // harmless: this subdocument list is a set, and the server stores whatever order
  // the array arrives in. What is NOT acceptable is the ENTRY changing, so the
  // whole object is compared - a `logo` that came back empty, or a link that lost
  // its `%20` encoding, fails here.
  //
  // The duplicate-title case is asserted separately, because it does NOT come back
  // and that is the correct outcome rather than a bug.
  for (const stored of [STORED_EZ00001, STORED_EZ00229, STORED_EZ00239]) {
    for (let i = 0; i < stored.length; i += 1) {
      const entry = stored[i];
      const type = findCertificationType(CERT_TYPES, entry.title);
      expect(type).toBeDefined();
      const without = detachCertificationAt(stored, i);
      const roundTripped = attachCertification(without, type as CertificationType);
      // Every entry the detach left behind survives, unmoved and unrewritten.
      expect(roundTripped.slice(0, without.length)).toEqual(without);
      // The removed entry is either back or deliberately withheld (the duplicate
      // case, asserted on its own below) - never a rewritten version of it.
      const cameBack = roundTripped.length > without.length;
      if (cameBack) expect(roundTripped[roundTripped.length - 1]).toEqual(entry);
      expect(roundTripped).toHaveLength(without.length + (cameBack ? 1 : 0));
    }
  }
});

test('a duplicated title is NOT restored, and that is the correct outcome', () => {
  // `EZ-PI-00239` holds "ISO 45001:2018" twice, identically. Detach one chip and
  // the picker refuses to re-offer or re-attach it, because a title is already
  // present - so the array comes back one entry SHORT.
  //
  // The alternative - letting the attach through - would let an admin delete one of
  // two identical chips and click "Add" to put it back, and the product would
  // silently grow to three. An admin who wants the duplicate back detaches the
  // second chip too and re-adds once.
  const afterDetach = detachCertificationAt(STORED_EZ00239, 4);
  expect(afterDetach).toHaveLength(6);
  const type = findCertificationType(CERT_TYPES, 'ISO 45001:2018');
  const reattached = attachCertification(afterDetach, type as CertificationType);
  expect(reattached).toBe(afterDetach);
  expect(reattached).toHaveLength(6);
  expect(reattached.filter((e) => e.title === 'ISO 45001:2018')).toHaveLength(1);
});

test('detaching a unique title and re-adding it restores the exact entry', () => {
  // The entry the picker rebuilds on re-add is byte-identical to the one it
  // removed, because the stored entry was derived from this same catalogue row in
  // the first place. Compared as a whole object, not a title, so an emptied `logo`
  // or a re-encoded link would fail.
  const detached = detachCertificationAt(STORED_EZ00001, 0);
  const type = findCertificationType(CERT_TYPES, 'ISO 22000:2018');
  const readded = attachCertification(detached, type as CertificationType);
  expect(readded).toHaveLength(STORED_EZ00001.length);
  expect(readded[readded.length - 1]).toEqual(STORED_EZ00001[0]);
  expect(byTitle(readded)).toEqual(byTitle(STORED_EZ00001));
});

test('the payload a real product sends is the payload the migration wrote', () => {
  // End to end through the builder, string comparison included: key order,
  // trailing spaces and all. `JSON.stringify` is the only thing standing between
  // this array and 236 products' worth of certification data.
  expect(payloadOf(STORED_EZ00001)).toBe(
    JSON.stringify(STORED_EZ00001)
  );
  expect(JSON.parse(payloadOf(STORED_EZ00239))).toEqual(STORED_EZ00239);
});
