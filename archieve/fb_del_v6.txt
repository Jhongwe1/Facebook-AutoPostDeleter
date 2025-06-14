const DELETE_LABELS = ['刪除', 'Delete', 'Supprimer', 'Eliminar'];
const CONFIRM_LABELS = ['刪除', 'Delete', '確定', 'Confirm', 'Delete post'];
const ERROR_MESSAGE = '發生錯誤，請再試一次。';

// Utility: Create a delay
const delay = ms => new Promise(res => setTimeout(res, ms));


async function clickConfirmDelete(maxRetries = 3, timeout = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    //console.log(`ℹ️ 刪除嘗試 ${attempt}/${maxRetries}`);

    const confirmBtn = await waitForElement(() => {
      // Search for any span with "刪除" text, broaden beyond x1vvkbs
      const spans = document.querySelectorAll('span');
      const span = Array.from(spans).find(
        el => el.innerText.trim() === '刪除' && isElementVisible(el)
      );
      if (!span) {
        console.log('ℹ️ 未找到包含「刪除」的 span，檢查 modal 狀態');
        return null;
      }

      // Find the closest clickable parent
      let target = span;
      const parents = [
        span.closest('div[role="none"]'),
        span.closest('div.x1ja2u2z'),
        span.closest('div[role="dialog"] div')
      ].filter(p => p && isElementClickable(p));

      target = parents[0] || span;
      //console.log('ℹ️ 找到目標元素:', target, '可點擊:', isElementClickable(target));
      return isElementClickable(target) ? target : null;
    }, timeout);

    if (!confirmBtn) {
      console.warn('⚠️ 無法找到確認刪除按鈕');
      const modal = document.querySelector('div[role="dialog"]') || document.body;
      console.log('當前 Modal 或 Body 結構:', modal.innerHTML.substring(0, 300));
      if (attempt === maxRetries) {
        console.error('❌ 達到最大重試次數，無法找到按鈕');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
      continue;
    }

    try {
      // Simulate a robust click
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        composed: true
      });
      confirmBtn.dispatchEvent(clickEvent);
      console.log(`✅ 成功點擊「${confirmBtn.innerText.trim()}」按鈕`);
      return true;
    } catch (error) {
      console.error(`❌ 點擊按鈕失敗: ${error.message}`);
      if (attempt === maxRetries) {
        console.error('❌ 達到最大重試次數，點擊失敗');
        return false;
      }
    }
  }
  return false;
}

// Helper: Check if element is visible
function isElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0 &&
    element.offsetParent !== null
  );
}

// Helper: Check if element is clickable
function isElementClickable(element) {
  return isElementVisible(element) && element.matches(':not([disabled])');
}

// Helper: Wait for element to appear
async function waitForElement(selectorFn, timeout = 20000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = selectorFn();
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return null;
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

// Main function to auto-delete posts
async function autoDeletePosts(limit = 100, scrollTimes = 3,dly=500) {
  let errorCount = 0;
  let deleted = 0;

  // Scroll page to load posts
  console.log("🔄 開始滾動頁面...");
  for (let i = 0; i < scrollTimes; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await delay(2000);
  }

  // Find menu buttons
  const iconElements = Array.from(document.querySelectorAll('i.x1b0d499.xep6ejk'));
  const menuButtons = iconElements
    .map(icon => icon.closest('div[role="button"], button, [tabindex]'))
    .filter(button => button !== null);

  console.log(`✅ 找到 ${menuButtons.length} 個貼文選單`);

  if (menuButtons.length === 0) {
    console.warn("⚠️ 沒有找到任何『⋯』選單，請檢查選擇器或語言");
    return;
  }

  // Process posts in reverse order, respecting the limit
  for (let i = menuButtons.length - 2; i > 24 && i > menuButtons.length - 2 - limit; i--) {
    try {
      const menuBtn = menuButtons[i];
      menuBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(dly);
      menuBtn.click();
      console.log(`📝 展開選單...`);
	  await delay(dly);
		
      // Simulate click on delete option
      clickConfirmDelete();
      console.log("🗑️ 點擊刪除");
	  await delay(dly);
	  
	  clickConfirmDelete();
      console.log("確認刪除");
      await delay(dly); // Wait for deletion to process
	  
      deleted++;
    } catch (err) {
      console.error(`❌ 錯誤：${err.message}`);
      console.log(`✅ errorCount= ${errorCount}`);
      errorCount++;
    }
  }

  console.log(`🎉 任務完成，已嘗試刪除 ${deleted} 筆貼文`);
}

// Execute the script
autoDeletePosts(100, 3,50);