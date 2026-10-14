chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Job Search & Application Assistant installed.');
  
  // Set recurring alarm for application reminders every 30 minutes
  chrome.alarms.create('checkReminders', { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkReminders') {
    // Check reminders from storage / API if token exists
    chrome.storage.local.get(['settings'], (res) => {
      if (res.settings && res.settings.token) {
        console.log('Checking pending follow-ups...');
      }
    });
  }
});

// Message hub
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'OPEN_DASHBOARD') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
    sendResponse({ status: 'ok' });
  }
  return true;
});
