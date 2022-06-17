'use strict';

function injectScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.dataset.hilIgnore = '1';
    (document.head || document.documentElement).appendChild(script);
}

injectScript(chrome.runtime.getURL('content/inject.js'));
