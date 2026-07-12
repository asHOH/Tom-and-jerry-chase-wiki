'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { createPortal } from 'react-dom';

import {
  hasUserSeenTutorial,
  markTutorialAsSeen,
  TUTORIAL_STEPS,
  type TutorialType,
} from '@/lib/tutorialUtils';

type OnboardingTutorialProps = {
  tutorial: TutorialType;
  onClose?: () => void;
  isEnabled: boolean;
};

export default function OnboardingTutorial({
  tutorial,
  onClose,
  isEnabled,
}: OnboardingTutorialProps) {
  const steps = TUTORIAL_STEPS[tutorial];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isEnabled && !hasUserSeenTutorial(tutorial)) {
      setCurrentStepIndex(0);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isEnabled, tutorial]);

  useEffect(() => {
    if (!isVisible) return;

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const updateTargetRect = () => {
      const targetElement = document.querySelector(currentStep.targetSelector);
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect());
        targetElement.scrollIntoView?.({ behavior: 'instant', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);
    const observer = new MutationObserver(updateTargetRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
      observer.disconnect();
    };
  }, [currentStepIndex, isVisible, steps]);

  const closeTutorial = () => {
    markTutorialAsSeen(tutorial);
    setIsVisible(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((previous) => previous + 1);
    } else {
      closeTutorial();
    }
  };

  if (!isVisible) return null;

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  const spotlightPadding = 10;
  const tooltipWidth = 300;
  const tooltipHeight = 120;
  const spotlightWidth = targetRect ? targetRect.width + spotlightPadding * 2 : 0;
  const spotlightHeight = targetRect ? targetRect.height + spotlightPadding * 2 : 0;
  const spotlightX = targetRect ? targetRect.left - spotlightPadding : 0;
  const spotlightY = targetRect ? targetRect.top - spotlightPadding : 0;
  let tooltipX = (window.innerWidth - tooltipWidth) / 2;
  let tooltipY = (window.innerHeight - tooltipHeight) / 2;
  let arrowRotation = 0;

  if (targetRect) {
    switch (currentStep.position) {
      case 'top':
        tooltipX = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        tooltipY = targetRect.top - tooltipHeight - 30;
        arrowRotation = 180;
        break;
      case 'bottom':
        tooltipX = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        tooltipY = targetRect.bottom + 30;
        break;
      case 'left':
        tooltipX = targetRect.left - tooltipWidth - 30;
        tooltipY = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        arrowRotation = 90;
        break;
      case 'right':
        tooltipX = targetRect.right + 30;
        tooltipY = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        arrowRotation = -90;
        break;
    }
  }

  tooltipX = Math.max(0, Math.min(tooltipX, window.innerWidth - tooltipWidth));
  tooltipY = Math.max(0, Math.min(tooltipY, window.innerHeight - tooltipHeight));

  return createPortal(
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-99999 flex items-center justify-center bg-black/25'
      >
        {targetRect && (
          <m.div
            key={currentStep.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className='pointer-events-none absolute rounded-lg border-4 border-blue-400'
            style={{
              width: spotlightWidth,
              height: spotlightHeight,
              left: spotlightX,
              top: spotlightY,
            }}
          />
        )}
        <m.div
          key={`tooltip-${currentStep.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          className='absolute max-w-xs rounded-lg bg-white p-4 text-gray-800 shadow-lg'
          style={{ left: tooltipX, top: tooltipY, width: tooltipWidth }}
        >
          <p className='mb-2 text-sm'>{currentStep.message}</p>
          <div className='flex justify-end space-x-2'>
            <button
              onClick={closeTutorial}
              className='rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300'
            >
              跳过
            </button>
            <button
              onClick={handleNext}
              className='rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600'
            >
              {currentStepIndex === steps.length - 1 ? '完成' : '下一步'}
            </button>
          </div>
          {targetRect && (
            <m.div
              className='absolute h-0 w-0 border-r-10 border-b-10 border-l-10 border-r-transparent border-b-white border-l-transparent'
              style={{
                left: targetRect.left + targetRect.width / 2 - tooltipX - 10,
                top: currentStep.position === 'bottom' ? -10 : 'auto',
                bottom: currentStep.position === 'top' ? -10 : 'auto',
                transform: `rotate(${arrowRotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          )}
        </m.div>
      </m.div>
    </AnimatePresence>,
    document.body
  );
}
