/**
 * The JSON payload `customers/add/page.tsx` POSTs to `/private/customers`.
 *
 * Extracted from the component for the same reason `buildUpdateProductFormData`
 * is: the shape of what goes on the wire must be assertable without a DOM or a
 * React renderer, neither of which is installed here.
 *
 * WHY A BUILDER AT ALL
 * --------------------
 * This exists because an empty string is not "absent".
 *
 * `businessType`, `annualRevenue` and `employeeCount` are optional ENUM fields on
 * the model (`server/src/models/customer.ts`), and each dropdown in the form has a
 * "None" option whose value is `""` - which is what a Select reports when the
 * admin picks nothing. Sending `""` for those is not the same as sending nothing:
 * mongoose casts the key, reads the value, finds it is not a member of the enum,
 * and rejects the WHOLE document:
 *
 *     Customer validation failed: employeeCount: `` is not a valid enum value
 *     for path `employeeCount`., annualRevenue: `` ... , businessType: `` ...
 *
 * So an admin who typed a name and an email, left three dropdowns alone, and
 * pressed Create got a 400 naming three fields they had never touched. Verified by
 * driving the real form in a real browser; probing the endpoint with every field
 * populated had missed it, because that is the payload the form sends when someone
 * fills in EVERYTHING rather than the one it sends in the ordinary case.
 *
 * THE RULE
 * --------
 * A field the admin left blank is OMITTED, never sent as "". On create this costs
 * nothing: an omitted field takes the schema default or stays undefined, which is
 * what the empty string was standing in for anyway.
 *
 * This is specifically a CREATE rule. On update, sending "" is how an admin CLEARS
 * a field, so the same transformation there would silently discard their intent -
 * which is why `buildUpdateProductFormData` does not do this and this file is not
 * shared with it.
 */

/** Mirrors the form's state, one entry per control on the page. */
export interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  industry: string;
  website: string;
  employeeCount: string;
  annualRevenue: string;
  businessType: string;
  taxId: string;
  registrationNumber: string;
  contactPerson: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  notes: string;
  status: string;
  membershipTier: string;
  signupStep: string;
}

/**
 * The always-present fields.
 *
 * These five are the ones the form can never leave blank - two are validated
 * before submit, three have non-blank defaults - so the payload type REQUIRES
 * them. Without this the type would be `Partial<CustomerFormValues>` and the
 * service call would not compile, because `CreateCustomerRequest` needs them.
 */
type AlwaysPresent = Pick<
  CustomerFormValues,
  'name' | 'email' | 'status' | 'membershipTier' | 'signupStep'
>;

type MaybeOmitted = Partial<
  Omit<CustomerFormValues, keyof AlwaysPresent>
>;

/** What `CreateCustomerRequest` accepts, minus what the builder owns. */
export type CreateCustomerPayload = AlwaysPresent &
  MaybeOmitted & {
    loginApproval: boolean;
    addresses: never[];
  };

/**
 * Build the request body.
 *
 * Blank means "trimmed to nothing", so a field holding only spaces is treated as
 * blank too - otherwise a whitespace-only value slips past a `!== ''` check and
 * the enum failure returns through a different door.
 *
 * `loginApproval` and `addresses` are set here rather than in the component
 * because the form has no control for either: an admin-created customer is not
 * pending sign-up approval, and `CreateCustomerRequest` requires `addresses`.
 */
export function buildCreateCustomerPayload(
  form: CustomerFormValues
): CreateCustomerPayload {
  const entries = Object.entries(form)
    .filter(([key, value]) => {
      if (typeof value !== 'string') return true;
      if (value.trim() !== '') return true;
      // The five fields the form can never leave blank are never dropped, even if
      // a caller hands over a cleared state. `status` / `membershipTier` /
      // `signupStep` are non-blank only because `INITIAL_FORM` defaults them, and
      // a future edit that clears one must not silently produce a payload missing
      // a field the type requires.
      return (ALWAYS_PRESENT as readonly string[]).includes(key);
    })
    .map(([key, value]) =>
      // Email is the one field trimmed on the way out: the browser hands over
      // exactly what was typed, including the trailing space a paste leaves. NOT
      // lowercased - the model does that on save, and doing it here too would
      // just duplicate the rule in a second place to keep in step.
      key === 'email' ? [key, (value as string).trim()] : [key, value]
    );

  return {
    ...Object.fromEntries(entries),
    loginApproval: true,
    addresses: [],
  } as CreateCustomerPayload;
}

/**
 * The five keys the payload always carries.
 *
 * Named rather than inlined at the return so the filter above and this list
 * cannot drift - the filter has to read from the same list the type is built
 * from, or one of the two stops describing the contract.
 */
const ALWAYS_PRESENT = [
  'name',
  'email',
  'status',
  'membershipTier',
  'signupStep',
] as const;