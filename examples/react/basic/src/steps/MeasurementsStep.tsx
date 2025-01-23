import { useState } from 'react';
import { HeroLayout } from '../components/HeroLayout';
import type { StaticMeta } from '../flow';

interface Props {
  step: {
    meta: StaticMeta;
  };
  onNext: () => void;
}

export default function MeasurementsStep({ step, onNext }: Props) {
  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    chest: '',
    waist: '',
  });

  const isComplete = Object.values(measurements).every(v => v !== '');

  return (
    <HeroLayout
      title={step.meta.title}
      onNext={onNext}
      canContinue={isComplete}
    >
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(measurements).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="text-white capitalize">{key}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setMeasurements(prev => ({
                ...prev,
                [key]: e.target.value
              }))}
              className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-purple-500 outline-none"
              placeholder={`Enter your ${key}`}
            />
          </div>
        ))}
      </div>
    </HeroLayout>
  );
} 