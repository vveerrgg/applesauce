import { Filter, NostrEvent } from "nostr-tools";
import { Query } from "../query-store/index.js";
import { COMMENT_KIND, getEventUID } from "../helpers/index.js";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";

/** Returns all NIP-22 comment replies for the event */
export function CommentsQuery(parent: NostrEvent): Query<NostrEvent[]> {
  return {
    key: `${getEventUID(parent)}-comments`,
    run: (events) => {
      const filter: Filter = { kinds: [COMMENT_KIND], "#e": [parent.id] };
      if (isParameterizedReplaceableKind(parent.kind)) filter["#a"] = [getEventUID(parent)];

      return events.timeline(filter);
    },
  };
}
