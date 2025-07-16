chrome.action.onClicked.addListener((tab) => {
  // Mở side panel khi click vào icon extension
  chrome.sidePanel.open({ windowId: tab.windowId });
}); 