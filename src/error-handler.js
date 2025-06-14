export class ErrorHandler {
    static init() {
        // Global unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            ErrorHandler.showUserError('A network error occurred. Please try again.');
            event.preventDefault();
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            ErrorHandler.showUserError('An unexpected error occurred.');
        });
    }

    static showUserError(message, type = 'red') {
        const alert = document.getElementById('status-alert');
        const messageElement = document.getElementById('alert-message');

        if (alert && messageElement) {
            messageElement.textContent = message;
            alert.setAttribute('kind', type);
            alert.removeAttribute('hidden');
        }
    }

    static async withErrorHandling(asyncFn, context = 'operation') {
        try {
            return await asyncFn();
        } catch (error) {
            console.error(`Error in ${context}:`, error);
            this.showUserError(`Error during ${context}. Please try again.`);
            throw error;
        }
    }
} 