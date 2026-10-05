import { test, expect } from '@playwright/test'
import { animationsSettled } from './helpers'

test.describe('Table responsive (RRU-140)', () => {
  test('no horizontal page overflow and horizontal scrollport exists at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/?path=/story/components-table--responsive')
    await animationsSettled(page)

    const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const pageClientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(pageScrollWidth).toBeLessThanOrEqual(pageClientWidth + 1)

    const tableWrapper = page.locator('.rr-table').first()
    await expect(tableWrapper).toBeVisible()
    const wrapperScrollWidth = await tableWrapper.evaluate((el) => el.scrollWidth)
    const wrapperClientWidth = await tableWrapper.evaluate((el) => el.clientWidth)
    expect(wrapperScrollWidth).toBeGreaterThan(wrapperClientWidth)
  })

  test('DataTable at 320px has no horizontal page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/?path=/story/components-datatable--responsive')
    await animationsSettled(page)

    const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const pageClientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(pageScrollWidth).toBeLessThanOrEqual(pageClientWidth + 1)
  })
})
