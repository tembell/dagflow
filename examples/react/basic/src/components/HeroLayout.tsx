import { motion } from 'framer-motion';

interface HeroLayoutProps {
  title: string | string[];
  children: React.ReactNode;
  onNext: () => void;
  nextLabel?: string;
  canContinue?: boolean;
}

export function HeroLayout({
  title,
  children,
  onNext,
  nextLabel = "Next",
  canContinue = true
}: HeroLayoutProps) {
  const titleLines = Array.isArray(title) ? title : title.split('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full mx-auto bg-white/10 backdrop-blur-lg rounded-lg p-8"
    >
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-3xl font-bold text-white text-center">
          {titleLines.map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h2>

        <div className="w-full">
          {children}
        </div>

        <button
          onClick={onNext}
          disabled={!canContinue}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500
                   text-white rounded-full font-medium shadow-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:from-purple-600 hover:to-indigo-600
                   transition-all duration-200"
        >
          {nextLabel}
        </button>
      </div>
    </motion.div>
  );
}
