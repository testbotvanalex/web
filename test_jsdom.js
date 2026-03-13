const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('/Users/botmatic/consturctror/constructor.html', 'utf8');

const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable"
});

const window = dom.window;
const document = window.document;

window.onerror = function (msg, src, ln, col, err) {
    console.error(`[JSDOM Error] ${msg}`);
};

setTimeout(() => {
    try {
        console.log("--- Testing Node Creation ---");
        // Simulated welcome node is already created in html script tag.
        let nodes = window.nodes;
        console.log(`Initial nodes count: ${nodes.length}`);

        console.log("--- Testing 'Buttons' block creation ---");
        window.createNode('buttons', 100, 100);
        console.log(`Nodes count after adding buttons node: ${nodes.length}`);
        let btnNode = nodes.find(n => n.type === 'buttons');

        console.log("--- Testing showProperties for buttons node ---");
        // Simulate click to select node
        const nodeEl = document.getElementById(btnNode.id);
        if (nodeEl) {
            const event = new window.MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: 110,
                clientY: 110
            });
            nodeEl.dispatchEvent(event);
        }

        console.log("--- Testing 'Add Button' inside properties ---");
        const addBtn = document.getElementById('addBtn');
        if (addBtn) {
            addBtn.click();
            console.log(`Buttons array length after click: ${btnNode.data.buttons.length}`);
        } else {
            console.error("addBtn not found in DOM.");
        }

        // Test remove button
        const removeBtns = document.querySelectorAll('.btn-remove');
        if (removeBtns.length > 0) {
            console.log("--- Testing 'Remove Button' inside properties ---");
            removeBtns[0].click();
            console.log(`Buttons array length after remove click: ${btnNode.data.buttons.length}`);
        }

    } catch (e) {
        console.error("Test execution failed:", e);
    }
}, 1000); // Wait for scripts to execute
