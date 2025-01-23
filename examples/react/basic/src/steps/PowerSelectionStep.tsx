import { useState } from 'react';
import { HeroLayout } from '../components/HeroLayout';
import { motion } from 'framer-motion';
import type { PowerSelectionMeta } from '../flow';

interface Props {
  step: {
    meta: PowerSelectionMeta;
  };
  onNext: (nextQuestionId?: string) => void;
}

export default function PowerSelectionStep({ step, onNext }: Props) {
  const options = step.meta.options;
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <HeroLayout
      title={step.meta.title}
      onNext={() => selected && onNext(step.meta.options.find(option => option.id === selected)?.followUpQuestion)}
      canContinue={Boolean(selected)}
    >
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(option.id)}
            className={`p-4 rounded-lg border-2 transition-colors duration-200
                      ${selected === option.id
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-white/20 hover:border-white/40'}`}
          >
            <span className="text-white font-medium">{option.label}</span>
          </motion.button>
        ))}
      </div>
    </HeroLayout>
  );
}
