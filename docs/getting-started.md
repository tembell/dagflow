# Getting Started with DAGFlow

DAGFlow is a React library for managing complex UI flows using Directed Acyclic Graphs (DAGs).

## Installation

```bash
npm install @tembell/dagflow-react
# or
pnpm add @tembell/dagflow-react
# or
yarn add @tembell/dagflow-react
```

## Basic Usage

```tsx
import { DAGProvider, useDAG } from '@tembell/dagflow-react';

function App() {
  return (
    <DAGProvider>
      <WorkflowComponent />
    </DAGProvider>
  );
}
``` 