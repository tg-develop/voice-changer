import { AudioEffect, AudioChannel, AudioEffectsSchema } from '@dannadori/voice-changer-client-js';

/**
 * Create an effect using server-provided schema
 */
export function createEffectFromServerSchema(
  effectType: string, 
  channel: AudioChannel, 
  serverSchema?: AudioEffectsSchema
): AudioEffect {
  if (!serverSchema || !serverSchema[effectType]) {
    throw new Error(`Effect type '${effectType}' not found in server schema`);
  }

  const definition = serverSchema[effectType];
  const parameters: Record<string, number | boolean | string> = {};
  
  // Extract default values from server schema parameters
  Object.entries(definition.parameters || {}).forEach(([key, paramDef]) => {
    parameters[key] = paramDef.defaultValue;
  });

  return {
    type: effectType,
    channel,
    enabled: true,
    parameters
  };
}

/**
 * Get available effect types using server-provided schema
 */
export function getAvailableEffectTypesFromServer(
  serverSchema?: AudioEffectsSchema
): Array<{type: string, name: string, description: string, provider?: string}> {
  if (!serverSchema || Object.keys(serverSchema).length === 0) {
    return [];
  }

  return Object.entries(serverSchema).map(([type, definition]) => ({
    type,
    name: definition.name,
    description: definition.description,
    provider: definition.provider
  }));
}

/**
 * Get effect definition for a specific type from server schema
 */
export function getEffectDefinition(
  effectType: string,
  serverSchema?: AudioEffectsSchema
) {
  if (!serverSchema || !serverSchema[effectType]) {
    return undefined;
  }
  
  return serverSchema[effectType];
}

/**
 * Check if an effect type is available in server schema
 */
export function isEffectTypeAvailable(
  effectType: string,
  serverSchema?: AudioEffectsSchema
): boolean {
  return !!(serverSchema && serverSchema[effectType]);
}