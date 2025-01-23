// import { DAGFlow } from "@tembell/dagflow-core";
import { DAGFlow } from "../../../../packages/dagflow-core/src/index";
import questions from './data/powers_questions.json';

// Define our metadata types
export interface StaticMeta {
  type: "static";
  title: string;
}

export interface PowerOption {
  id: string;
  label: string;
  description: string;
  followUpQuestion?: string;
}

export interface PowerQuestion {
  id: string;
  title: string;
  description: string;
  options: PowerOption[];
}

export interface PowerSelectionMeta extends Omit<StaticMeta, "type">, Omit<PowerQuestion, "id"> {
  type: "question",
}

export type StepMeta = StaticMeta | PowerSelectionMeta;

// Build the flow graph
const flow = new DAGFlow({
  id: "welcome",
  meta: {
    type: "static",
    title: "Welcome, Future Hero!\nReady to design your perfect costume?"
  } satisfies StaticMeta
});


// Create nodes for all questions
const nodesMap = new Map<string, DAGFlow>();
questions.forEach(question => {
  const node = new DAGFlow({
    id: question.id,
    meta: {
      type: "question",
      title: question.title,
      description: question.description,
      options: question.options
    } satisfies PowerSelectionMeta
  });
  nodesMap.set(question.id, node);
});

// Connect nodes based on followUpQuestions
questions.forEach(question => {
  const currentNode = nodesMap.get(question.id)!;

  question.options.forEach((option: PowerOption) => {
    if (option.followUpQuestion) {
      const nextNode = nodesMap.get(option.followUpQuestion);
      if (nextNode) {
        currentNode.addOrLinkEdge(nextNode);
      }
    }
  });
});

// Add all heads to flow
nodesMap.forEach(node => {
  if (node.isHead()) {
    flow.addEdge(node);
  }
})

// Common final steps
const colorScheme = new DAGFlow({
  id: "color-scheme",
  meta: {
    type: "static",
    title: "Choose Your Colors\nPick a primary and secondary color"
  } satisfies StaticMeta
});
flow.funnelTo(colorScheme);

const measurements = colorScheme.addChild({
  id: "measurements",
  meta: {
    type: "static",
    title: "Perfect! Now let's get your measurements"
  } satisfies StaticMeta
});

const contactInfo = measurements.addChild({
  id: "contact-info",
  meta: {
    type: "static",
    title: "Almost there, Hero!\nHow can we contact you?"
  } satisfies StaticMeta
});


export { flow };
export type Step = typeof flow;
