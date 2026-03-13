const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log(`[Browser Console]: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[Browser Error]: ${error.message}`));

    try {
        console.log("Navigating to constructor.html...");
        await page.goto('http://localhost:3200/constructor.html', { waitUntil: 'networkidle' });

        console.log("Attempting to drag 'Text Reply' block to canvas...");

        // Find the 'Text Reply' block in the sidebar
        const textBlock = await page.locator('.component-item[data-type="text"]');

        // Find the canvas
        const canvas = await page.locator('#canvas');

        // Get bounding boxes
        const sourceBox = await textBlock.boundingBox();
        const targetBox = await canvas.boundingBox();

        if (sourceBox && targetBox) {
            // Perform a drag-and-drop action
            await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
            await page.mouse.down();
            // Move to the center of the canvas
            await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
            await page.mouse.up();
            console.log("Drag-and-drop performed.");
        } else {
            console.error("Could not find source or target elements for drag-and-drop.");
        }

        console.log("Waiting for nodes to render...");
        await page.waitForTimeout(1000);

        // Check if a node was created
        const nodeCount = await page.locator('.node').count();
        console.log(`Number of nodes on canvas: ${nodeCount}`);

        console.log("Clicking 'Publish Flow' button...");
        await page.click('#saveFlow');

        console.log("Waiting for network activity...");
        await page.waitForTimeout(2000);

        console.log("Test completed.");

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await browser.close();
    }
})();
