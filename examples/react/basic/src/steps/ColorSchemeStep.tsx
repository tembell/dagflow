import { useState } from 'react';
import { HeroLayout } from '../components/HeroLayout';
import { motion } from 'framer-motion';
import type { StaticMeta } from '../flow';

const COLORS = [
  { id: 'red', label: 'Red', class: 'bg-red-500' },
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'green', label: 'Green', class: 'bg-green-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { id: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { id: 'black', label: 'Black', class: 'bg-black' },
];

interface Props {
  step: {
    meta: StaticMeta;
  };
  onNext: () => void;
}

export default function ColorSchemeStep({ step, onNext }: Props) {
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);

  return (
    <HeroLayout
      title={step.meta.title}
      onNext={onNext}
      canContinue={Boolean(primaryColor && secondaryColor)}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-white mb-3">Primary Color</h3>
          <div className="grid grid-cols-3 gap-3">
            {COLORS.map((color) => (
              <motion.button
                key={color.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPrimaryColor(color.id)}
                className={`h-20 rounded-lg ${color.class} ${
                  primaryColor === color.id ? 'ring-4 ring-white' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white mb-3">Secondary Color</h3>
          <div className="grid grid-cols-3 gap-3">
            {COLORS.map((color) => (
              <motion.button
                key={color.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSecondaryColor(color.id)}
                className={`h-20 rounded-lg ${color.class} ${
                  secondaryColor === color.id ? 'ring-4 ring-white' : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </HeroLayout>
  );
} 