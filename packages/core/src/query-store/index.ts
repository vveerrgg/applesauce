import { BehaviorSubject, Observable } from "rxjs";
import { Filter, NostrEvent } from "nostr-tools";

import { EventStore } from "../event-store/event-store.js";
import { LRU } from "../helpers/lru.js";

import * as Queries from "../queries/index.js";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { shareLatestValue } from "../observable/share-latest-value.js";

export type Query<T extends unknown> = {
  /**
   * A unique key for this query. this is used to detect duplicate queries
   */
  key: string;
  /** The args array this query was created with. This is mostly for debugging */
  args?: Array<any>;
  /**
   * The meat of the query, this should return an Observables that subscribes to the eventStore in some way
   */
  run: (events: EventStore, store: QueryStore) => Observable<T>;
};
export type QueryConstructor<T extends unknown, Args extends Array<any>> = (...args: Args) => Query<T>;

export class QueryStore {
  static Queries = Queries;

  store: EventStore;
  constructor(store: EventStore) {
    this.store = store;
  }

  queries = new LRU<Query<any>>();
  observables = new WeakMap<Query<any>, BehaviorSubject<any> | Observable<any>>();

  /** Creates a cached query */
  createQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> },
    ...args: Args
  ): Observable<T> {
    const tempQuery = queryConstructor(...args);
    const key = `${queryConstructor.name}|${tempQuery.key}`;

    let query = this.queries.get(key);
    if (!query) {
      query = tempQuery;
      this.queries.set(key, tempQuery);
    }

    if (!this.observables.has(query)) {
      query.args = args;
      const observable = query.run(this.store, this).pipe(shareLatestValue()) as Observable<T>;
      this.observables.set(query, observable);
      return observable;
    }

    return this.observables.get(query)! as Observable<T>;
  }

  /** Creates a SingleEventQuery */
  event(id: string) {
    return this.createQuery(Queries.SingleEventQuery, id);
  }

  /** Creates a MultipleEventsQuery */
  events(ids: string[]) {
    return this.createQuery(Queries.MultipleEventsQuery, ids);
  }

  /** Creates a ReplaceableQuery */
  replaceable(kind: number, pubkey: string, d?: string) {
    return this.createQuery(Queries.ReplaceableQuery, kind, pubkey, d);
  }

  /** Creates a ReplaceableSetQuery */
  replaceableSet(pointers: { kind: number; pubkey: string; identifier?: string }[]) {
    return this.createQuery(Queries.ReplaceableSetQuery, pointers);
  }

  /** Creates a TimelineQuery */
  timeline(filters: Filter | Filter[], keepOldVersions?: boolean) {
    return this.createQuery(Queries.TimelineQuery, filters, keepOldVersions);
  }

  /** Creates a ProfileQuery */
  profile(pubkey: string) {
    return this.createQuery(Queries.ProfileQuery, pubkey);
  }

  /** Creates a ReactionsQuery */
  reactions(event: NostrEvent) {
    return this.createQuery(Queries.ReactionsQuery, event);
  }

  /** Creates a MailboxesQuery */
  mailboxes(pubkey: string) {
    return this.createQuery(Queries.MailboxesQuery, pubkey);
  }

  /** Creates a ThreadQuery */
  thread(root: string | EventPointer | AddressPointer) {
    return this.createQuery(Queries.ThreadQuery, root);
  }
}

export { Queries };
