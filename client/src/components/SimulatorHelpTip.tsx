import React, { useState, useEffect } from 'react';
import { X, MapPin, Play, ShieldAlert, ChevronRight } from 'lucide-react';

export const EVACU3D_HELP_SEEN_KEY = 'evacu3d_help_seen';

const steps = [
  {
    icon: <MapPin size={18} className="text-blue-400" />,
    title: 'Select Your Location',
    desc: 'Tap any room button in the control panel to mark where you currently are in the building.',
  },
  {
    icon: <Play size={18} className="text-emerald-400" />,
    title: 'Find the Safest Path',
    desc: 'Press "Find Safest Path" to instantly compute the best evacuation route using real-time hazard data.',
  },
  {
    icon: <ShieldAlert size={18} className="text-alertRed" />,
    title: 'Follow the Glowing Route',
    desc: 'The animated yellow path in the 3D view shows your safest route to an exit or refuge area.',
  },
];

interface SimulatorHelpTipProps {
  /** Called when the panel is dismissed (so parent can reposition sibling UI) */
  onDismiss?: () => void;
}

const SimulatorHelpTip: React.FC<SimulatorHelpTipProps> = ({ onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show if user hasn't seen it before
    const seen = localStorage.getItem(EVACU3D_HELP_SEEN_KEY);
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(EVACU3D_HELP_SEEN_KEY, '1');
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  const isLast = step === steps.length - 1;

  return (
    <div
      role="complementary"
      aria-label="Simulator quick-start guide"
      className="absolute bottom-6 right-3 md:right-auto md:left-3 z-20 w-64 sm:w-72 bg-[#1a1d2e]/95 backdrop-blur-md border border-blue-800/50 rounded-2xl shadow-2xl shadow-blue-900/30 animate-fade-in-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-800">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Quick Start</span>
        <button
          onClick={dismiss}
          aria-label="Dismiss help tip"
          className="text-gray-500 hover:text-white transition p-0.5"
        >
          <X size={15} />
        </button>
      </div>

      {/* Step content */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-1.5 bg-gray-800 rounded-lg">{steps[step].icon}</div>
          <span className="text-sm font-semibold text-white">{steps[step].title}</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{steps[step].desc}</p>
      </div>

      {/* Step indicators + nav */}
      <div className="flex items-center justify-between px-4 pb-4">
        {/* Dots */}
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === step ? 'bg-blue-400 w-3' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {!isLast ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition"
            >
              Got it!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulatorHelpTip;
