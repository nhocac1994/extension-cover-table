// Biến toàn cục
let tableStyles = {};
let htmlStyles = {};
let lastTableCount = 0;
let isInitialized = false;
let resizeTimeout;

// Inject CSS mặc định
function injectDefaultStyles() {
  if (document.getElementById('default-extension-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'default-extension-styles';
  style.textContent = `
    /* Reset all inherited styles */
    [data-testonly-column="data"] {
      all: initial !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 10px 10px 0 10px !important;
      display: block !important;
      box-sizing: border-box !important;
    }

    /* Base font settings */
    [data-testonly-column="data"] * {
      box-sizing: border-box !important;
    }

    [data-testonly-column="data"] table {
      width: 100% !important;
      margin: 0 auto !important;
      border-collapse: collapse !important;
      margin-bottom: 10px !important;
    }

    [data-testonly-column="data"] table.table-formatted {
      margin: 10px 0 !important;
    }

    /* Heading styles */
    [data-testonly-column="data"] h1 {
      font-size: 24px !important;
      font-weight: bold !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }

    [data-testonly-column="data"] h2 {
      font-size: 20px !important;
      font-weight: bold !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }

    [data-testonly-column="data"] h3 {
      font-size: 18px !important;
      font-weight: bold !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }

    [data-testonly-column="data"] h4 {
      font-size: 16px !important;
      font-weight: bold !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }

    [data-testonly-column="data"] h5 {
      font-size: 14px !important;
      font-weight: bold !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }

    [data-testonly-column="data"] h6 {
      font-size: 12px !important;
      font-weight: bold !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }

    [data-testonly-column="data"] p {
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }
  `;
  document.head.appendChild(style);
}

// Hàm chính để khởi tạo và áp dụng styles
async function initialize() {
  
  // Inject CSS mặc định trước
  injectDefaultStyles();
  
  // Khôi phục cài đặt đã lưu
  await restorePageSettings();
  
  // Áp dụng styles mặc định và đã lưu
  applyAllStyles();
  
  // Theo dõi thay đổi DOM
  observeChanges();
}

// Hàm đợi element xuất hiện trong DOM
function waitForElement(selector, maxAttempts = 50, interval = 100) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkElement, interval);
      } else {
        resolve(null);
      }
    };
    
    checkElement();
  });
}

// Áp dụng tất cả styles
function applyAllStyles() {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container) return;

  // Áp dụng style cho các thẻ HTML
  applyHTMLStyles(true);

  // Đánh số các bảng
  const tables = container.getElementsByTagName('table');
  Array.from(tables).forEach((table, index) => {
    const tableNumber = index + 1;
    table.setAttribute('data-table-number', tableNumber);
    
    // Áp dụng style đã lưu cho bảng
    if (tableStyles[tableNumber]) {
      applyTableStyles(tableNumber, tableStyles[tableNumber], true);
    }
  });

  // Đánh dấu đã khởi tạo
  container.classList.add('styles-applied');
  isInitialized = true;
}

// Áp dụng style cho các thẻ HTML
function applyHTMLStyles(forceImportant = false) {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container || !htmlStyles) return;

  // Áp dụng style cho headings và paragraphs
  Object.entries(htmlStyles).forEach(([tag, styles]) => {
    const elements = container.querySelectorAll(tag);
    elements.forEach(element => {
      element.style.cssText = `
        font-size: ${styles.fontSize || '14px'} !important;
        font-weight: ${styles.fontWeight || 'normal'} !important;
        color: ${styles.color || '#000000'} !important;
        text-align: ${styles.textAlign || 'left'} !important;
        margin: ${styles.margin || '0'} !important;
        padding: ${styles.padding || '0'} !important;
        line-height: ${styles.lineHeight || 'normal'} !important;
      `;
    });
  });
}

// Hàm đánh số thứ tự tự động cho bảng
function autoNumberTable(table) {
  if (!table) return;

  const rows = table.rows;
  if (rows.length < 2) return; // Cần ít nhất 2 dòng (header + data)

  // Tìm cột STT trong header
  const headerRow = rows[0];
  let sttColumnIndex = -1;
  
  for (let i = 0; i < headerRow.cells.length; i++) {
    const headerText = headerRow.cells[i].textContent.trim().toLowerCase();
    if (headerText === 'stt' || headerText === 'số thứ tự' || headerText === 'số tt') {
      sttColumnIndex = i;
      break;
    }
  }

  // Nếu không tìm thấy cột STT, thoát
  if (sttColumnIndex === -1) return;

  // Đánh số thứ tự từ 1
  let stt = 1;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.cells || !row.cells[sttColumnIndex]) continue;

    const sttCell = row.cells[sttColumnIndex];
    const nextCell = row.cells[sttColumnIndex + 1];

    // Kiểm tra nếu là dòng tổng cộng
    const isTotal = row.cells[0].textContent.trim().toLowerCase().includes('tổng');
    if (isTotal) {
      // Xử lý dòng tổng cộng nếu cần
      continue;
    }

    // Chỉ đánh số nếu ô bên cạnh có dữ liệu
    if (nextCell && nextCell.textContent.trim() !== '') {
      sttCell.textContent = stt++;
      sttCell.style.textAlign = 'center';
    }
  }
}

// Hàm áp dụng đánh số thứ tự cho tất cả bảng trong container
function applyAutoNumbering() {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container) return;

  const tables = container.getElementsByTagName('table');
  Array.from(tables).forEach(table => {
    autoNumberTable(table);
  });
}

// Thêm vào hàm applyAllStyles để tự động đánh số khi áp dụng style
function applyAllStyles() {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container) return;

  // Áp dụng style cho tất cả bảng
  Object.entries(tableStyles).forEach(([tableNumber, styles]) => {
    applyTableStyles(tableNumber, styles);
  });

  // Áp dụng style cho HTML elements
  applyHTMLStyles();

  // Áp dụng đánh số thứ tự tự động
  applyAutoNumbering();
}

// Thêm vào observer để đánh số lại khi DOM thay đổi
function observeChanges() {
  const rootContainer = document.body;
  if (!rootContainer) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches('[data-testonly-column="data"]') || 
                node.querySelector('[data-testonly-column="data"]')) {
              applyAllStyles();
            }
          }
        });
      }
    });
  });

  observer.observe(rootContainer, {
    childList: true,
    subtree: true
  });
}

// Lưu cài đặt
function savePageSettings() {
  const currentUrl = window.location.href;
  const settings = {
    url: currentUrl,
    tableStyles: tableStyles,
    htmlStyles: htmlStyles,
    lastModified: Date.now()
  };
  
  chrome.storage.sync.set({ 
    [`pageSettings_${currentUrl}`]: settings 
  }, () => {
  });
}

// Khôi phục cài đặt
async function restorePageSettings() {
  const currentUrl = window.location.href;
  
  return new Promise((resolve) => {
    chrome.storage.sync.get([`pageSettings_${currentUrl}`], (result) => {
      const settings = result[`pageSettings_${currentUrl}`];
      if (settings) {
        tableStyles = settings.tableStyles || {};
        htmlStyles = settings.htmlStyles || {};
      }
      resolve();
    });
  });
}

// Áp dụng style cho bảng cụ thể
function applyTableStyles(tableNumber, styles, forceImportant = false) {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container) return;

  const tables = container.getElementsByTagName('table');
  const table = tables[tableNumber - 1];
  if (!table) return;

  // Áp dụng style cho bảng
  table.style.cssText = `
    width: ${styles.width || '100%'} !important;
    height: ${styles.height || 'auto'} !important;
    border-collapse: collapse !important;
    text-align: ${styles.textAlign || 'left'} !important;
    vertical-align: ${styles.verticalAlign || 'top'} !important;
    font-size: ${styles.fontSize || '14px'} !important;
    font-family: ${styles.fontFamily || 'Arial, sans-serif'} !important;
    font-weight: ${styles.fontWeight || 'normal'} !important;
    color: ${styles.fontColor || '#000000'} !important;
    margin: 0 !important;
    margin-left: 0 !important;
    ${styles.hideBorder ? `
      border: hidden !important;
      border-width: 0 !important;
      border-style: hidden !important;
    ` : `
      border: ${styles.borderWidth || 1}px ${styles.borderStyle || 'solid'} #ddd !important;
    `}
  `;

  // Áp dụng style cho các ô
  const cells = table.querySelectorAll('th, td');
  cells.forEach(cell => {
    const isHeader = cell.tagName.toLowerCase() === 'th';
    let cellStyles = `
      padding: ${styles.cellPadding || 5}px !important;
      font-size: ${styles.fontSize || '14px'} !important;
      font-family: ${styles.fontFamily || 'Arial, sans-serif'} !important;
      font-weight: ${isHeader ? 'bold' : (styles.fontWeight || 'normal')} !important;
      color: ${isHeader ? (styles.headerTextColor || '#ffffff') : (styles.fontColor || '#000000')} !important;
      ${styles.hideBorder ? `
        border: hidden !important;
        border-width: 0 !important;
        border-style: hidden !important;
      ` : ''}
    `;

    // Xử lý viền nếu không ẩn
    if (!styles.hideBorder) {
      const borderStyle = styles.borderStyle || 'solid';
      
      // Viền trên
      if (styles.showTopBorder !== false) {
        cellStyles += `border-top: ${styles.borderTopWidth || 1}px ${borderStyle} ${styles.borderTopColor || '#000000'} !important;`;
      }
      
      // Viền phải
      if (styles.showRightBorder !== false) {
        cellStyles += `border-right: ${styles.borderRightWidth || 1}px ${borderStyle} ${styles.borderRightColor || '#000000'} !important;`;
      }
      
      // Viền dưới
      if (styles.showBottomBorder !== false) {
        cellStyles += `border-bottom: ${styles.borderBottomWidth || 1}px ${borderStyle} ${styles.borderBottomColor || '#000000'} !important;`;
      }
      
      // Viền trái
      if (styles.showLeftBorder !== false) {
        cellStyles += `border-left: ${styles.borderLeftWidth || 1}px ${borderStyle} ${styles.borderLeftColor || '#000000'} !important;`;
      }
    }

    // Áp dụng màu nền cho header
    if (isHeader && styles.headerBgColor) {
      cellStyles += `
        background-color: ${styles.headerBgColor} !important;
      `;
    }

    cell.style.cssText = cellStyles;
  });

  // Áp dụng style cho các heading
  if (styles.h1) {
    const h1s = table.getElementsByTagName('h1');
    Array.from(h1s).forEach(h1 => {
      h1.style.cssText = `
        font-size: ${styles.h1.fontSize || '24px'} !important;
        font-weight: ${styles.h1.fontWeight || 'bold'} !important;
        color: ${styles.h1.color || '#000000'} !important;
        text-align: ${styles.h1.textAlign || 'left'} !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
    });
  }

  if (styles.h2) {
    const h2s = table.getElementsByTagName('h2');
    Array.from(h2s).forEach(h2 => {
      h2.style.cssText = `
        font-size: ${styles.h2.fontSize || '20px'} !important;
        font-weight: ${styles.h2.fontWeight || 'bold'} !important;
        color: ${styles.h2.color || '#000000'} !important;
        text-align: ${styles.h2.textAlign || 'left'} !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
    });
  }

  if (styles.h3) {
    const h3s = table.getElementsByTagName('h3');
    Array.from(h3s).forEach(h3 => {
      h3.style.cssText = `
        font-size: ${styles.h3.fontSize || '18px'} !important;
        font-weight: ${styles.h3.fontWeight || 'bold'} !important;
        color: ${styles.h3.color || '#000000'} !important;
        text-align: ${styles.h3.textAlign || 'left'} !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
    });
  }

  // Lưu styles
  tableStyles[tableNumber] = styles;
  savePageSettings();
}

// Xử lý messages từ popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'updatePrintButtons':
        updatePrintButtonVisibility(request.showBottom, request.showToolbar);
        sendResponse({ success: true });
        break;

      case 'applyStyles':
        applyTableStyles(request.tableNumber, request.styles, true);
        sendResponse({ success: true });
        break;
        
      case 'applyHTMLStyles':
        htmlStyles[request.tag] = request.styles;
        applyHTMLStyles(true);
        savePageSettings();
        sendResponse({ success: true });
        break;
        
      case 'resetStyles':
        resetTableStyles(request.tableNumber);
        sendResponse({ success: true });
        break;
        
      case 'resetHTMLStyles':
        resetHTMLStyles(request.tag);
        sendResponse({ success: true });
        break;
        
      case 'getStyles':
        sendResponse({ styles: tableStyles[request.tableNumber] || {} });
        break;
        
      case 'getHTMLStyles':
        sendResponse({ styles: htmlStyles[request.tag] || {} });
        break;
        
      case 'getTables':
        const container = document.querySelector('[data-testonly-column="data"]');
        const count = container ? container.getElementsByTagName('table').length : 0;
        sendResponse({ count });
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  return true;
});

// Kiểm tra kết nối và khởi động lại nếu cần
function checkConnection() {
  if (!chrome.runtime.id) {
    window.location.reload();
    return;
  }
}

// Kiểm tra kết nối định kỳ
setInterval(checkConnection, 5000);

// Reset styles cho bảng
function resetTableStyles(tableNumber) {
  const table = document.querySelector(`table[data-table-number="${tableNumber}"]`);
  if (!table) return;

  table.classList.remove('table-formatted');
  table.removeAttribute('style');
  table.removeAttribute('cellspacing');

  const cells = table.querySelectorAll('th, td');
  cells.forEach(cell => {
    cell.removeAttribute('style');
  });

  delete tableStyles[tableNumber];
  savePageSettings();
}

// Reset styles cho thẻ HTML
function resetHTMLStyles(tag) {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container) return;

  const elements = container.querySelectorAll(tag);
  elements.forEach(element => {
    element.removeAttribute('style');
  });

  delete htmlStyles[tag];
  savePageSettings();
}

// Khởi tạo khi trang load
function initOnLoad() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}

// Theo dõi thay đổi URL
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    isInitialized = false;
    initialize();
  }
}).observe(document.querySelector('title'), { subtree: true, characterData: true });

// Bắt đầu khởi tạo
initOnLoad(); 

// Xử lý sự kiện resize
function handleResize() {
  // Debounce để tránh gọi quá nhiều lần
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    forceReapplyStyles();
  }, 250);
}

// Áp dụng lại styles một cách mạnh mẽ
function forceReapplyStyles() {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container) return;

  // Xóa tất cả styles hiện tại
  const tables = container.getElementsByTagName('table');
  Array.from(tables).forEach((table) => {
    const tableNumber = table.getAttribute('data-table-number');
    if (tableNumber && tableStyles[tableNumber]) {
      // Áp dụng lại với !important
      applyTableStyles(tableNumber, tableStyles[tableNumber], true);
    }
  });

  // Áp dụng lại HTML styles với !important
  applyHTMLStyles(true);
}

// Cleanup khi extension bị tắt
window.addEventListener('unload', () => {
  window.removeEventListener('resize', handleResize);
}); 

// Thêm styles cho nút in
function addPrintButtonStyles() {
  if (!document.getElementById('print-button-styles')) {
    const style = document.createElement('style');
    style.id = 'print-button-styles';
    style.textContent = `
      .print-button-bottom {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999 !important;
      }

      .print-button-bottom .print-btn {
        background-color: #1a73e8;
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        width: 50px;
        height: 50px;
        padding: 0;
        display: flex !important;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .print-button-bottom .print-btn:hover {
        background-color: #1557b0;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }

      .print-button-bottom .print-btn i {
        font-size: 18px;
        color: white;
      }

      .print-button-bottom .print-btn .GenericActionButton__text,
      .print-button-bottom .print-btn .sr-only {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }
}

// Hàm tạo nút in trong action bar
function addPrintButtonToActionBar() {
  const actionBar = document.querySelector('.SlideshowPage__action-bar');
  if (!actionBar) return;

  // Kiểm tra nếu nút đã tồn tại
  if (actionBar.querySelector('[data-testonly-action="print-bill"]')) return;

  // Tìm nút Copy để lấy mẫu
  const copyBtn = actionBar.querySelector('[data-testonly-action="7.0 Group copy"]');
  if (!copyBtn) return;

  // Tạo container cho nút in
  const printBtnContainer = document.createElement('div');
  printBtnContainer.className = 'SlideshowPage__header-action SlideshowPage__header-action-react-root';
  printBtnContainer.style.cssText = 'display: inline-flex; margin-left: 8px;';

  // Tạo nút in với style giống nút copy
  const printBtn = document.createElement('span');
  printBtn.setAttribute('data-testonly-action', 'print-bill');
  printBtn.setAttribute('data-testid', 'print-bill');
  printBtn.className = copyBtn.className; // Sử dụng chính xác class của nút copy
  printBtn.setAttribute('href', '#');
  printBtn.setAttribute('tabindex', '0');
  printBtn.setAttribute('role', 'button');
  printBtn.setAttribute('title', 'In đơn hàng');

  // Tạo phần paddington chứa icon
  const paddington = document.createElement('div');
  paddington.className = 'GenericActionButton__paddington';

  // Thêm icon
  const icon = document.createElement('i');
  icon.className = 'GenericActionButton__icon fas fa-print';

  // Thêm sr-only text
  const srOnly = document.createElement('span');
  srOnly.className = 'sr-only';
  srOnly.textContent = 'In đơn hàng';

  // Thêm text hiển thị
  const text = document.createElement('div');
  text.className = 'GenericActionButton__text';
  text.setAttribute('aria-hidden', 'true');
  text.textContent = 'In đơn hàng';

  // Ghép các phần lại với nhau
  paddington.appendChild(icon);
  paddington.appendChild(srOnly);
  printBtn.appendChild(paddington);
  printBtn.appendChild(text);
  printBtnContainer.appendChild(printBtn);

  // Thêm vào sau nút copy
  copyBtn.parentElement.after(printBtnContainer);

  // Thêm sự kiện click
  printBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handlePrint();
  });
}

// Xử lý in
function handlePrint() {
  const container = document.querySelector('[data-testonly-column="data"]');
  if (!container) return;

  // Tạo iframe tạm thời để in
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>In</title>
        <style>
          body { margin: 0; padding: 20px; }
          @media print {
            @page { margin: 0.5cm; }
          }
          ${document.getElementById('default-extension-styles')?.textContent || ''}
        </style>
      </head>
      <body>
        ${container.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  // In và xóa iframe
  iframe.contentWindow.print();
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 100);
}

// Thêm nút in ở bottom
function addBottomPrintButton() {
  if (document.querySelector('.print-button-bottom')) return;

  const bottomPrintBtn = document.createElement('div');
  bottomPrintBtn.className = 'print-button-bottom';
  
  const button = document.createElement('button');
  button.className = 'print-btn';
  
  // Tạo phần paddington chứa icon
  const paddington = document.createElement('div');
  paddington.className = 'GenericActionButton__paddington';

  // Thêm icon
  const icon = document.createElement('i');
  icon.className = 'GenericActionButton__icon fas fa-print';

  // Thêm sr-only text
  const srOnly = document.createElement('span');
  srOnly.className = 'sr-only';
  srOnly.textContent = 'In đơn hàng';

  // Thêm text hiển thị
  const text = document.createElement('div');
  text.className = 'GenericActionButton__text';
  text.setAttribute('aria-hidden', 'true');
  text.textContent = 'In đơn hàng';

  // Ghép các phần lại với nhau
  paddington.appendChild(icon);
  paddington.appendChild(srOnly);
  button.appendChild(paddington);
  button.appendChild(text);
  bottomPrintBtn.appendChild(button);

  document.body.appendChild(bottomPrintBtn);
  button.addEventListener('click', handlePrint);
}

// Cập nhật hiển thị nút in
function updatePrintButtonVisibility(showBottom, showToolbar) {
  console.log('Updating visibility:', { showBottom, showToolbar });

  // Xử lý nút in trên thanh công cụ
  const toolbarBtn = document.querySelector('[data-testonly-action="print-bill"]');
  if (toolbarBtn) {
    const container = toolbarBtn.closest('.SlideshowPage__header-action');
    if (container) {
      container.style.display = showToolbar ? 'inline-flex' : 'none';
    }
  }

  // Xử lý nút in ở dưới
  const bottomBtn = document.querySelector('.print-button-bottom');
  if (bottomBtn) {
    bottomBtn.style.display = showBottom ? 'block' : 'none';
  } else if (showBottom) {
    // Nếu nút bottom không tồn tại nhưng cần hiển thị, tạo mới nút
    addBottomPrintButton();
  }
}

// Khởi tạo trạng thái hiển thị nút từ storage
function initializePrintButtonVisibility() {
  chrome.storage.sync.get(['showBottomPrintBtn', 'showToolbarPrintBtn'], (result) => {
    const showBottom = result.showBottomPrintBtn !== false;
    const showToolbar = result.showToolbarPrintBtn !== false;
    updatePrintButtonVisibility(showBottom, showToolbar);
  });
}

// Khởi tạo các nút in
async function initializePrintButtons() {
  try {
    // Thêm styles cho nút in
    addPrintButtonStyles();

    // Thêm các nút in
    await addPrintButtonToActionBar();
    addBottomPrintButton();

    // Khởi tạo trạng thái hiển thị
    initializePrintButtonVisibility();

    // Theo dõi thay đổi DOM để thêm lại nút nếu cần
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const actionBar = document.querySelector('.SlideshowPage__action-bar');
          if (actionBar && !document.querySelector('[data-testonly-action="print-bill"]')) {
            await addPrintButtonToActionBar();
            initializePrintButtonVisibility();
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.error('Error initializing print buttons:', error);
  }
}

// Khởi tạo khi trang đã load
document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  await initializePrintButtons();
});

// Lắng nghe thay đổi từ storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    let showBottom = undefined;
    let showToolbar = undefined;

    if (changes.showBottomPrintBtn) {
      showBottom = changes.showBottomPrintBtn.newValue;
    }
    if (changes.showToolbarPrintBtn) {
      showToolbar = changes.showToolbarPrintBtn.newValue;
    }

    // Chỉ cập nhật nếu có thay đổi liên quan
    if (showBottom !== undefined || showToolbar !== undefined) {
      chrome.storage.sync.get(['showBottomPrintBtn', 'showToolbarPrintBtn'], (result) => {
        updatePrintButtonVisibility(
          showBottom !== undefined ? showBottom : result.showBottomPrintBtn !== false,
          showToolbar !== undefined ? showToolbar : result.showToolbarPrintBtn !== false
        );
      });
    }
  }
});

// Lắng nghe message từ popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updatePrintButtons') {
    updatePrintButtonVisibility(request.showBottom, request.showToolbar);
    sendResponse({ success: true });
  }
});

// Khởi tạo ngay lập tức nếu trang đã load
if (document.readyState !== 'loading') {
  initializePrintButtons();
}