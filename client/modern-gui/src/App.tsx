import LeftSidebar from './components/LeftSideBar/Sidebar';
import BottomBar from './components/BottomBar/BottomBar';
import { JSX, useState, useEffect, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import GenericModal from './components/Modals/GenericModal';
import { PassthroughConfirmModalProps } from './components/BottomBar/Modals/PassthroughConfirmModal';
import { RVCModelSlot } from '@dannadori/voice-changer-client-js';
import MainContent from './components/MainContent';
import { useAppState } from './context/AppContext';
import { useUIContext } from './context/UIContext';

const MD_BREAKPOINT = 768; // Typical Tailwind md breakpoint

// Define a more flexible type for modalProps passed to openModal
interface ModelRelatedProps {
  modelId?: string;
  modelName?: string;
  model?: RVCModelSlot;
}

// Combine with PassthroughConfirmModalProps (excluding closeModal as it's added by App.tsx)
type OpenModalProps = ModelRelatedProps | (Omit<PassthroughConfirmModalProps, 'closeModal'> & { typeSpecificProp?: any });

interface CurrentModalState {
  content: ReactNode | null;
  title: string;
  props?: OpenModalProps;
  primaryButton?: { text: string; onClick: () => void; className?: string };
  secondaryButton?: { text: string; onClick: () => void; className?: string };
  transparent?: boolean;
}

function App(): JSX.Element {
  // ---------------- State ----------------
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= MD_BREAKPOINT);
  const [currentModal, setCurrentModal] = useState<CurrentModalState | null>(null);

  const appState = useAppState();
  const { showError } = useUIContext();

  // ---------------- Hooks ----------------

  // Handle window resize for sidebar
  useEffect(() => {
    const breakpointHandleResize = () => {
      const currentIsDesktop = window.innerWidth >= MD_BREAKPOINT;
      setIsSidebarOpen(currentIsDesktop);
    };

    window.addEventListener('resize', breakpointHandleResize);
    breakpointHandleResize();

    return () => window.removeEventListener('resize', breakpointHandleResize);
  }, []);

  // Monitor error messages from appState
  useEffect(() => {
    if (appState.errorMessage && appState.errorMessage !== '') {
      showError(appState.errorMessage, 'Error');
      appState.resetErrorMessage();
    }
  }, [appState.errorMessage, showError, appState]);

  // ---------------- Functions ----------------

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle modal close
  const closeModal = () => {
    setCurrentModal(null);
  };

  // ---------------- Render ----------------

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 text-gray-600 dark:text-gray-300 fixed top-3 left-3 z-30 bg-gray-200 dark:bg-gray-700 rounded-md shadow"
        aria-label="Toggle sidebar"
      >
        <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} size="lg" />
      </button>

      <div className={`flex flex-grow overflow-hidden ${!isSidebarOpen && window.innerWidth < MD_BREAKPOINT ? 'pt-0' : 'pt-12'} md:pt-0`}>
        <LeftSidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <main className="flex-grow p-4 overflow-y-auto">
          <MainContent />
        </main>
      </div>
      <BottomBar />

      {currentModal && currentModal.content &&
        <GenericModal
          isOpen={!!currentModal}
          onClose={closeModal}
          title={currentModal.title}
          primaryButton={currentModal.primaryButton}
          secondaryButton={currentModal.secondaryButton}
        >
          {currentModal.content}
        </GenericModal>
      }
    </div>
  );
}

export default App; 