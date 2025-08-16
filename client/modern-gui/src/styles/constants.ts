export const CSS_CLASSES = {
    // Form Controls
    select: "w-full p-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 text-sm transition-colors duration-150",
    input: "w-full p-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 text-sm",
    fileInput: `w-full p-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-gray-600 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-gray-500`,
    range: "w-full h-2 bg-slate-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 dark:accent-blue-400 transition-colors duration-150",
    rangeDisabled: "w-full h-2 bg-slate-100 dark:bg-gray-700 rounded-lg appearance-none cursor-not-allowed accent-slate-300 dark:accent-gray-500 opacity-50 transition-colors duration-150",
    checkbox: "mr-2 accent-blue-500 dark:accent-blue-400",
    radioButton: "mr-2 accent-blue-500 dark:accent-blue-400",

    // Typography
    label: "block text-sm font-medium text-slate-600 dark:text-gray-400 mt-1 mb-1",
    heading: "text-lg font-semibold text-slate-700 dark:text-gray-200",
    sliderValue: "text-xs text-slate-600 dark:text-gray-400 text-right",
    checkboxLabel: "flex items-center text-sm text-slate-700 dark:text-gray-300",
    radioLabel: "inline-flex items-center mr-4 text-sm text-slate-700 dark:text-gray-300",

    // Buttons
    iconButton: "p-1 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150",
    primaryButton: "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-150",
    modalPrimaryButton: "px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-150",
    modalSecondaryButton: "px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 focus:ring-slate-400",

    // Layout
    card: "p-4 border border-slate-200 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 transition-all duration-300",
    cardHeader: "flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-gray-700",

    // States
    error: "p-2 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded",
    success: "p-2 mb-4 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded",
    warning: "p-2 mb-4 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 rounded",
    loading: "text-blue-500 animate-spin"
};

export const AUDIO_KEYS = {
    AUDIO_ELEMENT_FOR_PLAY_RESULT: "audio-result",
    AUDIO_ELEMENT_FOR_PLAY_MONITOR: "audio-monitor",
    AUDIO_ELEMENT_FOR_TEST_ORIGINAL: "audio-test-original",
    AUDIO_ELEMENT_FOR_TEST_CONVERTED: "audio-test-converted",
    AUDIO_ELEMENT_FOR_TEST_CONVERTED_ECHOBACK: "audio-test-converted-echoback",
    AUDIO_ELEMENT_FOR_SAMPLING_INPUT: "body-wav-container-wav-input",
    AUDIO_ELEMENT_FOR_SAMPLING_OUTPUT: "body-wav-container-wav-output",
};

export const INDEXEDDB_KEYS = {
    INDEXEDDB_KEY_AUDIO_INPUT: "INDEXEDDB_KEY_AUDIO_INPUT",
    INDEXEDDB_KEY_AUDIO_OUTPUT: "INDEXEDDB_KEY_AUDIO_OUTPUT",
    INDEXEDDB_KEY_AUDIO_MONITOR: "INDEXEDDB_KEY_AUDIO_MONITOR",
    INDEXEDDB_KEY_DEFAULT_MODEL_TYPE: "INDEXEDDB_KEY_DEFALT_MODEL_TYPE",
    INDEXEDDB_KEY_NOISE1: "INDEXEDDB_KEY_NOISE1",
    INDEXEDDB_KEY_NOISE2: "INDEXEDDB_KEY_NOISE2",
    INDEXEDDB_KEY_ECHO: "INDEXEDDB_KEY_ECHO",
};

export const isDesktopApp = () => {
    if (navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    } else {
        return false;
    }
};