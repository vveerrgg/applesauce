import { NostrEvent } from "nostr-tools";
import { ProfileContent } from "./symbols.js";

export type ProfileContent = {
  name?: string;
  display_name?: string;
  displayName?: string;
  about?: string;
  /** @deprecated */
  image?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  lud06?: string;
  nip05?: string;
};

export function getProfileContent(event: NostrEvent): ProfileContent;
export function getProfileContent(event: NostrEvent, quite: false): ProfileContent;
export function getProfileContent(event: NostrEvent, quite: true): ProfileContent | Error;
export function getProfileContent(event: NostrEvent, quite = false) {
  let cached = event[ProfileContent];

  if (!cached) {
    try {
      const profile = JSON.parse(event.content) as ProfileContent;

      // ensure nip05 is a string
      if (profile.nip05 && typeof profile.nip05 !== "string") profile.nip05 = String(profile.nip05);

      cached = event[ProfileContent] = profile;
    } catch (e) {
      if (e instanceof Error) cached = event[ProfileContent] = e;
    }
  }

  if (cached === undefined) {
    throw new Error("Failed to parse profile");
  } else if (cached instanceof Error) {
    if (!quite) throw cached;
    else return cached;
  } else return cached;
}
