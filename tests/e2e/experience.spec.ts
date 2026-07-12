import { expect, test } from '@playwright/test'

test('shows privacy notice before requesting camera', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Guardian Heart' }),
  ).toBeVisible()
  await expect(
    page.getByText('카메라 영상은 이 브라우저 안에서만 처리됩니다.'),
  ).toBeVisible()
})

test('shows retry UI when camera permission is denied', async ({
  page,
  context,
}) => {
  await context.clearPermissions()
  await page.goto('/')
  await page.getByRole('button', { name: '카메라 시작' }).click()
  await expect(
    page.getByRole('button', { name: '카메라 다시 연결' }),
  ).toBeVisible()
})
