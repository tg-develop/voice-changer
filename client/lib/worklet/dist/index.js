/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./worklet/src/voice-changer-worklet-processor.ts":
/*!********************************************************!*\
  !*** ./worklet/src/voice-changer-worklet-processor.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   RequestType: () => (/* binding */ RequestType),\n/* harmony export */   ResponseType: () => (/* binding */ ResponseType)\n/* harmony export */ });\nconst RequestType = {\n    voice: \"voice\",\n    config: \"config\",\n    start: \"start\",\n    stop: \"stop\",\n    trancateBuffer: \"trancateBuffer\",\n};\nconst ResponseType = {\n    inputData: \"inputData\",\n    start_ok: \"start_ok\",\n    stop_ok: \"stop_ok\",\n};\nclass VoiceChangerWorkletProcessor extends AudioWorkletProcessor {\n    /**\n     * @constructor\n     */\n    constructor() {\n        super();\n        this.BLOCK_SIZE = 128;\n        this.initialized = false;\n        this.isRecording = false;\n        this.playBuffer = [];\n        this.trancateBuffer = (start, end) => {\n            console.log(`[worklet] Play buffer size ${this.playBuffer.length}. Truncating with offset ${start}`);\n            this.playBuffer = this.playBuffer.slice(start, end);\n        };\n        this.pushData = (inputData) => {\n            const volumeResponse = {\n                responseType: ResponseType.inputData,\n                inputData: inputData,\n            };\n            this.port.postMessage(volumeResponse, [inputData.buffer]);\n        };\n        console.log(\"[AudioWorkletProcessor] created.\");\n        this.initialized = true;\n        this.port.onmessage = this.handleMessage.bind(this);\n    }\n    handleMessage(event) {\n        const request = event.data;\n        if (request.requestType === \"config\") {\n            console.log(\"[worklet] worklet configured\", request);\n            return;\n        }\n        else if (request.requestType === \"start\") {\n            if (this.isRecording) {\n                console.warn(\"[worklet] recoring is already started\");\n                return;\n            }\n            this.isRecording = true;\n            const startResponse = {\n                responseType: \"start_ok\",\n            };\n            this.port.postMessage(startResponse);\n            return;\n        }\n        else if (request.requestType === \"stop\") {\n            if (!this.isRecording) {\n                console.warn(\"[worklet] recoring is not started\");\n                return;\n            }\n            this.isRecording = false;\n            const stopResponse = {\n                responseType: \"stop_ok\",\n            };\n            this.port.postMessage(stopResponse);\n            return;\n        }\n        else if (request.requestType === \"trancateBuffer\") {\n            this.trancateBuffer(0, 0);\n            return;\n        }\n        const f32Data = request.voice;\n        const chunkSize = Math.floor(f32Data.length / this.BLOCK_SIZE);\n        if (this.playBuffer.length > chunkSize) {\n            console.log(`[worklet] Truncate ${this.playBuffer.length} > ${chunkSize}`);\n            this.trancateBuffer(this.playBuffer.length - chunkSize);\n        }\n        for (let i = 0; i < chunkSize; i++) {\n            const block = f32Data.subarray(i * this.BLOCK_SIZE, (i + 1) * this.BLOCK_SIZE);\n            this.playBuffer.push(block);\n        }\n    }\n    process(_inputs, outputs, _parameters) {\n        if (!this.initialized) {\n            console.warn(\"[worklet] worklet_process not ready\");\n            return true;\n        }\n        if (this.isRecording) {\n            if (_inputs.length > 0 && _inputs[0].length > 0) {\n                this.pushData(_inputs[0][0]);\n            }\n        }\n        const voice = this.playBuffer.shift();\n        if (voice) {\n            outputs[0][0].set(voice);\n            if (outputs[0].length == 2) {\n                outputs[0][1].set(voice);\n            }\n        }\n        return true;\n    }\n}\nregisterProcessor(\"voice-changer-worklet-processor\", VoiceChangerWorkletProcessor);\n\n\n//# sourceURL=webpack://@dannadori/voice-changer-client-js/./worklet/src/voice-changer-worklet-processor.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./worklet/src/voice-changer-worklet-processor.ts"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;