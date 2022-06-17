'use strict';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const [ action, data ] = request;
    console.log(action, data)
});
