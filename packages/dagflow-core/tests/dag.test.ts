import { describe, it, expect } from "vitest";
import { DAGFlow } from "../src";

/**
 * Helper function to build a "basic" graph:
 *
 * a -> b -> [c, d, e]
 * c -> f -> z
 * d -> [m, n] -> z
 * e -> z
 *
 * So the overall DAG structure is:
 * a
 *  └─ b
 *      ├─ c
 *      │   └─ f
 *      │       └─ z
 *      ├─ d
 *      │   ├─ m -> z
 *      │   └─ n -> z
 *      └─ e -> z
 *
 * (Where "->" indicates parent -> child)
 */
function buildBasicGraph() {
  // a -> b -> [c,d,e]
  const graph = new DAGFlow({ id: "a" });
  const a = graph;
  const b = a.addChild({ id: "b" });
  const c = b.addChild({ id: "c" });
  const d = b.addChild({ id: "d" });
  const e = b.addChild({ id: "e" });

  // c -> f -> z
  const f = c.addChild({ id: "f" });
  const z = f.addChild({ id: "z" });

  // d -> [m, n] -> z
  const m = d.addChild({ id: "m" });
  const n = d.addChild({ id: "n" });

  m.linkEdgeById("z");
  n.linkEdgeById("z");

  // e -> z
  e.linkEdgeById("z");

  return graph;
}

describe("DAGFlow Tests", () => {
  describe("Graph Creation & Basic Structure", () => {
    it("isHead", () => {
      const graph = buildBasicGraph();
      expect(graph.isHead()).toBe(true);
      expect(graph.children[0]?.isHead()).toBe(false);
    });

    it("isLeaf", () => {
      const graph = buildBasicGraph();
      expect(graph.isLeaf()).toBe(false);
      expect(graph.find(n => n.id == "z")?.isLeaf()).toBe(true);
    });

    it("addChild", () => {
      const graph = new DAGFlow({ id: "a" });
      graph.addChild({ id: "b" });

      expect(graph.id).toBe("a");
      expect(graph.children).toHaveLength(1);
      expect(graph.children[0]?.id).toBe("b");
    });

    describe("edges", () => {
      describe("linkEdgeById", () => {
        it("should add edge", () => {
          const graph = new DAGFlow({ id: "a" });
          const b = graph.addChild({ id: "b" });
          graph.addChild({ id: "c" });
          b.linkEdgeById("c");

          expect(graph.children[1]?.id).toBe("c");
          expect(b.children[0]?.id).toBe("c");
        });

        it("should add edge only once", () => {
          const graph = new DAGFlow({ id: "a" });
          // First Link
          graph.addChild({ id: "b" });
          // Second Link
          graph.linkEdgeById("b");

          expect(graph.children).toHaveLength(1);
          expect(graph.children[0]?.id).toBe("b");
        });
      });

      describe("addEdge", () => {
        it("should merge two graphs", () => {
          const graph1 = new DAGFlow({ id: "a1" });
          graph1.addChild({ id: "b1" });
          graph1.addChild({ id: "c1" });

          const graph2 = new DAGFlow({ id: "a2" });
          graph1.addChild({ id: "b2" });
          graph1.addChild({ id: "c2" });

          // a1 -> a2
          graph1.addEdge(graph2);

          expect(graph1.children.map(n => n.id)).toContain("a2");
        });

        it("should throw if trying to self connect", () => {
          const graph1 = new DAGFlow({ id: "a1" });
          expect(() => graph1.addEdge(graph1)).toThrow(/can't add an edge to yourself/);
          expect(() => graph1.linkEdgeById("a1")).toThrow(/can't add an edge to yourself/);
        });

        it("should throw if graphs merge has duplicate ids", () => {
          const graph1 = new DAGFlow({ id: "a1" });
          graph1.addChild({ id: "b1" });
          graph1.addChild({ id: "c1" });

          // Same graph
          const graph2 = new DAGFlow({ id: "a2" });
          graph2.addChild({ id: "b1" });
          graph2.addChild({ id: "c1" });

          // a1 -> a2
          expect(() => graph1.addEdge(graph2)).toThrow(/Duplicate Node id found: 'b1'/);
        });

        it("should fail if merging graph result in multi-head hydra scenario", () => {
          // a -> [b,c]
          const a = new DAGFlow({ id: "a" });
          a.addChild({ id: "b" });
          const c = a.addChild({ id: "c" });
          // f -> e
          const f = new DAGFlow({ id: "f" });
          const e = f.addChild({ id: "e" });
          // Attempting to create a brand new DAG (different "head") and then merging them
          // would also cause a 'hydra' scenario if we do not carefully link them.
          expect(() => {
            // e -> c
            // this will result in 'a' and 'f' as heads
            e.addEdge(c);
          }).toThrow(/node \('c'\) must be an head/);

        });
      });

      describe("funnelTo", () => {
        it("should funnel all leaf to new sub graph", () => {
          const graph1 = new DAGFlow({ id: "a1" });
          const b1 = graph1.addChild({ id: "b1" });
          const d1 = b1.addChild({ id: "d1" });
          const e1 = b1.addChild({ id: "e1" });
          const c1 = graph1.addChild({ id: "c1" });

          const graph2 = new DAGFlow({ id: "a2" });
          graph2.addChild({ id: "b2" });
          graph2.addChild({ id: "c2" });

          graph1.funnelTo(graph2);

          expect(d1.children.map(n => n.id)).toContain("a2");
          expect(e1.children.map(n => n.id)).toContain("a2");
          expect(c1.children.map(n => n.id)).toContain("a2");
        });

        it("should throw if funneling result in duplicate node id", () => {
          const graph1 = new DAGFlow({ id: "a1" });
          graph1.addChild({ id: "b1" });
          graph1.addChild({ id: "c1" });

          const graph2 = new DAGFlow({ id: "a2" });
          graph2.addChild({ id: "b1" });
          graph2.addChild({ id: "c1" });

          expect(() => graph1.funnelTo(graph2)).toThrow(/Duplicate Node id found/);
        });

        it("should throw if funneling result in multi-head", () => {
          const graph1 = new DAGFlow({ id: "a1" });
          graph1.addChild({ id: "b1" });
          graph1.addChild({ id: "c1" });

          const graph2 = new DAGFlow({ id: "a2" });
          const b2 = graph2.addChild({ id: "b2" });
          graph2.addChild({ id: "c2" });

          expect(() => graph1.funnelTo(b2)).toThrow(/must be an head/);
        });
      })
    });

    it("should create a single-head graph and link children properly", () => {
      const graph = buildBasicGraph();

      // "graph" is the node 'a'
      expect(graph.id).toBe("a");
      expect(graph.children).toHaveLength(1);
      expect(graph.getHead()).toBe(graph); // 'a' is the single head

      const b = graph.children[0];
      expect(b?.id).toBe("b");

      // b => [c, d, e]
      expect(b?.children.map((child) => child.id).sort()).toEqual(["c", "d", "e"]);
    });

  });

  describe("forEach (BFS traversal)", () => {
    it("should visit all reachable nodes in BFS order from the root", () => {
      const graph = buildBasicGraph();
      const visitedIds: string[] = [];

      graph.forEach((node) => {
        visitedIds.push(node.id);
      });

      /**
       * BFS order for this graph typically is:
       *   a, b, c, d, e, f, z, m, n
       *
       * But note that BFS from `b` will also queue up [c, d, e] in that order,
       * then c will queue up [f], d will queue up [m, n], e -> [z] (via linkEdgeById),
       * f -> [z], m-> [z], n-> [z].
       *
       * Because z is added multiple times, BFS might queue it multiple times but visit only once.
       *
       * The exact order of siblings (c, d, e) might vary if the code processes children in insertion order.
       * Typically, it should be: a -> b -> c -> d -> e -> f -> z -> m -> n
       *
       * We'll check that all nodes exist exactly once in visitedIds
       */
      const expectedIds = ["a", "b", "c", "d", "e", "f", "z", "m", "n"];
      expect(visitedIds.sort()).toEqual(expectedIds.sort());
      // If you want to ensure BFS sequence exactly, you can compare index by index:
      // expect(visitedIds).toEqual(["a", "b", "c", "d", "e", "f", "m", "n", "z"]);
      // or something similar, depending on the insertion order. 
    });
  });

  describe("find (Search)", () => {
    it("should locate the node with specified ID", () => {
      const graph = buildBasicGraph();
      const found = graph.find((n) => n.id === "z");
      expect(found).toBeDefined();
      expect(found?.id).toBe("z");

      // Searching for a non-existent node
      const notFound = graph.find((n) => n.id === "foobar");
      expect(notFound).toBeUndefined();
    });
  });

  describe("resolve & status", () => {
    it("should set node to green when resolved by parent", () => {
      const graph = buildBasicGraph();
      const b = graph.find(n => n.id === "b")!;
      const c = graph.find(n => n.id === "c")!;
      const z = graph.find(n => n.id === "z")!;

      // Initially, no nodes are "chosen", so they should all be red, first should be yellow
      expect(graph.status).toBe("yellow");
      expect(b.status).toBe("red");
      expect(c.status).toBe("red");
      expect(z.status).toBe("red");

      // Let's pick "b" as resolved
      graph.resolve("b");
      // 'b' is now chosen by 'a' => 'b' should be green
      // so the parent should now be green because it is resolved
      expect(graph.status).toBe("green");
      // and 'b', the children, is yellow
      expect(b.status).toBe("yellow");
      // Meanwhile, c/d/e should still be "red" because their parent didn't choose them
      expect(c.status).toBe("red");
    });

    it("should throws if resolving on non children node", () => {
      const graph = buildBasicGraph();
      const z = graph.find(n => n.id === "z")!;
      // Now let's pick "z" => this will throws because graph does not have a direct children with id 'z'
      expect(() => graph.resolve("z")).toThrow();
      // this should not change somehow
      expect(z.status).toBe("red");
    });

    it("should reset children nodes (statuses) when changing resolution", () => {
      const graph = buildBasicGraph();
      const b = graph.find(n => n.id === "b")!;
      const c = graph.find(n => n.id === "c")!
      const d = graph.find(n => n.id === "d")!;
      const e = graph.find(n => n.id === "e")!;
      const f = graph.find(n => n.id === "f")!;

      graph.resolve("b");
      b.resolve("c");
      expect(graph.status).toBe("green");
      expect(b.status).toBe("green");
      expect(c.status).toBe("yellow");
      expect(d.status).toBe("red");
      expect(e.status).toBe("red");
      c.resolve("f");
      expect(c.status).toBe("green");
      expect(f.status).toBe("yellow");

      // Now we change one of the resolution
      b.resolve("d");
      expect(d.status).toBe("yellow");
      expect(c.status).toBe("red");
      expect(f.status).toBe("red");

    });
  });

  describe("getChain", () => {
    it("should collect nodes that are yellow or green in DFS order", () => {
      const graph = buildBasicGraph();
      // Initially only head is yellow, so getChain() return ['a']
      expect(graph.getChain().map(n => n.id)).toEqual(['a']);

      const b = graph.resolve("b");
      expect(graph.getChain().map(n => n.id)).toEqual(['a', 'b']);

      const d = b.resolve("d");
      expect(graph.getChain().map(n => n.id)).toEqual(['a', 'b', 'd']);

      const m = d.resolve("m");
      expect(graph.getChain().map(n => n.id)).toEqual(['a', 'b', 'd', 'm']);

      m.resolve("z");
      expect(graph.getChain().map(n => n.id)).toEqual(['a', 'b', 'd', 'm', 'z']);
    });
  });
});
