async function clickConfirmDelete(maxRetries = 3, timeout = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`ℹ️ 刪除嘗試 ${attempt}/${maxRetries}`);

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
      console.log('ℹ️ 找到目標元素:', target, '可點擊:', isElementClickable(target));
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

clickConfirmDelete();