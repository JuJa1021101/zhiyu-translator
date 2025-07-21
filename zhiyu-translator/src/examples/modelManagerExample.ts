/**
 * Example usage of the ModelManager class
 * 
 * This file demonstrates how to use the ModelManager singleton
 * for managing Transformers.js model pipelines.
 */

import { ModelManager } from '../services/ModelManager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Example function demonstrating how to use ModelManager
 */
async function translateWithModelManager(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  // Get the ModelManager instance
  const modelManager = ModelManager.getInstance();

  // Generate a unique request ID
  const requestId = uuidv4();

  console.log(`Starting translation from ${sourceLanguage} to ${targetLanguage}`);

  try {
    // Define a progress callback
    const progressCallback = (progress: number, message: string) => {
      console.log(`Progress: ${progress.toFixed(1)}% - ${message}`);
    };

    // Get the translation pipeline with progress tracking
    const translator = await modelManager.getPipeline(
      'translation',
      `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`,
      requestId,
      { progressCallback }
    );

    console.log('Model loaded successfully');

    // Perform the translation
    const startTime = performance.now();
    const result = await translator(text);
    const endTime = performance.now();

    console.log(`Translation completed in ${(endTime - startTime).toFixed(2)}ms`);

    return result[0].translation_text;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Example function demonstrating how to configure ModelManager
 */
function configureModelManager(): void {
  const modelManager = ModelManager.getInstance();

  // Get current configuration
  const currentConfig = modelManager.getConfig();
  console.log('Current configuration:', currentConfig);

  // Update configuration
  modelManager.setConfig({
    cacheModels: true,
    quantized: true,
    maxCacheSize: 3
  });

  console.log('Updated configuration:', modelManager.getConfig());
}

/**
 * Example function demonstrating how to manage the model cache
 */
function manageModelCache(): void {
  const modelManager = ModelManager.getInstance();

  // Get cache information
  const cacheSize = modelManager.getCacheSize();
  const cachedModels = modelManager.getCachedModels();

  console.log(`Cache size: ${cacheSize}`);
  console.log('Cached models:', cachedModels);

  // Check if a specific model is cached
  const isModelCached = modelManager.isModelCached('translation', 'Helsinki-NLP/opus-mt-en-fr');
  console.log(`Is English-French model cached? ${isModelCached}`);

  // Remove a specific model from cache
  if (isModelCached) {
    modelManager.removeFromCache('translation', 'Helsinki-NLP/opus-mt-en-fr');
    console.log('Removed English-French model from cache');
  }

  // Clear the entire cache
  modelManager.clearCache();
  console.log('Cache cleared');
}

// Example usage
async function runExample(): Promise<void> {
  try {
    // Configure the ModelManager
    configureModelManager();

    // Translate text
    const translatedText = await translateWithModelManager(
      'Hello, how are you?',
      'en',
      'fr'
    );

    console.log('Translated text:', translatedText);

    // Manage the model cache
    manageModelCache();
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Export the example functions
export {
  translateWithModelManager,
  configureModelManager,
  manageModelCache,
  runExample
};