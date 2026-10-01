"use client";

import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "@/api/config";
import { ENDPOINTS } from "@/api/config/endpoints";

/**
 * Fill a form's address fields from the device's GPS position.
 *
 * Two separate capabilities, deliberately kept apart:
 *
 *  1. `navigator.geolocation` gives latitude and longitude. That is a browser API -
 *     no key, no provider, no cost - and it works with no backend involvement.
 *  2. Turning those coordinates into a street, city, state and postcode needs
 *     reverse geocoding, which is a data lookup. That goes through the server's
 *     `/public/maps/reverse-geocode`, which prefers Google when its key works and
 *     otherwise uses OpenStreetMap Nominatim (no key required).
 *
 * Keeping them apart matters for failure handling. If geolocation succeeds but
 * geocoding does not, the coordinates are still real and worth keeping - so they
 * are filled and the address fields are reported as unfilled, rather than the
 * whole action being rolled back or left silently incomplete.
 *
 * WHY ONLY EMPTY FIELDS
 * ---------------------
 * A user who has already typed a city does not want it silently replaced because
 * the GPS fix resolved to a different administrative boundary. So this only writes
 * a field that is currently empty. Anything already filled is left exactly as it
 * was, and the returned patch names only what changed.
 *
 * WHY THE FIELD MAP IS EXPLICIT
 * -----------------------------
 * The two form families disagree about field names: warehouses have separate
 * street / city / state / country / zipCode, while suppliers have a single free
 * -text `address`. Rather than guessing from a key name, each caller declares which
 * of its fields corresponds to which part of the geocoded address.
 */

/** The server's normalised reverse-geocode response. */
export interface ReverseGeocodeAddress {
  latitude: string;
  longitude: string;
  formattedAddress: string;
  street: string;
  city: string;
  district: string;
  state: string;
  country: string;
  countryCode: string;
  postcode: string;
  provider: string;
}

/** Which form field should receive which part of the address. */
export type AddressFieldMap<T> = Partial<
  Record<Extract<keyof T, string>, keyof ReverseGeocodeAddress>
>;

/** Only the fields this action actually wrote. Spread into the form state. */
export type FilledPatch<T> = Partial<T> & { latitude?: string; longitude?: string };

/** Which part of the operation is in flight, for a meaningful loading label. */
export type LocateStage = "gps" | "geocode" | null;

export interface UseFillFromLocation<T extends Record<string, any>> {
  /** True for the WHOLE operation, not just the GPS read. */
  busy: boolean;
  /** What the button should say while busy. */
  stage: LocateStage;
  /**
   * Fill this form's address fields, calling `apply` ONCE with everything at the
   * end.
   *
   * One-shot on purpose. An earlier version applied the coordinates immediately and
   * the address a second or two later, which looked like two separate actions and
   * left the user watching fields fill in piecemeal with no indication anything was
   * still happening. Now the form is left untouched until the whole thing is ready,
   * and `busy` stays true throughout so the button can show progress.
   *
   * The one exception: if reverse geocoding FAILS, the coordinates are still
   * applied. They were obtained successfully, and discarding them would lose real
   * data the user can see and correct.
   *
   * Never throws: a geolocation permission prompt is not an error a form should
   * surface as an exception, so every failure is reported via a toast.
   *
   * Resolves true if anything was filled.
   */
  fill: (
    current: T,
    map: AddressFieldMap<T>,
    apply: (patch: FilledPatch<T>) => void
  ) => Promise<boolean>;
}

const round6 = (n: number) => n.toFixed(6);

/** Fields that hold coordinates rather than address text. */
const COORD_FIELDS = new Set(["latitude", "longitude"]);

export function useFillFromLocation<T extends Record<string, any>>(): UseFillFromLocation<T> {
  const [stage, setStage] = useState<LocateStage>(null);
  const busy = stage !== null;

  const fill = useCallback(
    async (
      current: T,
      map: AddressFieldMap<T>,
      apply: (patch: FilledPatch<T>) => void
    ): Promise<boolean> => {
      // ---- 1. coordinates from the device -------------------------------------
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        toast.error("This browser cannot detect your location. Type the coordinates in.");
        return false;
      }

      setStage("gps");
      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      if (!position) {
        setStage(null);
        // Permission denied, timed out, or no fix available indoors all surface as
        // an opaque failure here. Distinguishing them needs the error object, which
        // this promise shape discarded, so the message covers all three honestly
        // rather than guessing which it was.
        toast.error(
          "Could not get your location. Allow location access for this site, or type the coordinates in."
        );
        return false;
      }

      const lat = round6(position.coords.latitude);
      const lng = round6(position.coords.longitude);

      // Apply the coordinates straight away, before the network call below.
      const coordPatch: FilledPatch<T> = {};
      if (isEmpty(current.latitude)) coordPatch.latitude = lat as any;
      if (isEmpty(current.longitude)) coordPatch.longitude = lng as any;
      const coordKeys = Object.keys(coordPatch).length;
      setStage("geocode");

      // ---- 2. coordinates into an address -------------------------------------
      let address: ReverseGeocodeAddress | null = null;
      try {
        const { data } = await api.get(ENDPOINTS.MAPS.REVERSE_GEOCODE, {
          params: { lat, lng },
        });
        address = (data?.data ?? null) as ReverseGeocodeAddress | null;
      } catch {
        address = null;
      }

      // ---- 3a. geocoding failed: keep the coordinates anyway -------------------
      if (!address) {
        if (coordKeys) apply(coordPatch);
        setStage(null);
        toast.error(
          coordKeys
            ? "Got your coordinates, but could not look up the address. The lat/lng were filled in - enter the rest manually."
            : "Could not look up an address for those coordinates. Enter the details manually."
        );
        return coordKeys > 0;
      }

      // ---- 3b. fill only the empty fields -------------------------------------
      const patch: Record<string, string> = {};
      const skipped: string[] = [];

      for (const [formField, addressField] of Object.entries(map)) {
        const value = String(address[addressField as keyof ReverseGeocodeAddress] ?? "").trim();
        if (!value) continue;

        // Coordinates were already applied above, as soon as the fix arrived.
        if (COORD_FIELDS.has(addressField as string)) continue;

        if (isEmpty((current as any)[formField])) {
          patch[formField] = value;
        } else {
          skipped.push(String(formField));
        }
      }

      const filledCount = Object.keys(patch).length;
      if (!filledCount) {
        setStage(null);
        if (!coordKeys) toast.error("Could not fill anything - those fields already have values.");
        return coordKeys > 0;
      }

      apply({ ...coordPatch, ...patch } as FilledPatch<T>);
      setStage(null);
      const bits = [`Filled ${filledCount} field${filledCount === 1 ? "" : "s"}`];
      if (skipped.length) {
        bits.push(`kept your ${skipped.length} existing value${skipped.length === 1 ? "" : "s"}`);
      }
      toast.success(`${bits.join(", ")}.`);
      return true;
    },
    []
  );

  return { busy, stage, fill };
}

/** An absent field, or one holding only whitespace, counts as empty. */
function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}