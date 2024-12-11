import { describe, it, expect } from "vitest";
import { EventFactory } from "./event-factory.js";
import { kinds } from "nostr-tools";

describe("EventFactory", () => {
  const factory = new EventFactory();

  describe("note", () => {
    it("should convert hashtags", async () => {
      expect(await factory.note("hello #nostr world")).toEqual(
        expect.objectContaining({
          kind: 1,
          content: "hello #nostr world",
          tags: [["t", "nostr"]],
        }),
      );
    });

    it('should "p" tag pubkeys mentioned in content', async () => {
      expect(await factory.note("GM nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6")).toEqual(
        expect.objectContaining({
          tags: [["p", "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"]],
        }),
      );
    });

    it("should repair nostr mentions", async () => {
      expect(await factory.note("GM npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6")).toEqual(
        expect.objectContaining({
          kind: 1,
          content: "GM nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
          tags: [["p", "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"]],
        }),
      );
    });

    it("should include emoji tags", async () => {
      expect(
        await factory.note("building :nostrudel:", {
          emojis: [
            {
              name: "nostrudel",
              url: "https://cdn.hzrd149.com/303f018e613f29e3e43264529903b7c8c84debbd475f89368cb293ec23938981.png",
            },
          ],
        }),
      ).toEqual(
        expect.objectContaining({
          kind: 1,
          content: "building :nostrudel:",
          tags: [
            [
              "emoji",
              "nostrudel",
              "https://cdn.hzrd149.com/303f018e613f29e3e43264529903b7c8c84debbd475f89368cb293ec23938981.png",
            ],
          ],
        }),
      );
    });

    it("should include client tag", async () => {
      const factory = new EventFactory({
        client: {
          name: "noStrudel",
          address: {
            kind: kinds.Handlerinformation,
            pubkey: "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5",
            identifier: "1686066542546",
          },
        },
      });

      expect(await factory.note("GM world")).toEqual(
        expect.objectContaining({
          kind: 1,
          content: "GM world",
          tags: [
            [
              "client",
              "noStrudel",
              "31990:266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5:1686066542546",
            ],
          ],
        }),
      );
    });

    it("should not change nip-19 pointers in URLs", async () => {
      expect(
        await factory.note(
          "Checkout my app https://zap.stream/naddr1qqjx2wtzx93rycmz94nrqvf3956rqep3943xgvec956xxvnxxucxze33v93rvq3qeaz6dwsnvwkha5sn5puwwyxjgy26uusundrm684lg3vw4ma5c2jsxpqqqpmxw6td7rf",
        ),
      ).toEqual(
        expect.objectContaining({
          kind: 1,
          content:
            "Checkout my app https://zap.stream/naddr1qqjx2wtzx93rycmz94nrqvf3956rqep3943xgvec956xxvnxxucxze33v93rvq3qeaz6dwsnvwkha5sn5puwwyxjgy26uusundrm684lg3vw4ma5c2jsxpqqqpmxw6td7rf",
          tags: [],
        }),
      );
    });

    it('should include "q" tags for quotes', async () => {
      expect(
        await factory.note(
          "good point nostr:nevent1qvzqqqqqqypzqwlsccluhy6xxsr6l9a9uhhxf75g85g8a709tprjcn4e42h053vaqyd8wumn8ghj7urewfsk66ty9enxjct5dfskvtnrdakj7qgmwaehxw309aex2mrp0yh8wetnw3jhymnzw33jucm0d5hsqgqqqrzq4vghcurgc2p3k70xka03m0wsvhwh244gh2f8tnk6dl49vgx9mgmd",
        ),
      ).toEqual(
        expect.objectContaining({
          tags: [
            [
              "q",
              "0000c40ab117c7068c2831b79e6b75f1dbdd065dd7556a8ba9275ceda6fea562",
              "wss://pyramid.fiatjaf.com/",
              "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
            ],
          ],
        }),
      );
    });
  });

  describe("reaction", () => {
    it('should include a "k" tag of event kind', async () => {
      expect(
        await factory.reaction({
          kind: 1,
          content: "GM",
          tags: [],
          pubkey: "pubkey",
          created_at: 0,
          sig: "",
          id: "event-id",
        }),
        "+",
      ).toEqual(
        expect.objectContaining({
          kind: 7,
          content: "+",
          tags: [
            ["e", "event-id"],
            ["p", "pubkey"],
            ["k", "1"],
          ],
        }),
      );
    });

    it('should include an "a" tag for replacealbe events', async () => {
      expect(
        await factory.reaction({
          kind: 30023,
          content: "long markdown article",
          tags: [["d", "hello-world"]],
          pubkey: "pubkey",
          created_at: 0,
          sig: "",
          id: "event-id",
        }),
        "+",
      ).toEqual(
        expect.objectContaining({
          kind: 7,
          content: "+",
          tags: [
            ["e", "event-id"],
            ["p", "pubkey"],
            ["a", "30023:pubkey:hello-world"],
            ["k", "30023"],
          ],
        }),
      );
    });

    it("should support custom emojis", async () => {
      expect(
        await factory.reaction(
          {
            kind: 1,
            content: "GM",
            tags: [],
            pubkey: "pubkey",
            created_at: 0,
            sig: "",
            id: "event-id",
          },
          {
            name: "nostrudel",
            url: "https://cdn.hzrd149.com/303f018e613f29e3e43264529903b7c8c84debbd475f89368cb293ec23938981.png",
          },
        ),
      ).toEqual(
        expect.objectContaining({
          kind: 7,
          content: ":nostrudel:",
          tags: [
            ["e", "event-id"],
            ["p", "pubkey"],
            ["k", "1"],
            [
              "emoji",
              "nostrudel",
              "https://cdn.hzrd149.com/303f018e613f29e3e43264529903b7c8c84debbd475f89368cb293ec23938981.png",
            ],
          ],
        }),
      );
    });

    it("should include relay hints", async () => {
      const factory = new EventFactory({
        getRelayHint: () => "wss://relay.example.com",
        getPubkeyRelayHint: () => "wss://user.example.com",
      });

      expect(
        await factory.reaction({
          kind: 1,
          content: "GM",
          tags: [],
          pubkey: "pubkey",
          created_at: 0,
          sig: "",
          id: "event-id",
        }),
        "+",
      ).toEqual(
        expect.objectContaining({
          kind: 7,
          content: "+",
          tags: [
            ["e", "event-id", "wss://relay.example.com"],
            ["p", "pubkey", "wss://user.example.com"],
            ["k", "1"],
          ],
        }),
      );
    });
  });
});
