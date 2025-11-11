// Hello World R1 Creation App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Hello World R1 Creation loaded!');

    // Check if running as R1 plugin
    if (typeof PluginMessageHandler !== 'undefined') {
        console.log('Running as R1 Creation');
        updateMessage('Running on Rabbit R1 device!');
    } else {
        console.log('Running in browser mode');
        updateMessage('Running in browser preview mode.');
    }

    // Plugin message handler (for R1 device)
    window.onPluginMessage = function(data) {
        console.log('Received plugin message:', data);
        if (data && data.message) {
            updateMessage(data.message);
        }
    };
});

function updateMessage(text) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = text;
    }
}

