import axios from "axios";
// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "runScan") {
        handleScan(request.data, sendResponse);
        return true; // Keep channel open for async response
    }
});
const handleScan = async (data, sendResponse) => {
    try {
        const { url, title, elements } = data;
        const API_URL = "http://localhost:3001/api/agents/scamsniff/run";
        // Obtain token from storage
        const { token } = await chrome.storage.local.get("token");
        const response = await axios.post(API_URL, { url, title, elements }, { headers: { Authorization: `Bearer ${token}` } });
        sendResponse({ success: true, data: response.data });
    }
    catch (error) {
        console.error("Scan failed:", error);
        sendResponse({ success: false, error: error.message });
    }
};
