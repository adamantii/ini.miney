'use strict';


function main() {
    const shakeDuration = 400;

    for (let bubble of document.querySelectorAll('.bubble-btn')) {
        let timeout: number;
        bubble.addEventListener('click', function () {
            bubble.classList.remove('bubble-shake');
            bubble.classList.add('bubble-shake');
            clearTimeout(timeout);
            timeout = setTimeout(() => bubble.classList.remove('bubble-shake'), shakeDuration);
        })
    }

    const btnOptions = document.getElementById('options');
    btnOptions.addEventListener('click', function () {
        setTimeout(function () {
            chrome.runtime.openOptionsPage();
            window.close();
        }, shakeDuration);
    });
}

main();
