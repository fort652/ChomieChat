import { Paper, Typography, Button, Box } from '@mui/material';
import { useTutorial } from '@/context/TutorialContext';
import React from 'react';

export default function TutorialTooltip({ step }) {
  const { nextStep, skipTutorial, tutorialSteps } = useTutorial();
  const isLastStep = step === tutorialSteps.length - 1;
  const currentStep = tutorialSteps[step];

  // Highlight the current target element
  const highlightTarget = () => {
    const element = document.querySelector(currentStep.target);
    if (element) {
      element.style.position = 'relative';
      element.style.zIndex = 10000;
      element.style.animation = 'pulse 1.5s infinite';
    }
    return () => {
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
        element.style.animation = '';
      }
    };
  };

  React.useEffect(() => {
    const cleanup = highlightTarget();
    return cleanup;
  }, [step]);

  return (
    <>
      {/* Semi-transparent overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999
        }}
      />

      {/* Centered Tutorial Box */}
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          p: 4,
          maxWidth: 450,
          boxShadow: theme => `0 0 40px ${theme.palette.background.paper}`,
          borderRadius: 3,
          backgroundColor: theme => 
            theme.palette.mode === 'dark' 
              ? theme.palette.grey[900] 
              : theme.palette.background.paper,
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main' 
          }}
        >
          {currentStep.title}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 3,
            fontSize: '1.1rem',
            color: 'text.primary'
          }}
        >
          {currentStep.content}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          mt: 3,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Button 
            size="large" 
            onClick={skipTutorial}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            Skip Tutorial
          </Button>
          <Button 
            size="large" 
            variant="contained" 
            onClick={nextStep}
            sx={{
              fontWeight: 'bold',
              px: 4
            }}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Paper>

      {/* Step indicator */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
          display: 'flex',
          gap: 1.5,
          p: 1,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          boxShadow: 2
        }}
      >
        {tutorialSteps.map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: index === step ? 'primary.main' : 'grey.400',
              transition: 'all 0.2s ease'
            }}
          />
        ))}
      </Box>
    </>
  );
} 