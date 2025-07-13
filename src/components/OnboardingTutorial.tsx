'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TUTORIAL_STEPS,
  hasUserSeenCharacterDetailsTutorial,
  markCharacterDetailsTutorialAsSeen,
} from '@/lib/tutorialUtils';

interface OnboardingTutorialProps {
  onClose: () => void;
  isEnabled: boolean; // Prop to control when the tutorial should be active (e.g., based on edit mode)
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onClose, isEnabled }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setIsVisible(false);
      return;
    }

    if (!hasUserSeenCharacterDetailsTutorial()) {
      setIsVisible(true);
      setCurrentStepIndex(0);
    } else {
      setIsVisible(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!isVisible) return;

    const currentStep = TUTORIAL_STEPS[currentStepIndex];
    if (!currentStep) return;

    const updateTargetRect = () => {
      const targetElement = document.querySelector(currentStep.targetSelector);
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect());
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updateTargetRect(); // Initial position
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    // Observe DOM changes to re-calculate position if target element moves or changes size
    const observer = new MutationObserver(updateTargetRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
      observer.disconnect();
    };
  }, [currentStepIndex, isVisible]);

  const handleNext = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSkip();
    }
  };

  const handleSkip = () => {
    markCharacterDetailsTutorialAsSeen();
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || !targetRect) {
    return null;
  }

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  if (!currentStep) {
    return null; // Should not happen if TUTORIAL_STEPS is properly defined and index is managed
  }

  // Calculate spotlight position and size for a rounded square
  const spotlightPadding = 10; // Padding around the target element
  const spotlightWidth = targetRect.width + spotlightPadding * 2;
  const spotlightHeight = targetRect.height + spotlightPadding * 2;
  const spotlightX = targetRect.left - spotlightPadding;
  const spotlightY = targetRect.top - spotlightPadding;

  // Calculate tooltip/message position
  let tooltipX = 0;
  let tooltipY = 0;
  let arrowRotation = 0; // in degrees for Tailwind transform-rotate

  const tooltipWidth = 300; // Approximate width for the tooltip
  const tooltipHeight = 120; // Approximate height for the tooltip

  switch (currentStep.position) {
    case 'top':
      tooltipX = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      tooltipY = targetRect.top - tooltipHeight - 30; // 30px offset for arrow
      arrowRotation = 180; // Arrow points down
      break;
    case 'bottom':
      tooltipX = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      tooltipY = targetRect.bottom + 30;
      arrowRotation = 0; // Arrow points up
      break;
    case 'left':
      tooltipX = targetRect.left - tooltipWidth - 30;
      tooltipY = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      arrowRotation = 90; // Arrow points right
      break;
    case 'right':
      tooltipX = targetRect.right + 30;
      tooltipY = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      arrowRotation = -90; // Arrow points left
      break;
  }

  // Ensure tooltip stays within viewport
  tooltipX = Math.max(0, Math.min(tooltipX, window.innerWidth - tooltipWidth));
  tooltipY = Math.max(0, Math.min(tooltipY, window.innerHeight - tooltipHeight));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 bg-black/25 flex items-center justify-center'
        >
          {/* Spotlight Circle */}
          <motion.div
            key={currentStep.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className='absolute rounded-lg border-4 border-blue-400 pointer-events-none'
            style={{
              width: spotlightWidth,
              height: spotlightHeight,
              left: spotlightX,
              top: spotlightY,
            }}
          />

          {/* Tutorial Message Box */}
          <motion.div
            key={`tooltip-${currentStep.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            className='absolute bg-white text-gray-800 p-4 rounded-lg shadow-lg max-w-xs'
            style={{
              left: tooltipX,
              top: tooltipY,
              width: tooltipWidth,
            }}
          >
            <p className='text-sm mb-2'>{currentStep.message}</p>
            <div className='flex justify-end space-x-2'>
              <button
                onClick={handleSkip}
                className='px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300'
              >
                跳过
              </button>
              <button
                onClick={handleNext}
                className='px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600'
              >
                {currentStepIndex === TUTORIAL_STEPS.length - 1 ? '完成' : '下一步'}
              </button>
            </div>
            {/* Arrow */}
            <motion.div
              className='absolute w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-white'
              style={{
                left: targetRect.left + targetRect.width / 2 - tooltipX - 10, // Center arrow relative to target
                top: currentStep.position === 'bottom' ? -10 : 'auto',
                bottom: currentStep.position === 'top' ? -10 : 'auto',
                transform: `rotate(${arrowRotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTutorial;
