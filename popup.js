document.addEventListener('DOMContentLoaded', function() {
  // Khởi tạo các biến cho nút in
  const showBottomPrintBtn = document.getElementById('showBottomPrintBtn');
  const showToolbarPrintBtn = document.getElementById('showToolbarPrintBtn');

  // Load cài đặt nút in từ storage
  function loadPrintButtonSettings() {
    chrome.storage.sync.get(['showBottomPrintBtn', 'showToolbarPrintBtn'], (result) => {
      showBottomPrintBtn.checked = result.showBottomPrintBtn !== false;
      showToolbarPrintBtn.checked = result.showToolbarPrintBtn !== false;
    });
  }

  // Lưu cài đặt nút in vào storage
  function savePrintButtonSettings() {
    chrome.storage.sync.set({
      showBottomPrintBtn: showBottomPrintBtn.checked,
      showToolbarPrintBtn: showToolbarPrintBtn.checked
    });
  }

  // Cập nhật hiển thị nút in trong content script
  function updatePrintButtonVisibility() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updatePrintButtons',
        showBottom: showBottomPrintBtn.checked,
        showToolbar: showToolbarPrintBtn.checked
      }, (response) => {
        if (chrome.runtime.lastError) {
          return;
        }
      });
    });
  }

  // Xử lý sự kiện thay đổi checkbox
  showBottomPrintBtn.addEventListener('change', () => {
    savePrintButtonSettings();
    updatePrintButtonVisibility();
  });

  showToolbarPrintBtn.addEventListener('change', () => {
    savePrintButtonSettings();
    updatePrintButtonVisibility();
  });

  // Initialize collapse buttons
  const collapseButtons = document.querySelectorAll('.collapse-btn');
  collapseButtons.forEach(button => {
    const targetId = button.getAttribute('data-target');
    const targetContent = document.getElementById(targetId);
    
    if (targetContent) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSection(button, targetContent);
      });
    }
  });

  // Make section headers clickable
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const button = header.querySelector('.collapse-btn');
      const targetId = button.getAttribute('data-target');
      const targetContent = document.getElementById(targetId);
      toggleSection(button, targetContent);
    });
  });

  function toggleSection(button, content) {
    button.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
  }

  // Các elements cho bảng
  const tableSelector = document.getElementById('tableSelector');
  const tableWidth = document.getElementById('tableWidth');
  const tableHeight = document.getElementById('tableHeight');
  const hideBorder = document.getElementById('hideBorder');
  const borderSettings = document.querySelector('.border-settings');
  
  // Border elements
  const showTopBorder = document.getElementById('showTopBorder');
  const borderTopWidth = document.getElementById('borderTopWidth');
  const borderTopColor = document.getElementById('borderTopColor');
  
  const showRightBorder = document.getElementById('showRightBorder');
  const borderRightWidth = document.getElementById('borderRightWidth');
  const borderRightColor = document.getElementById('borderRightColor');
  
  const showBottomBorder = document.getElementById('showBottomBorder');
  const borderBottomWidth = document.getElementById('borderBottomWidth');
  const borderBottomColor = document.getElementById('borderBottomColor');
  
  const showLeftBorder = document.getElementById('showLeftBorder');
  const borderLeftWidth = document.getElementById('borderLeftWidth');
  const borderLeftColor = document.getElementById('borderLeftColor');
  
  const borderStyle = document.getElementById('borderStyle');
  const headerBgColor = document.getElementById('headerBgColor');
  const headerTextColor = document.getElementById('headerTextColor');
  
  // Font elements
  const fontSize = document.getElementById('fontSize');
  const fontFamily = document.getElementById('fontFamily');
  const fontWeight = document.getElementById('fontWeight');
  const fontColor = document.getElementById('fontColor');
  
  // Table style elements
  const textAlign = document.getElementById('textAlign');
  const verticalAlign = document.getElementById('verticalAlign');
  const cellPadding = document.getElementById('cellPadding');

  // Heading elements
  const h1Elements = {
    fontSize: document.getElementById('h1FontSize'),
    fontWeight: document.getElementById('h1FontWeight'),
    color: document.getElementById('h1Color'),
    textAlign: document.getElementById('h1TextAlign')
  };

  const h2Elements = {
    fontSize: document.getElementById('h2FontSize'),
    fontWeight: document.getElementById('h2FontWeight'),
    color: document.getElementById('h2Color'),
    textAlign: document.getElementById('h2TextAlign')
  };

  const h3Elements = {
    fontSize: document.getElementById('h3FontSize'),
    fontWeight: document.getElementById('h3FontWeight'),
    color: document.getElementById('h3Color'),
    textAlign: document.getElementById('h3TextAlign')
  };

  let currentTableCount = 0;
  let isUpdating = false;

  // Khởi tạo danh sách bảng
  function initializeTableList() {
    if (isUpdating) return;
    isUpdating = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        isUpdating = false;
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getTables' }, (response) => {
        if (chrome.runtime.lastError) {
          isUpdating = false;
          return;
        }
        if (response && response.count && response.count !== currentTableCount) {
          currentTableCount = response.count;
          
          tableSelector.innerHTML = '';
          for (let i = 1; i <= response.count; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Bảng ${i}`;
            tableSelector.appendChild(option);
          }

          loadTableStyles(1);
        }
        isUpdating = false;
      });
    });
  }

  // Load styles cho bảng
  function loadTableStyles(tableNumber) {
    if (isUpdating) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getStyles',
        tableNumber
      }, (response) => {
        if (response && response.styles) {
          const styles = response.styles;
          
          // Load table styles
          tableWidth.value = styles.width || '';
          tableHeight.value = styles.height || '';
          hideBorder.checked = styles.hideBorder || false;
          
          // Load border styles
          showTopBorder.checked = styles.showTopBorder !== false;
          borderTopWidth.value = styles.borderTopWidth || 1;
          borderTopColor.value = styles.borderTopColor || '#000000';
          
          showRightBorder.checked = styles.showRightBorder !== false;
          borderRightWidth.value = styles.borderRightWidth || 1;
          borderRightColor.value = styles.borderRightColor || '#000000';
          
          showBottomBorder.checked = styles.showBottomBorder !== false;
          borderBottomWidth.value = styles.borderBottomWidth || 1;
          borderBottomColor.value = styles.borderBottomColor || '#000000';
          
          showLeftBorder.checked = styles.showLeftBorder !== false;
          borderLeftWidth.value = styles.borderLeftWidth || 1;
          borderLeftColor.value = styles.borderLeftColor || '#000000';
          
          borderStyle.value = styles.borderStyle || 'solid';
          headerBgColor.value = styles.headerBgColor || '#4e9d92';
          headerTextColor.value = styles.headerTextColor || '#ffffff';

          // Load font styles
          fontSize.value = styles.fontSize || '14px';
          fontFamily.value = styles.fontFamily || 'Arial, sans-serif';
          fontWeight.value = styles.fontWeight || 'normal';
          fontColor.value = styles.fontColor || '#000000';
          
          textAlign.value = styles.textAlign || 'left';
          verticalAlign.value = styles.verticalAlign || 'top';
          cellPadding.value = styles.cellPadding || 5;

          // Load heading styles
          if (styles.h1) {
            h1Elements.fontSize.value = styles.h1.fontSize || '24px';
            h1Elements.fontWeight.value = styles.h1.fontWeight || 'bold';
            h1Elements.color.value = styles.h1.color || '#000000';
            h1Elements.textAlign.value = styles.h1.textAlign || 'left';
          }

          if (styles.h2) {
            h2Elements.fontSize.value = styles.h2.fontSize || '20px';
            h2Elements.fontWeight.value = styles.h2.fontWeight || 'bold';
            h2Elements.color.value = styles.h2.color || '#000000';
            h2Elements.textAlign.value = styles.h2.textAlign || 'left';
          }

          if (styles.h3) {
            h3Elements.fontSize.value = styles.h3.fontSize || '18px';
            h3Elements.fontWeight.value = styles.h3.fontWeight || 'bold';
            h3Elements.color.value = styles.h3.color || '#000000';
            h3Elements.textAlign.value = styles.h3.textAlign || 'left';
          }

          // Update UI state
          if (styles.hideBorder) {
            borderSettings.classList.add('disabled');
          } else {
            borderSettings.classList.remove('disabled');
          }
        }
      });
    });
  }

  // Xử lý khi thay đổi trạng thái ẩn border
  hideBorder.addEventListener('change', () => {
    if (hideBorder.checked) {
      borderSettings.classList.add('disabled');
    } else {
      borderSettings.classList.remove('disabled');
    }
  });

  // Xử lý khi chọn bảng khác
  tableSelector.addEventListener('change', () => {
    if (isUpdating) return;
    loadTableStyles(parseInt(tableSelector.value));
  });

  // Áp dụng styles
  document.getElementById('applyStyles').addEventListener('click', () => {
    if (isUpdating) return;

    const styles = {
      width: tableWidth.value,
      height: tableHeight.value,
      hideBorder: hideBorder.checked,
      
      // Border styles
      showTopBorder: showTopBorder.checked,
      borderTopWidth: borderTopWidth.value,
      borderTopColor: borderTopColor.value,
      
      showRightBorder: showRightBorder.checked,
      borderRightWidth: borderRightWidth.value,
      borderRightColor: borderRightColor.value,
      
      showBottomBorder: showBottomBorder.checked,
      borderBottomWidth: borderBottomWidth.value,
      borderBottomColor: borderBottomColor.value,
      
      showLeftBorder: showLeftBorder.checked,
      borderLeftWidth: borderLeftWidth.value,
      borderLeftColor: borderLeftColor.value,
      
      borderStyle: borderStyle.value,
      headerBgColor: headerBgColor.value,
      headerTextColor: headerTextColor.value,

      // Font styles
      fontSize: fontSize.value,
      fontFamily: fontFamily.value,
      fontWeight: fontWeight.value,
      fontColor: fontColor.value,
      
      textAlign: textAlign.value,
      verticalAlign: verticalAlign.value,
      cellPadding: cellPadding.value,

      // Heading styles
      h1: {
        fontSize: h1Elements.fontSize.value,
        fontWeight: h1Elements.fontWeight.value,
        color: h1Elements.color.value,
        textAlign: h1Elements.textAlign.value
      },
      h2: {
        fontSize: h2Elements.fontSize.value,
        fontWeight: h2Elements.fontWeight.value,
        color: h2Elements.color.value,
        textAlign: h2Elements.textAlign.value
      },
      h3: {
        fontSize: h3Elements.fontSize.value,
        fontWeight: h3Elements.fontWeight.value,
        color: h3Elements.color.value,
        textAlign: h3Elements.textAlign.value
      }
    };

    // Lọc bỏ các giá trị rỗng
    Object.keys(styles).forEach(key => {
      if (!styles[key] && styles[key] !== false) {
        delete styles[key];
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'applyStyles',
        tableNumber: parseInt(tableSelector.value),
        styles
      }, (response) => {
        if (response && response.success) {
          showMessage('Đã áp dụng style thành công!', 'success');
        } else {
          showMessage('Có lỗi xảy ra khi áp dụng style!', 'error');
        }
      });
    });
  });

  // Reset styles
  document.getElementById('resetStyles').addEventListener('click', () => {
    if (isUpdating) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'resetStyles',
        tableNumber: parseInt(tableSelector.value)
      }, (response) => {
        if (response && response.success) {
          showMessage('Đã reset style thành công!', 'success');
          loadTableStyles(parseInt(tableSelector.value));
        } else {
          showMessage('Có lỗi xảy ra khi reset style!', 'error');
        }
      });
    });
  });

  // Hiển thị thông báo
  function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';

    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000);
  }

  // Khởi tạo
  initializeTableList();
}); 