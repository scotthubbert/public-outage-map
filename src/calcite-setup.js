// Calcite Components initialization
import { defineCustomElements } from '@esri/calcite-components/dist/loader';

export async function initializeCalcite() {
    try {
        // Define Calcite custom elements with CDN assets (default)
        await defineCustomElements();

        console.log('Calcite Components initialized');
        return true;
    } catch (error) {
        console.error('Error initializing Calcite Components:', error);
        throw error;
    }
}