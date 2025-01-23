import { DAGFlow } from "@tembell/dagflow-core";
import { assert } from "./utils";

export class DAGFlowStore {
  private dag: DAGFlow;
  private listeners: Set<() => void>;

  constructor(initialDag: DAGFlow) {
    this.dag = initialDag;
    this.listeners = new Set();
  }

  public getSnapshot = () => {
    return this.dag;
  };

  public getServerSnapshot = () => {
    return this.dag;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    // Return an unsubscribe function:
    return () => {
      this.listeners.delete(listener);
    };
  };

  // Expose some DAG methods
  public resolveById = (from: string, to: string) => {
    const fromNode = this.dag.find(n => n.id === from);
    if (!fromNode) {
      throw new Error(`resolve with from (${from}) to (${to}) failed. '${from}' does not exist`);
    }
    fromNode.resolve(to);
    this.notify();
  }

  public resolveByIndex = (from: string, to: number) => {
    const fromNode = this.dag.find(n => n.id === from);
    if (!fromNode) {
      throw new Error(`resolve with from (${from}) to (${to}) failed. '${from}' does not exist`);
    }
    if (!fromNode.children[to]) {
      throw new Error(`resolve with from (${from}) to (${to}) failed. '${to}' does not exist`);
    }
    fromNode.resolve(fromNode.children[to].id);
    this.notify();
  }

  public reset = (id: string) => {
    const node = this.dag.find(n => n.id === id);
    assert(Boolean(node), `DAGFlowStore::reset -- 'id' ${id} must exist in graph.`);

    // Optimization
    if (node!.status === "yellow") return;

    node!.reset();
    this.notify();
  }

  // --- INTERNALS

  private notify() {
    // React must have a new reference
    this.dag = this.dag.clone();
    for (const listener of Array.from(this.listeners)) {
      listener();
    }
  }
}
