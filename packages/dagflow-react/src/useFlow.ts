import { useMemo, useSyncExternalStore } from "react";
import { DAGFlow } from "@tembell/dagflow-core";
import { DAGFlowStore } from "./store";

/**
 * use outside of react life cycle
 */
export function createUseDAGFlow(graph: DAGFlow) {
  const store = new DAGFlowStore(graph);

  return function useDAGFlow(params?: Partial<UseDAGFlowParams>) {
    const dag = useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot
    );
    const steps = dag.getChain();

    useMemo(() => {
      if (params?.initialValues) {
        Object.entries(params.initialValues).forEach(([parentId, childId]) => {
          if (typeof childId === "number") {
            store.resolveByIndex(parentId, childId);
          } else if (typeof childId === "string") {
            store.resolveById(parentId, childId);
          }
        });
      }
    }, []);

    return {
      // DATA
      /**
       * return the chain of 'green' nodes
       * and the following 'yellow' node
       */
      steps,

      // ACIONS
      // Expose here the Reactified API of the TrafficDAG
      /** used to mark a node 'green' */
      resolveById: store.resolveById,
      resolveByIndex: store.resolveByIndex,
      reset: store.reset,

      // INTERNALS
      /**
       * the 'dag' is the whole internal Data Structure, use it only if you know what you are doing 
       */
      dag,
    }
  }
}

export type UseDAGFlowParams = {
  /**
   * record of nodeId to nodeId (children)
   * to be resolved by default
   *
   * if value is a number, will resolve to the Nth children
   * if value is a true, will resolve to the 1st child
   * if value is a false or undefined, will do nothing
   */
  initialValues: Record<DAGFlow['id'], DAGFlow['id'] | number | boolean | undefined>;
}
