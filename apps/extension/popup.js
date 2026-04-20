// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const elevenKeyInput = document.getElementById('elevenLabsKey');
    const claudeKeyInput = document.getElementById('claudeKey');
    const saveButton = document.getElementById('saveKeys');

    // Load existing keys
    chrome.storage.local.get(['elevenLabsKey', 'claudeKey'], (result) => {
        if (result.elevenLabsKey) elevenKeyInput.value = result.elevenLabsKey;
        if (result.claudeKey) claudeKeyInput.value = result.claudeKey;
    });

    // Save keys
    saveButton.addEventListener('click', () => {
        const elevenKey = elevenKeyInput.value.trim();
        const claudeKey = claudeKeyInput.value.trim();
        
        chrome.storage.local.set({ 
            elevenLabsKey: elevenKey,
            claudeKey: claudeKey
        }, () => {
            saveButton.innerText = 'SAVED ✓';
            saveButton.style.background = '#10b981';
            setTimeout(() => {
                saveButton.innerText = 'Save Credentials';
                saveButton.style.background = '#475569';
            }, 2000);
        });
    });
});
