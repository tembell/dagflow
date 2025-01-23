import { useState } from 'react';
import { HeroLayout } from '../components/HeroLayout';
import type { StaticMeta } from '../flow';

interface Props {
  step: {
    meta: StaticMeta;
  };
  onSubmit: () => void;
}

export default function ContactInfoStep({ step, onSubmit }: Props) {
  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const isComplete = Object.values(contact).every(v => v !== '');

  return (
    <HeroLayout
      title={step.meta.title}
      onNext={onSubmit}
      canContinue={isComplete}
      nextLabel="Submit Order"
    >
      <div className="space-y-4">
        {Object.entries(contact).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="text-white capitalize">{key}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setContact(prev => ({
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