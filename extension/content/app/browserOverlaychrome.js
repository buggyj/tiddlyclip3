if (!tiddlycut)
	var tiddlycut = {};
if (!tiddlycut.modules)
	tiddlycut.modules = {};
	
tiddlycut.log=console.log;	
	
function changedtab (tabId,changeInfo) {
	if (tabId !==tiddlycut.id) return;
	 chrome.contextMenus.removeAll(function() {		
			chrome.contextMenus.create(
				{
					"id":"dock",
					"title" : "dock here",
					"contexts":["all"]
				}
			);
		});
	tiddlycut.log(tabId, "tab has closed or reloaded")
};
chrome.tabs.onRemoved.addListener(changedtab);
chrome.tabs.onUpdated.addListener(changedtab);

tiddlycut.id = null;
	
console.log ("starting");	
chrome.runtime.onInstalled.addListener(function(details){console.log ("oninstall "+details.reason)
    if(details.reason == "install" ||details.reason == "update"){ 
  chrome.windows.getAll({'populate': true}, function(windows) {
    for (var i = 0; i < windows.length; i++) {
      var tabs = windows[i].tabs;
      for (var j = 0; j < tabs.length; j++) {
            tiddlycut.log ("loadcs "+j);
            var urlparts = tabs[j].url.split('://');
            if (urlparts.length > 1 && urlparts[0] === "chrome") break;
            try { 
                chrome.scripting.executeScript(
                    { 
					target: {tabId: tabs[j].id, allFrames: false},
					files: ['content/util/logsimple.js']
					});
                chrome.scripting.executeScript(
					{ 
					target: {tabId: tabs[j].id, allFrames: false},
					files: ['content/contentScript.js']
					});
            }
            catch (err) {console.log ("cs refused at url "+tabs[j].url)};
        }
    }
  });
 }});



tiddlycut.modules.browserOverlay = (function ()
{
	var adaptions = {};
	var api = 
	{
		onLoad:onLoad, adaptions:adaptions, pushData:pushData
	}
	var currentsection=0;
		
	
	var filechoiceclip = 0, tabtot = 0;
	
	var resetflags, resettags;
	
	
	var tClip, tcBrowser, pref;
	var docu, browseris;
	function onLoad(browser, doc) {
		browseris 	= browser;
		docu 		= doc;	
		tClip		= tiddlycut.modules.tClip;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		pref	 	= tiddlycut.modules.pref;
		tiddlerAPI	=tiddlycut.modules.tiddlerAPI;
		pageData	= tiddlycut.modules.pageData;	
		function menucallback(info, tab)	{
			var catAndModes, idAndSection;
			if (info.menuItemId == "dock") {
				dock(info, tab);
				return;
			}
			catAndModes = info.menuItemId.split("::");
			idAndSection = info.parentMenuItemId.split("::");
			
			var cat=catAndModes.shift();
		 	pushData(cat ,info, tab, idAndSection[0], idAndSection[1], catAndModes ); 
		} 

		function dock(info, tab) {
			tiddlycut.log("item dock " + info.menuItemId + " was clicked " +tab.id);
			chrome.tabs.sendMessage(tab.id, 
			{
				action : 'actiondock', data:{opttid:pref.Get("ConfigOptsTiddler")}
			}, function (source)
			{			
				if (!source) {
					console.log("an error occured that suggests that you need to check the 'allow access to fileurl' option");
					//alert ("an error occured that suggests that you need to check the 'allow access to fileurl' option - see chrome://extensions/");
					return;
				}				
				if (!source.title) return;
				//the happens for classic - we read the tids dirrectly instead of requesting like in tw5
				//dockRegister(tab.id, source.url, source.config, source.title, source.opts);
				//console.log("item dock " + source.config);
			}
			);

		};//end dock
	    		
		chrome.contextMenus.onClicked.addListener(menucallback);
		//var id = chrome.contextMenus.create({"type" : "separator"});
//

		//execute any user definitions
		for (var method in api.adaptions) {

			api.adaptions[method]();
		}
		
    chrome.storage.local.set({'tags': {},'flags': {}}, function() {tiddlycut.log("bg: reset taglist")});
	}
	
	function hasMode (modes,mode) {
			if (!modes) return false;
		for (var i=0; i< modes.length;i++)
			if (mode === modes[i]) return true;
		return false;
	}
	
	function hasModeBegining (modes,mode) {
			if (!modes) return false;
		for (var i=0; i< modes.length;i++)
			if (mode === modes[i].substr(0,mode.length)) return true;
		return false;
	}
	function getModeBegining (modes,mode) {
			if (!modes) return "";
		for (var i=0; i< modes.length;i++)
			if (mode === modes[i].substr(0,mode.length)) return modes[i];
	}
	chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
		tiddlycut.log("tiddlyclipbg: got request: "+msg.action);
		if (msg.action == "dock") {
			dockRegister(sender.tab.id, msg.url, msg.txt, msg.extra, msg.aux, true );//redock true
			tiddlycut.log ("got dock")
		}
		else if (msg.action == "notify") {
			chrome.notifications.create({
				  "type": "basic",
				  "title": msg.txt,
				  "message": msg.aux,
				  "iconUrl":"../skin/clip48.png"
			});
			tiddlycut.log ("got notify"+msg.txt+"-"+msg.aux);
		}else if (msg.action == "bgbeep") {
			new Audio(chrome.extension.getURL('beep.mp3')).play();
			tiddlycut.log ("got bgbeep");
		}
		else {
			chrome.tabs.query({
				active: true,
				currentWindow: true
				}, function(tabs) {
					tiddlycut.log("going to send "+msg.action+"  request");
					var tab = tabs[0];
					chrome.tabs.sendMessage(tab.id,
					msg, 
					function (source){});
					tiddlycut.log("sent "+msg.action+" request");
				}
			);
			return;
		}
	});
    
    function checkduplicate(tabs, tabId, url, active){
        for(let tab of tabs){
            if(url == tab.url && tab.id != tabId){
                chrome.windows.update(tab.windowId, {focused:true});
                chrome.tabs.update(tab.id,{active:active});
                chrome.tabs.remove(tabId);
            }
        }
    }

	function setSelectModes(){
		tcBrowser.setOnImage();
		tcBrowser.setOnLink();
		tcBrowser.setImageURL();		
	}	

	function currentSelectModes() {
		var curModes = [];
		if (tcBrowser.hasSelectedText())curModes.push(tClip.SELECTMODES.Text);
		if (tcBrowser.hasCopiedText()) 	curModes.push(tClip.SELECTMODES.Clip);
		if (tcBrowser.onImage()) 		curModes.push(tClip.SELECTMODES.Image);
		if (tcBrowser.onLink())			curModes.push(tClip.SELECTMODES.Link);	
		if (tcBrowser.isTiddlyWikiClassic()) curModes.push(tClip.SELECTMODES.TWC);	
			//alert(curModes);
		return 	curModes;
	}

	
	function sendsysmsg  (tab, section, cat, data) {
		var sdata = {data:data};
		chrome.tabs.sendMessage(tab,
		{ action: 'paste', data:{category:cat, pageData:JSON.stringify(sdata),currentsection:section}});
	}
	
	
	function changeFileNew(config, id) {
		
		tiddlycut.id = id;

		tClip.setClipConfig(config);
		chrome.contextMenus.removeAll(function() {		

		});
		chrome.contextMenus.create(
			{
				"id":"dock",
				"title" : "dock here:",
				"contexts":["all"]
			}
		);
		tClip.loadSectionFromFile(id); //load default section

		
	}



	function dockRegister(id, url, config, title, optid, redock) {
		//ignore duplicate docks
		var tot = tabtot, filechoiceclipold = filechoiceclip, redock = redock;

		var configtid =new tiddlerAPI.Tiddler(config);
		var opts=new tiddlerAPI.Tiddler(optid).body;
		//BJ gurumeditation - handle opts!
		//BJ gurumeditation - copy tags from config into opts with a default 'apply' (ticked)
		if (config != null) {
			tiddlycut.log("--config-- ok");
		}
		else {
			tiddlycut.log("--config-- null");
			return;
		}
		pref.loadOpts(opts);

	    changeFileNew(configtid.body, id);	    

	};
	function injectMessageBox(doc) {
		// Inject the message box
		var messageBox = doc.getElementById("tiddlyclip-message-box");
		if(!messageBox) {
			messageBox = doc.createElement("div");
			messageBox.id = "tiddlyclip-message-box";
			messageBox.style.display = "none";
			doc.body.appendChild(messageBox);
		}
	};
	function makepercent (value) {
		if(/^[0-9][0-9]$/.test(value)) {
			return Number(value)/100;
		}
		return NaN;
	}
	
	
	function bjSendMessage  (tabid,params,callback)	{	
		chrome.tabs.sendMessage(tabid, params, function (source) { 
			if(chrome.runtime.lastError || !source)  {
                //Failed to send 
                tiddlycut.log("SEND REQUEST FAIL for tab");
                chrome.tabs.query({
					active: true,
					currentWindow: true
					}, function(tabs) {
						var tab = tabs[0], source = { url:tab.url, tids:null, title:tab.title, 
							twc:false, tw5:false,response:null};
						
						callback(source);
					}
				);
            }
            else callback(source);
		});	
	}
	
	function pushData(category, info, tab, id, section, modes) 
	{
		var promptindex;
		tiddlycut.log(modes);
		tcBrowser.setDataFromBrowser(info, tab); //enter data from chrome menu onclick;
		//request data from content script
		//execute any user defined extensions
		if (hasModeBegining(modes,"user") )  { 
		    promptindex =getModeBegining(modes,"user").split("user")[1];
		} else promptindex = null;
		var currentCat=category; //remember here for returning callback to pick it up
		tiddlycut.log("inpusdata id",tab.id);
		
		//-----highlight control------
		if (hasModeBegining(modes,"highlight") ) {			
			chrome.tabs.sendMessage(tab.id, {action : 'highlight'}, function (source){});
			tiddlycut.log("sent hlight request");
			return;
		}

		//-----select control------
		if (hasModeBegining(modes,"select") ) {			
			chrome.tabs.sendMessage(tab.id, {action : 'select'}, function (source){});
			tiddlycut.log("sent select request");
			return;
		}
		//-----cptext control------
		if (hasModeBegining(modes,"cptext") ) {			
			chrome.storage.local.set({'cptext': info.selectionText}, function() {tiddlycut.log("bg: add cptext")});
			return;
		}
		//-----text2note control------
		if (hasModeBegining(modes,"text2note") ) {
			chrome.storage.local.get("notepad", function(items){
                var text = ((items.notepad!=null) && (items.notepad!=""))?items.notepad + "\n\n":"";
				chrome.storage.local.set({'notepad': text + info.selectionText}, function() {tiddlycut.log("bg: add text2note")});
			})
			return;
		}
		//-----xhairs------
		if (hasMode(modes,"xhairs") ) {			
			chrome.tabs.sendMessage(tab.id,	{action : 'xhairsOn'}, function (source){});
			tiddlycut.log("sent xhairs request");
			return;
		}
		
		if (!hasMode(modes,"tiddlers") ) {
			if (hasModeBegining(modes,"snap") )  { 
				//if any text is selected temporarly remove this while making the snap
				/*var range, sel = content.getSelection();
				try{
					if (sel.getRangeAt) {
						range = sel.getRangeAt(0);
					}
					if (range) {
						sel.removeAllRanges();
					} 
				} catch(e) {range=null;} */
				//------make the snap--------
				var size=makepercent(getModeBegining(modes,"snap").split("snap")[1]);
				if (isNaN(size)) size =1;
				
					bjSendMessage(tab.id,
						{
							action : 'cut', prompt:(promptindex?pref.Get(promptindex):null)
						}, function (source)
						{ 
							tcBrowser.setFromClipboard(source.html, function (results) {
								var coords  = source.coords||{x0:null,y0:null,wdt:null,ht:null};
								for (var i = 0; i < results.length; i++) tcBrowser[results[i].fn](results[i].val);
								tcBrowser.setDatafromCS( source.url, source.title, source.twc, source.tw5, source.response, source.coords); //add data to tcbrowser object -retrived later
								
								
								tcBrowser.snap(size,tab.id, coords.x0, coords.y0, coords.wdt, coords.ht, function (dataURL) { 
									chrome.tabs.sendMessage(tab.id, {action : 'restorescreen'}, 
									function (source) { 
										tcBrowser.setSnapImage(dataURL);
										chrome.storage.local.get({tags:{},flags:{},cptext:''}, function(items){
											tcBrowser.setExtraTags(items.tags,items.flags,items.cptext);
											if (hasMode(modes,"note") ) {
												chrome.storage.local.get("notepad", function(items){
													tcBrowser.setNote(items.notepad);
													GoChrome(currentCat, null, tab.id, id, section, modes);
													chrome.storage.local.set({'notepad': ""}, function() {tiddlycut.log("bg: rm note")});
												});
											} else {
												GoChrome(currentCat, null, tab.id, id, section, modes);
											}
											chrome.storage.local.get({resettags:{},resetflags:{}}, function(items){
												chrome.storage.local.set({'tags': items.resettags,'flags': items.resetflags, cptext:null}, function() {tiddlycut.log("bg: reset tags etc")});
											});
										});
									});
								});
							})
						}
					);
					
				
				//re-apply selected text (if any)
				/*if (range) {
					sel.addRange(range);
				} 
				*/
				return;
			}	
			bjSendMessage(tab.id,
				{
					action : 'cut',prompt:(promptindex?pref.Get(promptindex):null)
				}, function (source)
				{ 
					tiddlycut.log ("currentCat",currentCat,"tab.id",tab.id);
					tcBrowser.setSnapImage("");

					tcBrowser.setFromClipboard(source.html, function (results) {
						for (var i = 0; i < results.length; i++){ tcBrowser[results[i].fn](results[i].val)};
						tcBrowser.setDatafromCS( source.url, source.title, source.twc, source.tw5, source.response); //add data to tcbrowser object -retrived later			

						chrome.storage.local.get({tags:{},flags:{},cptext:''}, function(items){
							tcBrowser.setExtraTags(items.tags,items.flags,items.cptext);				     
							if (hasMode(modes,"note") ) {
								chrome.storage.local.get("notepad", function(items){
									tcBrowser.setNote(items.notepad);
									GoChrome(currentCat, null, tab.id, id, section, modes);
									chrome.storage.local.set({'notepad': null}, function() {tiddlycut.log("bg: rm note")});							
								});
							} else {
								GoChrome(currentCat, null, tab.id, id, section, modes);
							}
							chrome.storage.local.get({resettags:{},resetflags:{}}, function(items){
								chrome.storage.local.set({'tags': items.resettags,'flags': items.resetflags, cptext:null}, function() {tiddlycut.log("bg: reset tags etc")});
							});
						});
					});
				}
				
			);
		}
		else
			chrome.tabs.sendMessage(tab.id,
				{
					action : 'cutTid', prompt:(promptindex?pref.Get(promptindex):null)
				}, function (source)
				{
					tcBrowser.setDatafromCS( source.url, null, source.title, source.twc, source.tw5,source.response); //add data to tcbrowser object -retrived later
					tiddlycut.log ("cuttid reply tids",source.tids);
					if (hasMode(modes,"note") ) {
						chrome.storage.local.get("notepad", function(items){
							tcBrowser.setNote(items.notepad);
							GoChrome(currentCat, source.tids, tab.id, id, section, modes);
							chrome.storage.local.set({'notepad': null}, function() {tiddlycut.log("bg: rm note")});
						});
					} else {
						GoChrome(currentCat, source.tids, tab.id, id, section, modes);
					}
				}
			);
	}
	
	function GoChrome(category, tidlist, sourcetab, id, section, modes)
	{
		tiddlycut.log("go1");
		if (false == pageData.SetupVars(category,section,modes)) return; //sets mode - determines what is copied
				tiddlycut.log("go2");
		pageData.SetTidlist(tidlist);
				tiddlycut.log("go3");
		//send kick to content script
		tiddlycut.log("sending paste",id);
		chrome.tabs.sendMessage(1 * id,
		{ action: 'paste', data:{category:category, pageData:JSON.stringify(pageData),currentsection:currentsection}});
		tiddlycut.log("sent paste");	
	}

	function $(param) {
		return document.getElementById(param);
	}
	return api;
}());


// background script 
(function() {
		// calls module.onLoad() after the extension is loaded
	var i;
	for (i in tiddlycut.modules) {
		var module = tiddlycut.modules[i];
		if (typeof(module.onLoad) === 'function') {
			try {
				tiddlycut.log('onload  module ', i);
				module.onLoad("chrome",{});
			}
			catch (e) {

				tiddlycut.log('Error caught in module ', i, ':', e);
			}
		}
	}
})();
