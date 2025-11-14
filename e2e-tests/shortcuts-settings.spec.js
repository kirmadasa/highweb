const { test, expect } = require('@playwright/test');
const path = require('path');
const { chromium } = require('playwright');

test.describe('Keyboard Shortcuts Settings Tests', () => {
  let context;
  let page;

  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '../dist');
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox'
      ]
    });
    
    // Wait for extension to load
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should open shortcuts settings page from popup', async () => {
    // Get extension ID
    const targets = await context.pages();
    let extensionId = null;
    
    for (const target of targets) {
      if (target.url().includes('chrome-extension://')) {
        const url = new URL(target.url());
        extensionId = url.hostname;
        break;
      }
    }
    
    if (!extensionId) {
      // Try to get it from the background page
      const backgroundPage = context.backgroundPages()[0];
      if (backgroundPage) {
        const url = new URL(backgroundPage.url());
        extensionId = url.hostname;
      }
    }

    expect(extensionId).toBeTruthy();

    // Open popup
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    page = await context.newPage();
    await page.goto(popupUrl);
    await page.waitForLoadState('domcontentloaded');

    // Find and click the keyboard shortcuts button
    const shortcutsButton = page.locator('#keyboard-shortcuts');
    await expect(shortcutsButton).toBeVisible();
    
    // Click the button
    await shortcutsButton.click();
    
    // Wait for new page to open
    await page.waitForTimeout(1000);
    
    // Get all pages and find the shortcuts settings page
    const pages = context.pages();
    const settingsPage = pages.find(p => p.url().includes('shortcuts-settings.html'));
    
    expect(settingsPage).toBeTruthy();
    
    // Verify the settings page content
    await settingsPage.waitForLoadState('domcontentloaded');
    
    // Check for title
    const title = settingsPage.locator('h1');
    await expect(title).toBeVisible();
    
    // Check for shortcuts list
    const shortcutsList = settingsPage.locator('#shortcuts-list');
    await expect(shortcutsList).toBeVisible();
    
    // Check that shortcuts are displayed
    const shortcutItems = settingsPage.locator('.shortcut-item');
    const count = await shortcutItems.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify all 5 colors are shown
    expect(count).toBeGreaterThanOrEqual(5);
    
    // Check for back button
    const backButton = settingsPage.locator('#back-button');
    await expect(backButton).toBeVisible();
    
    await settingsPage.close();
  });

  test('should display current keyboard shortcuts', async () => {
    // Get extension ID
    const targets = await context.pages();
    let extensionId = null;
    
    for (const target of targets) {
      if (target.url().includes('chrome-extension://')) {
        const url = new URL(target.url());
        extensionId = url.hostname;
        break;
      }
    }
    
    if (!extensionId) {
      const backgroundPage = context.backgroundPages()[0];
      if (backgroundPage) {
        const url = new URL(backgroundPage.url());
        extensionId = url.hostname;
      }
    }

    expect(extensionId).toBeTruthy();

    // Open shortcuts settings page directly
    const settingsUrl = `chrome-extension://${extensionId}/shortcuts-settings.html`;
    const settingsPage = await context.newPage();
    await settingsPage.goto(settingsUrl);
    await settingsPage.waitForLoadState('domcontentloaded');
    
    // Wait for shortcuts to load
    await settingsPage.waitForTimeout(1000);
    
    // Check that shortcut values are populated
    const shortcutValues = settingsPage.locator('.shortcut-value');
    const valueCount = await shortcutValues.count();
    expect(valueCount).toBeGreaterThan(0);
    
    // Check for Chrome info box or Firefox info box
    const chromeInfo = settingsPage.locator('#chrome-info');
    const firefoxInfo = settingsPage.locator('#firefox-info');
    
    // At least one should be visible
    const chromeVisible = await chromeInfo.isVisible();
    const firefoxVisible = await firefoxInfo.isVisible();
    expect(chromeVisible || firefoxVisible).toBeTruthy();
    
    await settingsPage.close();
  });

  test('should have proper localization', async () => {
    // Get extension ID
    const backgroundPages = context.backgroundPages();
    let extensionId = null;
    
    if (backgroundPages.length > 0) {
      const url = new URL(backgroundPages[0].url());
      extensionId = url.hostname;
    } else {
      const pages = await context.pages();
      for (const p of pages) {
        if (p.url().includes('chrome-extension://')) {
          const url = new URL(p.url());
          extensionId = url.hostname;
          break;
        }
      }
    }

    expect(extensionId).toBeTruthy();

    // Open shortcuts settings page
    const settingsUrl = `chrome-extension://${extensionId}/shortcuts-settings.html`;
    const settingsPage = await context.newPage();
    await settingsPage.goto(settingsUrl);
    await settingsPage.waitForLoadState('domcontentloaded');
    
    // Check that title is not the placeholder
    const title = await settingsPage.locator('h1').textContent();
    expect(title).not.toContain('data-i18n');
    expect(title.length).toBeGreaterThan(0);
    
    // Check that description is localized
    const description = await settingsPage.locator('.description').textContent();
    expect(description).not.toContain('data-i18n');
    expect(description.length).toBeGreaterThan(0);
    
    await settingsPage.close();
  });
});
