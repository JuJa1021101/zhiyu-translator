/**
 * Example usage of the TranslationService
 * 
 * This example demonstrates how to use the TranslationService class
 * to translate text between different languages.
 */

import { TranslationService } from '../services/TranslationService';
import { ProgressEvent } from '../types';

// Create a simple console application to demonstrate TranslationService
async function translationServiceDemo() {
  console.log('TranslationService Demo');
  console.log('======================');

  // Create a new TranslationService instance with custom configuration
  const service = new TranslationService({
    maxConcurrentTranslations: 2,
    timeout: 30000,
    retryOptions: {
      maxRetries: 3,
      retryDelay: 1000,
      retryMultiplier: 1.5
    }
  });

  // Register progress callback
  service.onProgress((progress: ProgressEvent) => {
    const percent = Math.round(progress.progress);
    console.log(`Progress (${progress.type}): ${percent}% - ${progress.message}`);
  });

  try {
    // Initialize the service
    console.log('Initializing translation service...');
    await service.initialize({
      cacheModels: true,
      quantized: true
    });
    console.log('Service initialized successfully');

    // Translate a simple text
    console.log('\nTranslating: "Hello, world!" from English to French');
    const translation1 = await service.translate(
      'Hello, world!',
      'en',
      'fr'
    );
    console.log(`Translation result: "${translation1}"`);

    // Translate another text with different languages
    console.log('\nTranslating: "How are you today?" from English to German');
    const translation2 = await service.translate(
      'How are you today?',
      'en',
      'de'
    );
    console.log(`Translation result: "${translation2}"`);

    // Demonstrate queue management with multiple concurrent requests
    console.log('\nDemonstrating queue management with multiple requests:');
    const texts = [
      'The quick brown fox jumps over the lazy dog.',
      'Programming is fun and rewarding.',
      'Machine learning is transforming the world.',
      'Natural language processing enables computers to understand human language.'
    ];

    const languages = ['fr', 'de', 'es', 'zh'];

    // Start multiple translations concurrently
    console.log('Starting multiple translations...');
    const promises = texts.map((text, index) => {
      return service.translate(text, 'en', languages[index])
        .then(result => {
          console.log(`Translation ${index + 1} completed: "${result.substring(0, 30)}..."`);
          return result;
        });
    });

    // Wait for all translations to complete
    await Promise.all(promises);
    console.log('All translations completed');

    // Check service status
    const status = service.getServiceStatus();
    console.log('\nService status:', status);

    // Demonstrate error handling by attempting an unsupported language pair
    try {
      console.log('\nAttempting translation with unsupported language pair:');
      await service.translate('This will fail', 'xx', 'yy');
    } catch (error) {
      console.log(`Error handled: ${error.message}`);
    }

    // Demonstrate service reset
    console.log('\nResetting service...');
    await service.resetService();
    console.log('Service reset complete');

    // Translate one more text after reset
    console.log('\nTranslating after service reset:');
    const translation3 = await service.translate(
      'Translation service has been reset successfully.',
      'en',
      'fr'
    );
    console.log(`Translation result: "${translation3}"`);

  } catch (error) {
    console.error('Error in translation demo:', error);
  } finally {
    // Clean up resources
    console.log('\nCleaning up resources...');
    service.destroy();
    console.log('Demo completed');
  }
}

// Run the demo
// Note: In a real application, this would be called from a UI component
// translationServiceDemo().catch(console.error);

// Export the demo function for use in other files
export default translationServiceDemo;