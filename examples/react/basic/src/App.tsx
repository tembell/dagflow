// import { createUseDAGFlow } from '@tembell/dagflow-react';
import { createUseDAGFlow } from '../../../../packages/dagflow-react/src/index';

import { flow } from './flow';
import WelcomeStep from './steps/WelcomeStep';
import PowerSelectionStep from './steps/PowerSelectionStep';
import ColorSchemeStep from './steps/ColorSchemeStep';
import MeasurementsStep from './steps/MeasurementsStep';
import ContactInfoStep from './steps/ContactInfoStep';
import React from 'react';

// Create the hook
export const useHeroFlow = createUseDAGFlow(flow);

export default function App() {
  const { steps, resolveById, resolveByIndex } = useHeroFlow();

  const getStepComponent = (step: typeof steps[number]) => {
    switch (step.id) {
      case "welcome":
        return <WelcomeStep step={step} onNext={() => resolveByIndex(step.id, 0)} />;
      case "color-scheme":
        return <ColorSchemeStep step={step} onNext={() => resolveByIndex(step.id, 0)} />;
      case "measurements":
        return <MeasurementsStep step={step} onNext={() => resolveByIndex(step.id, 0)} />;
      case "contact-info":
        return <ContactInfoStep step={step} onSubmit={() => console.log("Submit!")} />;
      default: {
        if (step.meta.type === "question") {
          return <PowerSelectionStep step={step} onNext={(answerId) => answerId ? resolveById(step.id, answerId) : resolveByIndex(step.id, 0)} />;
        }
        return null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
      <div className="flex flex-col gap-4 container mx-auto px-4 py-8">
        {steps.map((step) =>
          <React.Fragment key={step.id}>
            {getStepComponent(step)}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
