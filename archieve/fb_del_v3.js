const delay = ms => new Promise(res => setTimeout(res, ms));
const DELETE_LABELS = ['刪除', 'Delete', 'Supprimer', 'Eliminar'];
const CONFIRM_LABELS = ['刪除', 'Delete', '確定', 'Confirm', 'Delete post'];

async function waitForElement(getElementFn, timeout = 5000, interval = 300) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = getElementFn();
    if (el) return el;
    await delay(interval);
  }
  return null;
}








let errorCount = 0;
let deleted = 0;

async function clickConfirmDelete(maxRetries = 3) {
  const CONFIRM_LABELS = ['刪除', 'Delete', 'Confirm', '確認'];
  const ERROR_MESSAGE = '發生錯誤，請再試一次。';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`ℹ️ 刪除嘗試 ${attempt}/${maxRetries}`);

    // Target the delete button or its parent container
    const confirmBtn = await waitForElement(() => {
      const span = Array.from(document.querySelectorAll('span.x1vvkbs')).find(
        el => CONFIRM_LABELS.includes(el.innerText.trim())
      );
      if (!span) return null;
      let target = span;
      let parent = span.closest('div.x1ja2u2z');
      if (parent && isElementClickable(parent)) {
        target = parent;
      }
      return isElementClickable(target) ? target : null;
    }, 10000);

    if (!confirmBtn) {
      console.warn('⚠️ 無法找到確認刪除按鈕');
      console.log('當前 DOM 結構:', document.querySelector('body').innerHTML.substring(0, 200));
      //errorCount++; // Increment error counter for failed button detection
      return false;
    }

    try {
      // Simulate a trusted click
      confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      console.log(`✅ 成功點擊「${confirmBtn.innerText.trim()}」按鈕`);

      // Handle potential privacy selector dialog
      const dialogHandled = await handlePrivacyDialog();
      if (!dialogHandled) {
        console.warn('⚠️ 無法處理隱私對話框');
        //errorCount++; // Increment error counter for failed dialog handling
        return false;
      }

      // Check for error message
      const errorElement = await waitForElement(() => {
        return Array.from(document.querySelectorAll('span.x1vvkbs')).find(
          el => el.innerText.trim() === ERROR_MESSAGE
        );
      }, 5000);

      if (errorElement) {
        console.warn(`⚠️ 刪除失敗: ${ERROR_MESSAGE}`);
        //errorCount++; // Increment error counter for deletion failure
        if (attempt < maxRetries) {
          console.log('ℹ️ 等待 2 秒後重試...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue; // Retry
        } else {
          console.error('❌ 達到最大重試次數，刪除失敗');
          return false;
        }
      }

      console.log('✅ 刪除成功，無錯誤訊息');
      console.log(`ℹ️ 當前錯誤計數: ${errorCount}`);
      return true;
    } catch (error) {
      console.error(`❌ 點擊按鈕失敗: ${error.message}`);
      //errorCount++; // Increment error counter for click failure
	  //deleted--;
      return false;
    }
  }
}

// Check if element is clickable
function isElementClickable(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null &&
    !element.hasAttribute('disabled')
  );
}

// Wait for element
async function waitForElement(selectorFn, timeout = 10000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkElement = () => {
      const element = selectorFn();
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        resolve(null);
      } else {
        setTimeout(checkElement, 100);
      }
    };
    checkElement();
  });
}

// Wait for dialog to appear
async function waitForDialog(timeout = 5000) {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations, obs) => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (dialog) {
        obs.disconnect();
        resolve(dialog);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// Handle privacy selector dialog
async function handlePrivacyDialog() {
  const dialog = await waitForDialog(5000);
  if (!dialog) {
    console.log('ℹ️ 無隱私對話框出現');
    return true; // No dialog, proceed
  }

  // Expanded list of possible confirmation texts
  const CONFIRM_TEXTS = [
    '確認', 'Confirm', '確定', 'OK', '完成', 'Done', '提交', 'Submit',
    '刪除', 'Delete', '是的', 'Yes', '繼續', 'Continue', '確定刪除', 'Confirm Delete'
  ];

  // Retry finding the button up to 3 times
  for (let attempt = 1; attempt <= 1; attempt++) {
    const confirmOption = Array.from(
      dialog.querySelectorAll('span, button, div[role="button"], a, div.x1vvkbs')
    ).find(el => {
      const text = el.innerText.trim();
      return CONFIRM_TEXTS.includes(text) && isElementClickable(el);
    });

    if (confirmOption) {
      try {
        confirmOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        console.log(`✅ 成功點擊隱私對話框按鈕: ${confirmOption.innerText.trim()}`);
        return true;
      } catch (error) {
        console.error(`❌ 點擊隱私對話框按鈕失敗: ${error.message}`);
        return false;
      }
    }

    // Log dialog structure for debugging
    console.log(`ℹ️ 嘗試 ${attempt}: 隱私對話框 DOM 結構:`, dialog.innerHTML.substring(0, 500));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
  }

  console.warn('⚠️ 無法找到隱私對話框確認按鈕，支援的文字:', CONFIRM_TEXTS);
  //errorCount++;
  //deleted--;
  console.log(`✅ errorCount= ${errorCount} `);
  return false;
}













async function autoDeletePosts(limit = 100, scrollTimes = 3) {
  
  console.log("🔄 開始滾動頁面...");
  for (let i = 0; i < scrollTimes; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await delay(2000);
  }

  // Find all <i> elements with the specified classes
  const iconElements = Array.from(document.querySelectorAll('i.x1b0d499.xep6ejk'));
  
  // Map to their closest clickable parent (e.g., div or button with role="button" or tabindex)
  const menuButtons = iconElements
    .map(icon => icon.closest('div[role="button"], button, [tabindex]'))
    .filter(button => button !== null); // Remove any null results

  console.log(`✅ 找到 ${menuButtons.length} 個貼文選單`);

  if (menuButtons.length === 0) {
    console.warn("⚠️ 沒有找到任何『⋯』選單，請檢查選擇器或語言");
    return;
  }
  
  
  
  //let i=24;
  
  
  
  
  for (let i = 5; i < menuButtons.length && deleted < limit; i++) {
    try {
      const menuBtn = menuButtons[24+errorCount];
  menuBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(300);
  menuBtn.click();
  console.log(`📝 展開選單...`);




  const deleteOption = await waitForElement(() => {
  return Array.from(document.querySelectorAll('div[role="menuitem"] span')).find(el =>
    DELETE_LABELS.includes(el.innerText.trim())
  );
}, 5000);

if (!deleteOption) {
  console.warn("⚠️ 找不到刪除選項，跳過");
  return;
}

const parentMenuItem = deleteOption.closest('div[role="menuitem"]');
if (!parentMenuItem) {
  console.warn("⚠️ 找不到父級 menuitem，跳過");
  return;
}

if (!isElementVisible(parentMenuItem)) {
  console.warn("⚠️ 刪除選項不可見，無法點擊");
  return;
}

// Simulate a realistic click
const clickEvent = new MouseEvent('click', {
  view: window,
  bubbles: true,
  cancelable: true
});
parentMenuItem.dispatchEvent(clickEvent);
console.log("🗑️ 點擊刪除");
  
  
 function isElementVisible(el) {
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
}
  
  
  await delay(1000); // 給 Facebook 時間處理刪除
  const confirmed = await clickConfirmDelete();
  if (confirmed) {
	console.log(`✅ 第 ${deleted} 筆貼文刪除成功`);
	console.log(`✅ errorCount= ${errorCount} `);
  }

  await delay(2000); // 給 Facebook 時間處理刪除

  // Continue with deletion logic (not shown in original code)
  
  
  

    } catch (err) {
      console.error(`❌ 錯誤：${err.message}`);
	  console.log(`✅ errorCount= ${errorCount} `);
    }
	deleted++;
	
  }

  console.log(`🎉 任務完成，已刪除 ${deleted} 筆貼文`);
  
  
}

autoDeletePosts(5, 2);