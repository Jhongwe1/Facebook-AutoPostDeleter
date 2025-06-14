const delay = ms => new Promise(res => setTimeout(res, ms));
const DELETE_LABELS = ['刪除', 'Delete', 'Supprimer', 'Eliminar'];
const CONFIRM_LABELS = ['刪除', 'Delete', '確定', 'Confirm', '確認', 'OK', 'Yes', 'Continue', 'Delete post'];

async function waitForElement(getElementFn, timeout = 10000, interval = 300) {
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
  const ERROR_MESSAGE = '發生錯誤，請再試一次。';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`ℹ️ 刪除嘗試 ${attempt}/${maxRetries}`);

    // Target the confirm button or its parent container with updated selectors
    const confirmBtn = await waitForElement(() => {
      const elements = document.querySelectorAll('span.x1vvkbs, div[role="button"] span, div.x1ja2u2z span');
      const span = Array.from(elements).find(
        el => CONFIRM_LABELS.includes(el.innerText.trim()) && isElementClickable(el)
      );
      if (!span) return null;
      let target = span;
      let parent = span.closest('div[role="button"], div.x1ja2u2z, button');
      if (parent && isElementClickable(parent)) {
        target = parent;
      }
      return isElementClickable(target) ? target : null;
    }, 15000); // Increased timeout to 15s

    if (!confirmBtn) {
      console.warn('⚠️ 無法找到確認刪除按鈕');
      console.log('當前 DOM 結構:', document.querySelector('body').innerHTML.substring(0, 500));
      errorCount++;
      return false;
    }

    try {
      confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      console.log(`✅ 成功點擊「${confirmBtn.innerText.trim()}」按鈕`);

      // Handle potential privacy selector dialog
      const dialogHandled = await handlePrivacyDialog();
      if (!dialogHandled) {
        console.warn('⚠️ 無法處理隱私對話框');
        errorCount++;
        return false;
      }

      // Check for error message
      const errorElement = await waitForElement(() => {
        return Array.from(document.querySelectorAll('span')).find(
          el => el.innerText.trim() === ERROR_MESSAGE
        );
      }, 5000);

      if (errorElement) {
        console.warn(`⚠️ 刪除失敗: ${ERROR_MESSAGE}`);
        errorCount++;
        if (attempt < maxRetries) {
          console.log('ℹ️ 等待 2 秒後重試...');
          await delay(2000);
          continue;
        } else {
          console.error('❌ 達到最大重試次數，刪除失敗');
          return false;
        }
      }

      console.log('✅ 刪除成功，無錯誤訊息');
      return true;
    } catch (error) {
      console.error(`❌ 點擊按鈕失敗: ${error.message}`);
      errorCount++;
      return false;
    }
  }
}

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

async function waitForDialog(timeout = 10000) {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations, obs) => {
      const dialog = document.querySelector('div[role="dialog"], div.x1ja2u2z, div.x78zum5');
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

async function handlePrivacyDialog() {
  const dialog = await waitForDialog(10000);
  if (!dialog) {
    console.log('ℹ️ 無隱私對話框出現');
    return true;
  }

  const CONFIRM_TEXTS = [
    '確認', 'Confirm', '確定', 'OK', '完成', 'Done', '提交', 'Submit',
    '刪除', 'Delete', '是的', 'Yes', '繼續', 'Continue', '確定刪除', 'Confirm Delete'
  ];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const confirmOption = Array.from(
      dialog.querySelectorAll('span, button, div[role="button"], a, div.x1vvkbs, div.x1ja2u2z')
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
        errorCount++;
      }
    }

    console.log(`ℹ️ 嘗試 ${attempt}: 隱私對話框 DOM 結構:`, dialog.innerHTML.substring(0, 500));
    await delay(1000);
  }

  console.warn('⚠️ 無法找到隱私對話框確認按鈕，支援的文字:', CONFIRM_TEXTS);
  errorCount++;
  return false;
}

async function autoDeletePosts(limit = 100, scrollTimes = 3) {
  console.log("🔄 開始滾動頁面...");
  for (let i = 0; i < scrollTimes; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await delay(2000);
  }

  const iconElements = Array.from(document.querySelectorAll('i.x1b0d499.xep6ejk'));
  const menuButtons = iconElements
    .map(icon => icon.closest('div[role="button"], button, [tabindex]'))
    .filter(button => button !== null);

  console.log(`✅ 找到 ${menuButtons.length} 個貼文選單`);

  if (menuButtons.length === 0) {
    console.warn("⚠️ 沒有找到任何『⋯』選單，請檢查選擇器或語言");
    return;
  }

  for (let i = menuButtons.length - 2; i > 24 && i > menuButtons.length - 2 - limit; i--) {
    try {
      const menuBtn = menuButtons[i];
      menuBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(300);
      menuBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      console.log(`📝 展開選單...`);

      const deleteOption = await waitForElement(() => {
        return Array.from(document.querySelectorAll('div[role="menuitem"] span, span.x1vvkbs')).find(
          el => DELETE_LABELS.includes(el.innerText.trim())
        );
      }, 5000);

      if (!deleteOption) {
        console.warn("⚠️ 找不到刪除選項，跳過");
        errorCount++;
        continue;
      }

      const parentMenuItem = deleteOption.closest('div[role="menuitem"], div.x1ja2u2z');
      if (!parentMenuItem || !isElementClickable(parentMenuItem)) {
        console.warn("⚠️ 刪除選項不可見或無父級，跳過");
        errorCount++;
        continue;
      }

      parentMenuItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      console.log("🗑️ 點擊刪除");

      await delay(1000);
      const confirmed = await clickConfirmDelete();
      if (confirmed) {
        deleted++;
        console.log(`✅ 第 ${deleted} 筆貼文刪除成功`);
      } else {
        errorCount++;
      }

      await delay(2000);
    } catch (err) {
      console.error(`❌ 錯誤：${err.message}`);
      errorCount++;
    }
  }

  console.log(`🎉 任務完成，已刪除 ${deleted} 筆貼文，錯誤次數：${errorCount}`);
}

autoDeletePosts(100, 2);