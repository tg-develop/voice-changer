# Voice Changer - Modern GUI Client

> [!IMPORTANT]
> **Required Base Application**: This modern GUI client requires the [Voice Changer by deiteris](https://github.com/deiteris/voice-changer) as the backend foundation. Please install and set up the base Voice Changer application first before using this modern GUI client.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Releases](#releases)
- [Installation](#installation)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setting up the development environment](#setting-up-the-development-environment)
  - [Available scripts](#available-scripts)
  - [Building for production](#building-for-production)
- [Project structure](#project-structure)
- [Technologies used](#technologies-used)
- [Known issues](#known-issues)

## Overview

This is a modern, redesigned web client for the Voice Changer application that replaces the original client interface with a contemporary, user-friendly design. The modern GUI provides the same functionality as the original client while offering improved user experience, better accessibility, and enhanced visual design.

> [!IMPORTANT]
> This is a client-side patch that only replaces the frontend interface. The backend server and middleware remain completely unchanged and compatible with the existing Voice Changer ecosystem.

## Features

- **Modern Design**: Clean, intuitive interface built with modern web technologies
- **Responsive Layout**: Optimized for different screen sizes and devices
- **Real-time Controls**: Live audio controls with visual feedback
- **Model Management**: Easy model slot management with drag-and-drop support
- **Performance Monitoring**: Real-time performance statistics and audio visualizations
- **Dark/Light Theme**: Switchable theme support for user preference
- **Modal System**: Organized modal dialogs for settings and advanced features
- **Accessibility**: Improved keyboard navigation and screen reader support

## Releases

Download the latest compiled release from the [GitHub Releases page](https://github.com/tg-develop/RVC-Modern-GUI/releases/tag/release) to get pre-built files ready for installation.

## Installation

> [!WARNING]
> **Prerequisites**: Before installing this modern GUI client, ensure you have the [Voice Changer by deiteris](https://github.com/deiteris/voice-changer) installed and working properly. This GUI client is a frontend replacement and requires the Voice Changer backend to function.

To use the modern GUI client as a replacement for the original interface:

1. **Download the latest release:**
   
   Download the compiled release from the [GitHub Releases page](https://github.com/tg-develop/RVC-Modern-GUI/releases/tag/release) and extract the files.

2. **Replace the original client files:**
   
   Navigate to your Voice Changer installation directory and backup the original client:
   ```bash
   # Backup original client (optional)
   mv client/demo/dist client/demo/dist_backup
   
   # Copy modern GUI files to replace original client
   cp -r path/to/extracted/dist client/demo/dist
   ```

3. **Start the Voice Changer server as usual:**
   
   The modern GUI will now be served instead of the original client when you access the Voice Changer web interface.

> [!IMPORTANT]
> The modern GUI client is designed to work with the existing Voice Changer backend. No server-side changes are required.

## Development

### Prerequisites

- **[Voice Changer by deiteris](https://github.com/deiteris/voice-changer)** - Base application (required)
- [Node.js](https://nodejs.org/) (v16.0.0 or later)
- [npm](https://www.npmjs.com/) (v8.0.0 or later)
- A code editor (VS Code recommended)
- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

> [!NOTE]
> For development, you need the [Voice Changer backend server](https://github.com/deiteris/voice-changer) running.

### Setting up the development environment

1. Navigate to the modern-gui directory:
   ```bash
   cd client/modern-gui
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. Compile the middleware (lib directory) in the client directory and copy dependencies into node_modules directory.

   ```bash
   # For Linux distributions use the `npm run build:mod` script instead 
   npm run build:mod_dos
   ```

4. Configure the Voice Changer server to serve the modern GUI:
   
   In your Voice Changer server's `const.py` file, update the `FRONTEND_DIR` path to point to the modern-gui dist directory:
   ```python
   FRONTEND_DIR = "client/modern-gui/dist"
   ```

5. Build the development version:
   ```bash
   npm run build:dev
   ```

6. Start the Voice Changer server as usual

The modern GUI will now be served through the Voice Changer's web server. Rebuild with `npm run build:dev` whenever you make changes to see them reflected.

> [!IMPORTANT]
> The Voice Changer backend server must be running and configured to serve from the modern-gui dist directory.

### Available scripts

**Development:**
- `npm run start` - Starts the Webpack development server with hot reloading. There is no connection to the backend server because of different ports. In this scenario you need to configure CORS server-side and use the React-Proxy.

**Build Scripts:**
- `npm run clean` - Removes the dist directory
- `npm run webpack:prod` - **Webpack only** - Runs Webpack with production configuration (no cleanup)
- `npm run webpack:dev` - **Webpack only** - Runs Webpack with development configuration (no cleanup)
- `npm run build:prod` - **Complete production build** - Cleans dist directory + runs webpack:prod
- `npm run build:dev` - **Complete development build** - Cleans dist directory + runs webpack:dev

**Library Modifications:**
- `npm run build:mod` - Builds and copies middleware library modifications (lib directory)
- `npm run build:mod_dos` - Windows version of build:mod
- `npm run build:mod_copy` - Copies library modifications to node_modules (Windows only)

### Building for production

To create a production build:

```bash
npm run build:prod
```

This will create a `dist` folder with optimized static files ready for deployment.

## Project structure

```
src/
├── components/                    # Reusable UI components
│   ├── AiSettings/               # AI and voice conversion settings
│   ├── AudioSettings/            # Audio device and configuration components
│   ├── BottomBar/                # Bottom navigation and control bar
│   │   └── Modals/               # Bottom bar modal dialogs
│   │       └── Merge/            # Model merging functionality
│   ├── Helpers/                  # Utility components (sliders, drag handlers, etc.)
│   ├── LeftSideBar/              # Sidebar navigation and model management
│   │   └── Modals/               # Sidebar modal dialogs
│   ├── MainContent.tsx           # Central content area
│   ├── Modals/                   # Global modal dialogs and overlays
│   ├── ModelSettings/            # Model configuration and settings
│   └── PerformanceStats/         # Performance monitoring and statistics
├── context/                      # React context providers
│   ├── AppContext.tsx            # Main application state
│   ├── AppRootProvider.tsx       # Root context provider
│   ├── ThemeContext.tsx          # Theme management
│   └── UIContext.tsx             # UI state and device management
├── scripts/                      # Custom hooks and utilities
│   ├── useAppGuiSetting.ts       # GUI settings management hook
│   ├── useAudioConfig.ts         # Audio configuration hook
│   ├── usePlaceholder.ts         # Placeholder utilities
│   └── useVCClient.ts            # Voice changer client integration
├── styles/                       # Global styles and theme constants
│   └── constants.ts              # Style constants and theme definitions
├── App.tsx                       # Main application component
└── AppWrapper.tsx                # Application wrapper with providers
```

## Technologies used

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Webpack 5** - Module bundler with optimized builds
- **FontAwesome** - Icon library for consistent iconography
- **Voice Changer Client JS** - Integration with the backend API

## Known issues

- **Browser Compatibility**: Some features may not work in older browsers (IE11 not supported)
- **Mobile Support**: Touch interfaces are functional but not fully optimized
- **Screen Readers**: Some complex UI elements may need improved accessibility labels

> [!TIP]
> For backend-related issues or Voice Changer functionality problems, refer to the main project documentation.

---

> [!NOTE]
> This modern GUI client is designed to be a drop-in replacement for the original interface. All Voice Changer functionality, including model loading, voice conversion, and audio processing, remains handled by the backend server.