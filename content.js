

function displayError(){
	alert('Network or server error :-(')
	done()
}


var whiteSpaceRegExp = new RegExp(/\xa0|\u1680|\u180e|\u2000|\u2001|\u2002|\u2003|\u2004|\u2005|\u2006|\u2007|\u2008|\u2009|\u200a|\u202f|\u205f|\u3000/g)

var reportCombinationIndex = 0
var reportCombinationRetry = 0

var reports = {}
var reportCombinations = [], shop_en_name = '', last_upload_date = {};

// console.log('RUNNNNN')
$(document).ready(function () {
	//display block
	display_block();
	shop_en_name = document.getElementById('ratShopUrl').value.trim();
	var send_msg = ['get_keyword_already_save_date', shop_en_name];
	chrome.runtime.sendMessage(send_msg, function(resp){
		last_upload_date = resp;
		//display date last upload
		display_last_download_date(last_upload_date);
	});

});


//display last download date
function display_block() {
	$('body').children('table').eq(10).after('<div style="background: #FFF1DC;width: 350px;padding: 10px;">' +
		'<p style="margin-top: 0px;"><button class="click-to-download-csv" style="padding: 5px;">DOWNLOAD CSV</button></p>' +
		//'<p><b>Last update time</b></p>' +
		'<div id="last-upload-date"></div></div>');

	$('.click-to-download-csv').click(function () {
		filter_to_grap();
	});
}

function display_last_download_date(date_obj) {
	var html = '<table>' +
		'<tr><th>Monthly: </th><td>'+(date_obj.monthly ? date_obj.monthly : 'No downloads')+'</td></tr>' +
		'<tr><th>Weekly: </th><td>'+ (date_obj.weekly ? date_obj.weekly : 'No downloads') +'</td></tr>' +
		'<tr><th>Daily: </th><td>'+ (date_obj.daily ? date_obj.daily : 'No downloads') +'</td></tr></table>';
	$('#last-upload-date').html(html);
}

//过滤需要下载的数据
function filter_to_grap() {
	var task_queue = [];

	reportCombinations = getAvailableReportCombinations();
	if(reportCombinations.length > 0){
		for(var i=0; i < reportCombinations.length; i++){
			if(reportCombinations[i].period == 'month'){
				if(last_upload_date.hasOwnProperty('monthly') && last_upload_date.monthly
					&& +new Date(reportCombinations[i].date) < +new Date(last_upload_date.monthly)){
					continue;
				}
			}else if(reportCombinations[i].period == 'week'){
				if(last_upload_date.hasOwnProperty('weekly') && last_upload_date.weekly
					&& +new Date(reportCombinations[i].date) < +new Date(last_upload_date.weekly)){
					continue;
				}
			}else if(reportCombinations[i].period == 'day'){
				if(last_upload_date.hasOwnProperty('daily') && last_upload_date.daily
					&& +new Date(reportCombinations[i].date) < +new Date(last_upload_date.daily)){
					continue;
				}
			}
			task_queue.push(reportCombinations[i]);
		}
	}
	reportCombinations = task_queue;

	setupLoading()
	downloadAvailableReports()

	return;
}

function done(){
	document.body.style.overflow = 'auto'
	let el = document.getElementById('rakuten-report-merger')
	el.parentElement.removeChild(el)
}


function setupLoading()
{
	let css = `
	#rakuten-report-merger-spinner {
		margin: 200px auto 0;
		width: 140px;
		text-align: center;
	}
	#rakuten-report-merger-spinner > div {
		width: 36px;
		height: 36px;
		background-color: #fff;

		border-radius: 100%;
		display: inline-block;
		-webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
		animation: sk-bouncedelay 1.4s infinite ease-in-out both;
	}
	#rakuten-report-merger-bounce1 {
		-webkit-animation-delay: -0.32s;
		animation-delay: -0.32s;
	}
	#rakuten-report-merger-bounce2 {
		-webkit-animation-delay: -0.16s;
		animation-delay: -0.16s;
	}
	@-webkit-keyframes sk-bouncedelay {
		0%, 80%, 100% { -webkit-transform: scale(0) }
		40% { -webkit-transform: scale(1.0) }
	}
	@keyframes sk-bouncedelay {
		0%, 80%, 100% { 
			-webkit-transform: scale(0);
			transform: scale(0);
		} 40% { 
			-webkit-transform: scale(1.0);
			transform: scale(1.0);
		}
	}`;

	let html = `
	<div id="rakuten-report-merger" style="height:100%;overflow: hidden;display:!none;position:absolute;top:0;bottom:0;left:0;right:0;z-index:99999999;background: rgba(0,0,0,0.8);">
		<div id="rakuten-report-merger-spinner">
			<div id="rakuten-report-merger-bounce1"></div>
			<div id="rakuten-report-merger-bounce2"></div>
			<div id="rakuten-report-merger-bounce3"></div>
		</div>
		<div id="rakuten-report-merger-info" style="text-align:center;color:#fff"></div>
	</div>`;

	let head = document.head || document.getElementsByTagName('head')[0]
	let style = document.createElement('style')
	style.type = 'text/css'
	if( style.styleSheet ){
		style.styleSheet.cssText = css
	} else {
		style.appendChild(document.createTextNode(css))
	}
	head.appendChild(style)

	// console.log(1)

	let div = document.createElement('div')
	div.innerHTML = html
	let body = document.body || document.getElementsByTagName('body')[0]
	body.appendChild(div)


	window.scrollTo(0, 0)
	setTimeout(function(){
		window.scrollTo(0, 0)
	}, 1000)
	body.style.overflow = 'hidden'
}


function mergeReports()
{
	let header = ['Date', 'Keyword', 'PC', 'Mobile', 'Smartphone', 'Total', 'Rakuten', 'Other Sources'].join(',') + '\n'
	let monthly = [header]
	let weekly = [header]
	let daily = [header]

	let keys = Object.keys(reports)
	for(var i = 0; keys.length > i; i++)
	{
		let columns = reports[keys[i]]
		let row = [
			columns.date,
			'"'+columns.keyword+'"',
			columns['pc'],
			columns['mobile'],
			columns['smp'],
			(columns['pc'] + columns['mobile'] + columns['smp']),
			columns.rakuten,
			'"'+columns.otherSources+'"',
		].join(',') + '\n'
		
		if( columns.period === 'month' ){
			monthly.push(row)
		}
		else if( columns.period === 'week' ){
			weekly.push(row)
		}
		else if( columns.period === 'day' ){
			daily.push(row)
		}
	}

	let blob = new Blob([ '\ufeff'+monthly.join('') ], {type: 'text/csv;charset=UTF-8'})
	let a = document.querySelector('a')
	a.href = URL.createObjectURL(blob)
	a.download = '['+shop_en_name+']-monthly.csv'
	a.click()

	blob = new Blob([ '\ufeff'+weekly.join('') ], {type: 'text/csv;charset=UTF-8'})
	a.href = URL.createObjectURL(blob)
	a.download = '['+shop_en_name+']-weekly.csv'
	a.click()

	blob = new Blob([ '\ufeff'+daily.join('') ], {type: 'text/csv;charset=UTF-8'})
	a.href = URL.createObjectURL(blob)
	a.download = '['+shop_en_name+']-daily.csv'
	a.click()

	done()
}


function storeReport(combo, str)
{
	// return console.log('storeReport')

	let rows = str.split('\n')
	// console.log('- - - - - storeReport - - - - -')
	// console.log(combo)
	// console.log(rows)
	for(let i = 6; rows.length > i; i++)
	{
		rows[i] = rows[i].slice(1, -1)
		// console.log(rows[i])
		let columns = rows[i].split('","')

		let period = combo.period
		let date = combo.date
		let keyword = columns[0].replace(whiteSpaceRegExp, ' ')

		if( keyword.length === 0 ){
			continue
		}

		let device = combo.device
		let source = columns[1]
		let clicks = columns[2]

		let key = fnv1a([period, date, keyword].join(';')).toString(32)

		if( !reports[key] )
		{
			reports[key] = {
				pc: 0,
				mobile: 0,
				smp: 0,
				rakuten: 'no',
				otherSources: '',
				period: period,
				date: date,
				keyword: keyword
			}
		
			// reports[key].rakuten= 'no'
			// reports[key].otherSources= ''

			// reports[key].period = period
			// reports[key].date = date
			// reports[key].keyword = keyword
		}

		// console.log(key, source, reports[key])
		if( source == '楽天サーチ' ){
			reports[key].rakuten = 'yes'
		} else if( reports[key].otherSources.indexOf(source)==-1 ) {
			reports[key].otherSources += source + '; '
		}

		reports[key][device] = parseInt(clicks)
	}
}


function downloadAvailableReports()
{
	// console.log('downloadAvailableReports', reportCombinationIndex)
	//reportCombinations = reportCombinations.slice(0,5);
	
	document.getElementById('rakuten-report-merger-info').innerHTML = reportCombinationIndex+' / '+reportCombinations.length

	if( !reportCombinations[reportCombinationIndex] ){
		mergeReports()
		return
	}

	if( reportCombinationRetry > 10 ){
		displayError()
		return
	}

	if( reportCombinationRetry > 2 ){
		setTimeout(downloadAvailableReports, 1000 * reportCombinationIndex)
		return
	}

	let combo = reportCombinations[reportCombinationIndex]
	requestRakutenCSV(combo.string, function(ok)
	{
		if( ok=='skip' )
		{
			// no results or date error
			reportCombinationIndex++
			reportCombinationRetry = 0
			setTimeout(downloadAvailableReports, random(250, 750))
			return
		}
		else if( ok!=='ok' ){
			reportCombinationRetry++
			setTimeout(downloadAvailableReports, random(250, 750))
			return
		}

		downloadRakutenCSV(combo.device, function(ok, csv)
		{
			if( ok!=='ok' ){
				reportCombinationRetry++
				setTimeout(downloadAvailableReports, random(250, 750))
				return
			}

			storeReport(combo, csv)

			reportCombinationIndex++
			reportCombinationRetry = 0
			setTimeout(downloadAvailableReports, random(250, 750))
		})
	})
}


function requestRakutenCSV(comboStr, callback)
{
	// return callback('ok')
	let http = new XMLHttpRequest()
	let url = 'https://rdatatool.rms.rakuten.co.jp/access/'
	let params = 'owin=&evt=RT_P05_01' + comboStr
	http.open('POST', url, true)
	http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
	http.timeout = 1000 * 15
	http.ontimeout = callback
	http.onerror = callback
	http.onload = function()
	{
		if( http.readyState == 4 && http.status == 200 )
		{
			if( http.response.indexOf('件中')>-1 && http.response.indexOf('アクセス数の割合')>-1  ){
				callback('ok')
			} else {
				callback('skip')
			}
		}
	}
	http.send(params)
}


function downloadRakutenCSV(device, callback)
{
	// return callback('ok', 'str')
	let http = new XMLHttpRequest()
	let url = 'https://rdatatool.rms.rakuten.co.jp/access/?menu='+device+'&evt=RT_D01_02&category=RT_P05_01&chk='+random(1513000000, 1519999999)+'&owin='
	http.open('GET', url, true)
	http.setRequestHeader('charset', 'Shift_JIS')
	http.setRequestHeader('Content-type', 'text/plain')
	http.timeout = 1000 * 15
	http.ontimeout = callback
	http.onerror = callback
	http.responseType = 'arraybuffer'
	http.onreadystatechange = function()
	{
		if( http.readyState == 4 && http.status == 200 )
		{
			let sjisArray = new Uint8Array(http.response)
			let unicodeString = Encoding.convert(sjisArray, {to: 'UNICODE', from: 'SJIS', type: 'string'})
			callback('ok', unicodeString)
		}
	}
	http.send()
}


function permutateAvailableReports(form, period, a, b, c)
{
	let devices = ['pc', 'mobile', 'smp']
	let result = []

	// console.log(form, document, document.forms)

	form = document.forms[form]

	for(let di = 0; devices.length > di; di++)
	{
		let device = devices[di]
		for(let ai = 0; form[a].options.length > ai; ai++)
		{
			let year = form[a].options[ai].value
			let A = '&menu='+device+'&type='+period+'&'+a+'='+year

			for(let bi = 0; form[b].options.length > bi; bi++)
			{
				let month = form[b].options[bi].value
				let B = A + '&'+b+'='+month

				if( month.length === 4 ){
					month = '/'+month.slice(0, 2) + '/' + month.slice(2 + Math.abs(0))
				} else {
					month = '/'+month+'/'
					if( !c ) month = month+1
				}

				if( !c )
				{
					result.push({
						period: period,
						date: year+month,
						device: devices[di],
						string: B
					})
				}
				else
				{
					for(let ci = 0; form[c].options.length > ci; ci++)
					{
						let day = form[c].options[ci].value
						let C = B + '&'+c+'='+day
						
						result.push({
							period: period,
							date: year+month+day,
							device: devices[di],
							string: C
						})
					}
				}
			}
		}
	}

	let month = 1000 * 60 * 60 *24 * 30
	let now = +new Date()
	let finelResult = []
	for(var i = 0; result.length > i; i++)
	{
		if( +new Date(result[i].date) > now ){continue}
		else if( result[i].period == 'day' && now-month * 2.75 > +new Date(result[i].date) ){continue}
		else if( result[i].period == 'week' && now-month * 7.50 > +new Date(result[i].date) ){continue}
		else if( result[i].period == 'month' && now-month * 24.25 >+new Date(result[i].date) ){continue}

		finelResult.push( result[i] )
	}

	return finelResult
}


function getAvailableReportCombinations()
{
	 let arr = [].concat(
		permutateAvailableReports('select_day', 'day', 'y', 'm', 'd'),
		permutateAvailableReports('select_week', 'week', 'y', 'w'),
		permutateAvailableReports('select_month', 'month', 'y', 'm')
	)

	function compare(a, b)
	{
		if( +new Date(a.date) < +new Date(b.date) )
			return -1
		if( +new Date(a.date) > +new Date(b.date) )
			return 1
		
		return 0
	}

	arr.sort(compare)

	return arr
}

function random(min, max){
	return Math.floor(Math.random() * (max-min+1)+min);
}

function fnv1a(s)
{
    var h = 0x811c9dc5

    for (var i = 0, l = s.length; i < l; i++) {
        h ^= s.charCodeAt(i)
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
    }

    return h >>> 0
}

