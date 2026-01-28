/**
 * @fileoverview Vite environment type declarations
 *
 * Declares types for Vite-specific import patterns.
 *
 * @module @cardplay/vite-env
 */

/// <reference types="vite/client" />

// Support for importing .pl files as raw strings
declare module '*.pl?raw' {
  const content: string;
  export default content;
}
