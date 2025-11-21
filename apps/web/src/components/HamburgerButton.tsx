'use client';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white lg:text-fridge-primary lg:hover:bg-fridge-light"
      aria-label="Toggle menu"
    >
      <div className="w-6 h-6 flex flex-col justify-center space-y-1.5">
        <span
          className={`block h-0.5 w-6 bg-white lg:bg-fridge-primary transition-all ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-white lg:bg-fridge-primary transition-all ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-white lg:bg-fridge-primary transition-all ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </div>
    </button>
  );
}

