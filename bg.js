var urls = {
	get_date: 'http://rakuten.gaopan.xibao100.com/api/rakuten/get_keyword_traffic_recording_time'
};

/*chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(tab.id, {file: 'content.js'})
})*/


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	if(message[0] == 'get_keyword_already_save_date'){
		requestXibaoGetDate(message[1], function (resp) {
			sendResponse(resp);
		});
	}
	return true;
})


//request xibao get date
function requestXibaoGetDate(s_en_name, callback)
{
	var datas = {};
	let http = new XMLHttpRequest()
	let url = urls.get_date
	let params = 'shop_en_name=' + s_en_name
	http.open('POST', url, true)
	http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
	http.timeout = 1000 * 15
	http.ontimeout = callback
	http.onerror = callback
	http.onload = function()
	{
		if( http.readyState == 4 && http.status == 200 )
		{
			datas = JSON.parse(http.response);
			callback(datas);
		}
	}
	http.send(params)
}

// function onWebNav(details)
// {
// 	if (details.frameId === 0) {
// 		// Top-level frame
// 		chrome.pageAction.show(details.tabId);
// 	}
// }
// var filter = {
// 	url: [{
// 		urlContains: 'rdatatool.rms.rakuten.co.jp/access/'
// 	}]
// };

// chrome.webNavigation.onCommitted.addListener(onWebNav, filter);

// chrome.webNavigation.onHistoryStateUpdated.addListener(onWebNav, filter);