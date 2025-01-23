import { HeroLayout } from '../components/HeroLayout';
import type { StaticMeta } from '../flow';

interface Props {
  step: {
    meta: StaticMeta;
  };
  onNext: () => void;
}

export default function WelcomeStep({ step, onNext }: Props) {
  return (
    <HeroLayout
      title={step.meta.title}
      onNext={onNext}
    >
      <p className="text-white/80 text-center text-lg">
        Let's create your perfect superhero costume together!
      </p>
    </HeroLayout>
  );
}
