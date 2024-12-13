import { kinds, NostrEvent } from "nostr-tools";

import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { setContent } from "../operations/content.js";
import { includeDeleteTags } from "../operations/delete.js";

/** A blueprint for a NIP-09 delete event */
export function DeleteBlueprint(events: NostrEvent[], reason?: string): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.EventDeletion },
      ctx,
      reason ? setContent(reason) : undefined,
      includeDeleteTags(events),
    );
}