import React from 'react';
import { AppContextProvider } from './context/AppContext';
import App from './App';
import ParticleBackground from './components/Helpers/ParticleBackground';
import GenericModal from './components/Modals/GenericModal';
import WelcomeModal from './components/Modals/WelcomeModal';
import { UIContextProvider } from './context/UIContext';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import { AppRootProvider } from './context/AppRootProvider';

const AppContent: React.FC = () => {
  // ---------------- State ----------------
  const [showWelcome, setShowWelcome] = React.useState<boolean>(true);
  const { theme } = useThemeContext();

  // ---------------- Functions ----------------

  // Handle welcome modal completion
  const handleWelcomeComplete = async () => {
    setShowWelcome(false);
  };

  // Theme-based particle configuration
  const getParticleConfig = () => {
    if (theme === 'dark') {
      return {
        particleColor: "rgba(147, 197, 253, 0.6)", // Light blue particles for dark theme
        backgroundColor: "rgb(17, 24, 39)" // Dark background
      };
    } else {
      return {
        particleColor: "rgba(59, 130, 246, 0.4)", // Darker blue particles for light theme
        backgroundColor: "rgb(214, 214, 214)" // Light background
      };
    }
  };

  const particleConfig = getParticleConfig();

  // ---------------- Render ----------------

  // Render welcome modal if showWelcome is true
  if (showWelcome) {
    return (
      <>
        <ParticleBackground
          zIndex={1}
          particleCount={100}
          particleColor={particleConfig.particleColor}
          backgroundColor={particleConfig.backgroundColor}
        />
        <GenericModal
          isOpen={true}
          transparent={true}
          onClose={handleWelcomeComplete}
          title="RVC VoiceChanger"
          primaryButton={{
            text: "Continue",
            onClick: handleWelcomeComplete
          }}
        >
          <WelcomeModal />
        </GenericModal>

      </>
    );
  }

  // Render app if showWelcome is false
  return (
    <>
      <AppContextProvider>
        <UIContextProvider>
          <App />
        </UIContextProvider>
      </AppContextProvider>
    </>
  );
};

// Wrapper around the AppContent with relevant context providers
export const AppWrapper: React.FC = () => {
  // ---------------- Render ----------------

  return (
    <ThemeProvider>
      <AppRootProvider>
        <AppContent />
      </AppRootProvider>
    </ThemeProvider>
  );
};