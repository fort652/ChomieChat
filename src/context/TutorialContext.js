import { createContext, useContext, useState, useEffect } from 'react';

const TutorialContext = createContext();

export function TutorialProvider({ children }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  return (
    <TutorialContext.Provider value={{
      showTutorial,
      currentStep,
      nextStep,
      skipTutorial,
      tutorialSteps
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const tutorialSteps = [
  {
    target: '#theme-toggle',
    title: 'Theme Toggle',
    content: 'Switch between light, dark, or system theme preferences',
    placement: 'bottom'
  },
  {
    target: '#user-avatar',
    title: 'User Menu',
    content: 'Access your profile, settings, and logout options',
    placement: 'bottom'
  },
  {
    target: '#message-input',
    title: 'Send Messages',
    content: 'Type your messages here and press Enter or click the send button',
    placement: 'top'
  }
]; 