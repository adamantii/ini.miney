'use strict';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse): boolean {
    const [ action, data ] = request;
    console.log(action, data);
    return false;
});
