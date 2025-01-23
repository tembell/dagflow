import { assert } from "./utils";

export default class DAG {
  /** unique */
  id: NodeOptions['id'];
  meta?: NodeOptions['meta'];
  children: DAG[];
  parents: DAG[];
  /** The "activeChild" is which child was chosen (resolved) among many */
  activeChild: DAG | null;

  constructor({ id, meta }: NodeOptions) {
    this.id = id;
    this.meta = meta;
    this.children = [];
    this.parents = [];
    this.activeChild = null;
  }

  // GETTERS / SETTERS

  /**
   * The parent that resolved to this child (i.e. the parent who set activeChild to 'this').
   * If there are multiple parents, we find the one for which "this" is activeChild.
   */
  public get parent(): DAG | null {
    return this.parents.find((p) => p.activeChild?.id === this.id) || null;
  }

  /**
   * The node status logic:
   * - "green": if the node is resolved
   * - "yellow": if the node is not resolved, but at least one parent is resolved
   * - "red": otherwise
   */
  public get status(): "red" | "green" | "yellow" {
    if (this.activeChild !== null) {
      return "green";
    }
    // if at least one parent is resolved => "yellow"
    if (this.parents.length === 0 || this.parent?.status === "green") {
      return "yellow";
    }
    return "red";
  }

  // METHODS

  /**
   * shallow clone of this node, linking to same children
   * useful for react immutabiliy
   */
  clone(): DAG {
    const newNode = new DAG({ id: this.id, meta: this.meta });
    newNode.activeChild = this.activeChild;
    newNode.children = this.children;
    newNode.parents = this.parents;
    return newNode;
  }

  /**
   * create and add node to graph, implicitly create an edge
   */
  public addChild(options: NodeOptions): DAG {
    const newNode = new DAG(options);
    this.addEdge(newNode);
    return newNode;
  }

  /**
   * use this two connet TWO DIFFERENT graph together, each graph must have unique ids!
   * @throws if ids are not unique 
   * @throws if merging result in HYDRA (two graph heads) -- by passing a graph head to this function you will not get an HYDRA
   */
  public addEdge(node: DAG): void {
    assert(this.id !== node.id, `DAG::addEdge -- can't add an edge to yourself ('${this.id}')!`);
    assert(
      ((node.isHead()) || node.getHead() === this.getHead()),
      `DAG::addEdge -- node ('${node.id}') must be an head or share the same head to prevent multi-head graph`
    );

    const head = this.getHead();
    const newIds = node.map(n => n.id);

    const dupliacteNode = head.find(n => newIds.includes(n.id));
    assert(dupliacteNode === undefined, `DAG::addEdge -- Duplicate Node id found: '${dupliacteNode?.id}' -- ids must be unique in a graph`);

    this.children.push(node);
    node.parents.push(this);
  }

  /**
   * use when connecting two nodes that are in the same graph
   * @throws if 'id' does not exist in current graph (not only children)
   * note: because the node must exist, we can't have duplicate ids issues or HYDRA (multi-head) error
   */
  public linkEdgeById(id: string): void {
    assert(this.id !== id, `DAG::linkEdgeById -- can't add an edge to yourself ('${id}')!`);
    const alreadyLinked = this.children.some(n => n.id === id);
    if (alreadyLinked) {
      return;
    }
    const head = this.getHead();
    const target = head.find(n => n.id === id);
    assert(target !== undefined, `DAG::linkEdgeById -- id '${id}' must exist!`);
    // @ts-expect-error we asserted that this is defined
    this.children.push(target);
    // @ts-expect-error we asserted that this is defined
    target.parents.push(this);
  }

  /**
   * This is a soft action,
   * - trying to link to yourself will exit quietly
   * - trying to add an existing node, will link to exist
   * - if it does not exist it will merge the graph
   */
  public addOrLinkEdge(node: DAG) {
    if (node.id === this.id) return;
    if (this.getHead().find(n => n.id === node.id)) {
      this.linkEdgeById(node.id);
    } else {
      this.addEdge(node);
    }
  }


  /**
   * this will link all leaf node to point to this graph head
   */
  public funnelTo(subGraph: DAG): void {
    // find all leaves
    const leaves: DAG[] = [];
    // first we gather then we modify, not in same time, can cause errors
    this.forEach(node => {
      if (node.isLeaf()) {
        leaves.push(node);
      }
    });
    leaves.forEach(leaf => {
      // first leave need to addEdge (will check for conflicts)
      leaf.addOrLinkEdge(subGraph);
    })
  }

  /**
   * get the root of the graph
   * @asserts that we only have one head
   */
  public getHead(): DAG {
    const heads = this.getHeads();
    assert(
      heads.length === 1,
      `DAG::getHead -- graph must only have one head. We don't work with Hydras here.\n
       Heads found: [${heads.map(h => h.id).join(', ')}]`
    );
    //@ts-expect-error we asserted that this is defined
    return heads[0];
  }

  public isHead(): boolean {
    return this.id === this.getHead().id;
  }

  public isLeaf(): boolean {
    return this.children.length === 0;
  }

  /**
     * Get all "heads" in the DAG by traversing
     * upward (via parents) from "this" node
     * until we find nodes that have no parents.
     * Returns an array of those head nodes (unique).
     */
  private getHeads(): DAG[] {
    const heads = new Set<DAG>();

    const recurseUp = (node: DAG) => {
      if (node.parents.length === 0) {
        // This node is a head
        heads.add(node);
      } else {
        // Keep going up
        for (const parent of node.parents) {
          recurseUp(parent);
        }
      }
    };

    recurseUp(this);
    return Array.from(heads);
  }

  /**
   * Returns a flattened list of nodes that are "green" or "yellow"
   * in some consistent order (e.g., BFS or DFS).
   * For simplicity, let's do a DFS to gather them.
   */
  public getChain(): DAG[] {
    const result: DAG[] = [];

    const visit = (node: DAG | undefined) => {
      // FIXME: we should never have here undefined, somthing set a children to undefined
      // TODO: maybe fail if we see an already existing node?
      if (!node || result.find(n => n.id === node.id) || node.status === "red") {
        return;
      }
      // If node is green or yellow, we add it
      result.push(node);
      node.children.forEach(visit);
    };

    // Start from "this" as the root
    visit(this);

    return result;
  }

  /**
   * Attempt to resolve a child by its id.
   * If the node is found, mark it as resolved (green).
   * Throws if no child with that ID is found in the entire subgraph.
   */
  public resolve(childId: string): DAG {
    // Do nothing if resolving to same children
    if (this.activeChild?.id === childId) return this.activeChild;

    const targetNode = this.children.find(n => n.id === childId);
    assert(targetNode !== undefined, `DAG::resolve -- Node ('${this.id}') doesn't have a '${childId}' children.`);
    if (this.activeChild !== null) {
      this.reset();
    }
    //@ts-expect-error
    this.activeChild = targetNode;
    //@ts-expect-error
    return this.activeChild;
  }

  public reset(): void {
    if (this.activeChild) {
      this.activeChild.reset();
      this.activeChild = null;
    }
  }

  /**
   * Breadth-First Search (BFS) starting from "this".
   * Calls the callback function for each visited node.
   */
  public forEach(callback: (node: DAG) => void): void {
    const visited = new Set<DAG>();
    const queue: DAG[] = [this];

    while (queue.length > 0) {
      const current = queue.shift() as DAG;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      // Invoke the callback
      callback(current);

      // Enqueue children
      for (const child of current.children) {
        if (!visited.has(child)) {
          queue.push(child);
        }
      }
    }
  }

  public find(predicate: (node: DAG) => boolean): DAG | undefined {
    let found: DAG | undefined = undefined;
    this.forEach(n => {
      if (found) return;
      if (predicate(n)) {
        found = n;
      }
    })
    return found;
  }

  public map<T extends any>(mapper: (node: DAG) => T): Array<T> {
    let array: T[] = [];
    this.forEach(n => {
      array.push(mapper(n));
    })
    return array;
  }

  /**
   * Pretty-print an ASCII tree for this node (and its subgraph).
   *
   * Example output:
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
   * (Where "->" indicates a shared link, i.e. we've already encountered that node.)
   */
  public toString(): string {
    const lines: string[] = [];
    const visited = new Set<DAG>();

    /**
     * Recursive DFS printer.
     *
     * @param node     Current node to print
     * @param prefix   Current ASCII prefix (spaces/lines)
     * @param isLast   True if this node is the last child of its parent
     * @param isRoot   True only for the very first call (root node)
     */
    const drawNode = (
      node: DAG,
      prefix: string,
      isLast: boolean,
      isRoot: boolean
    ) => {
      const isNew = !visited.has(node);
      visited.add(node);

      if (isRoot) {
        // The very first (root) node: print without ├─/└─
        lines.push(node.id);
      } else {
        // Non-root children: show branching characters
        // if `isNew` is false, it means we've visited this node already (shared link)
        const branch = isNew ? "" : "-> ";
        lines.push(prefix + (isLast ? "└─ " : "├─ ") + branch + node.id);
      }

      if (isNew) {
        // Recurse only if this node has not been displayed before
        const nextPrefix = prefix + (isLast ? "   " : "│  ");
        node.children.forEach((child, index) => {
          drawNode(child, nextPrefix, index === node.children.length - 1, false);
        });
      }
    };

    // Initiate DFS from this node (treat "this" as root)
    // We set isLast = true for the root (there's no sibling above or below).
    drawNode(this, "", true, true);

    // Join all lines by a newline to create the final multi-line string
    return lines.join("\n");
  }
}

export interface NodeOptions {
  id: string;
  meta?: Record<string, any>;
}
