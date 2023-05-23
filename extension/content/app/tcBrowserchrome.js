tiddlycut.modules.tcBrowser= (function () {

	var api = 
	{
		onLoad:onLoad, 						getSelectedAsText:getSelectedAsText, 	
		getClipboardString:getClipboardString, 	
		getHtml:getHtml, 					hasCopiedText:hasCopiedText, 			hasSelectedText:hasSelectedText, 		
		getPageTitle:getPageTitle, 			getPageRef:getPageRef, 					snap:snap,
		getImageURL:getImageURL,			getLargestImgURL:getLargestImgURL,		winWrapper:winWrapper,
	    log:log,							htmlEncode:htmlEncode,					onImage:onImage,
	    onLink:onLink,						setSnapImage:setSnapImage,			setHtml:setHtml,
	    getSelectedAsHtml:getSelectedAsHtml,createDiv:createDiv,				getSnapImage:getSnapImage,
	    setDatafromCS:setDatafromCS,		UserInputDialog:UserInputDialog,	setDataFromBrowser:setDataFromBrowser,
		getlinkURL:getlinkURL,				onLinkLocal:onLinkLocal,			onLinkRemote:onLinkRemote,
		isTiddlyWikiClassic:isTiddlyWikiClassic, isTiddlyWiki5:isTiddlyWiki5,	getusrstring: getusrstring,
		getNote:getNote,					setNote:setNote,					getExtraTags:getExtraTags,
		setExtraTags:setExtraTags,			getExtraFlags:getExtraFlags,		setClipboardString:setClipboardString,
		getcptext:getcptext,				setCBImage:setCBImage,				getCBImage:getCBImage,
		setClipboardHtml:setClipboardHtml,	getClipboardHtml:getClipboardHtml,  setFromClipboard:setFromClipboard,
		setSelectedHtml:setSelectedHtml,	getMediaImage:getMediaImage,		getDescription:getDescription
	}

    var convert;
    var _strings_bundle_default;
    var thechrome, browseris;
    

	function onLoad(browser, doc) {
		browseris 	= browser;
		thechrome=doc;
		tiddlycut.log("browerstartup");
		
		const offscreenDocumentPath ="content/background.html";


		(async function (path) {
			// Check all windows controlled by the service worker to see if one 
			// of them is the offscreen document with the given path
			const matchedClients = await clients.matchAll();
			for (const client of matchedClients) {
				if (client.url === path) {
				  return true;
				}
			}
			await chrome.offscreen.createDocument({
			  url: path,
			  reasons: ['CLIPBOARD'],
			  justification: 'testing'
			}).then(()=>{		
				chrome.contextMenus.removeAll(function() {
				
					chrome.contextMenus.create({
							"id":"dock",
							"title" : "dock here",
							"contexts":["all"]
						}
					);
				});
				chrome.storage.local.set({'tags': {},'flags': {},'docklist':[]}, function() {tiddlycut.log("bg: reset tags etc")});
			}).catch(error => console.log(error));
		})(offscreenDocumentPath);

	}
	
	function winWrapper (where) {
		return thechrome; //BJ FIXME not sure if this is correct		
	}
    //variables to store non-persistance broswer data  - set by call otherwise
    var onImage=false, onLink=false, image, linkUrl, selectionText, url, html ,title,clipBoardString,clipBoardHtml, 
		twc=false, snapImage = "",CBImage = "", usrstring = null, note= null, extraTags = "",extraFlags = [], 
		description="", mediaImage="", cptext = null;

    
	function snap(size,sourcetab,xx0,yy0,wdt,ht,callback){ //async in chrome
		tiddlycut.log("enter snap")
		chrome.tabs.get(sourcetab, function(tab){
			
			chrome.tabs.getZoom( function (zoomed){
				var h = ht*zoomed||tab.height, w = wdt*zoomed||tab.width, x0 = xx0*zoomed||0, y0 = yy0*zoomed||0;
				tiddlycut.log("enter getzoom ");
				
				chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100},  async function(dataURI) {
					if (dataURI) {
						var reDateaURI;
						reDateaURI = await chrome.runtime.sendMessage({
							action: "CropImage",
							image: dataURI,
							h:h, w:w, x0:x0, y0:y0, size:size
						});
						callback(reDateaURI);
					}
				});	
			})     	
		});
}


	 async function setFromClipboard(html, callback) {
		var results = [];
		
		setClipboardString("");
		setCBImage("");
		setClipboardHtml("");	
		results =   chrome.runtime.sendMessage({action: "ClipBoardRead", html:html}, callback);	
		
	}	
		

	
	 async function setSelectedHtml(html, callback) {
		var results = [];
		
		setClipboardHtml("");	
		results =   chrome.runtime.sendMessage({action: "html", html:html}, callback);	
		
	}		
		



    function setDataFromBrowser(info, tab) {
		onImage = (info.mediaType==="image");
		if (onImage)	imageUrl = info.srcUrl;
		else 	imageUrl ='';
		linkUrl =info.linkUrl;
		onLink = (!!linkUrl);
		selectionText=info.selectionText;
	};	
	function setDatafromCS( aurl, atitle, atwc, atw5, ausrstring, adescription, amediaImage) {
		title =atitle;
		url = aurl;
		twc = atwc; 
		tw5 = atw5;
		usrstring = ausrstring;
		description = adescription;
		mediaImage = amediaImage;
	}
	function getMediaImage() {
		return mediaImage;
	}
	function getDescription() {
		return description;
	}
	function getImageURL() {
		return imageUrl;
	}
	function getCBImage() {
		var img = CBImage;
		return img;
	}
	function setCBImage(img) {
		
		CBImage = img;
	}
	function getSnapImage() {
		var img = snapImage;
		return img;
	}
	function setSnapImage(img) { 		
		snapImage = img;
	}
	function getLargestImgURL() {
		return '';
	}
	function onImage(){
		return onImage;
	}

	function onLink(){
		return onLink;
	}
	function getSelectedAsText()
	{
     return selectionText;
	}

	// Remove certain characters from strings so that they don't interfere with tiddlyLink wikification.
	function tiddlyLinkEncode(str) {
		str = str.replace("|",":","gi");
		str = str.replace("[[","(","gi");
		str = str.replace("]]",")","gi");
		return str;
	}

    function createDiv(){
		return document.createElement("div");
	}
	function setClipboardString(text){
		clipBoardString=text;
	}		
	function getClipboardString()
	{	
		return clipBoardString||"";
	}
	function setClipboardHtml(text){
		clipBoardHtml=text;
	}		
	function getClipboardHtml()
	{	
		return clipBoardHtml||"";
	}
	function getPageTitle() {
		return tiddlyLinkEncode(title);
	}
	function getPageRef () {
		return  tiddlyLinkEncode(url); 
	}
	function getHtml()
	{
		return html;
	}
	function getusrstring()
	{
		return usrstring;
	}

	function getNote()
	{
		return note;
	}

	function setNote (data){
		if (!data) note = null;
		else note = data;
	}

	function getExtraTags()
	{
		return extraTags;
	}

	function getExtraFlags()
	{
		return extraFlags;
	}
	
	function getcptext()
	{
		return cptext;
	}
	
	function setExtraTags(tags,flags,cptxt)
	{
		var first = true,space =/ /;
		extraTags = "";
		for (var ii in tags) if (tags[ii]) {
			if (!first) extraTags += ' ';
			else first = false;
			//if (space.test(ii)) extraTags += '[['+ii+']]';
			//else 
			extraTags += ii;
		}
		first = true;
		space =/ /;
		extraFlags = {};
		for (var ii in flags) {
			extraFlags[ii] = flags[ii];
		}
		cptext = cptxt;
	}

	function hasCopiedText() {
		return getClipboardString().length > 0;
	}
	// Check if there is any selected text.
	function hasSelectedText(){
		try
			{
			var text = getSelectedAsText();
			if(text != null && text.length > 0)
				return true;
			}
		catch(err)
			{}
		return false;
	}
	
	function isTiddlyWikiClassic() {
		return twc;
	}
	function getlinkURL() {
		return linkUrl;
		return "";
	}
	function isTiddlyWiki5() {
		return tw5;
	}
		function onLinkLocal(){
		var local = /^file:/;
		return local.test(linkUrl);
		return false;
	}
	function onLinkRemote(){
		var local = /^file:/;
		return !local.test(linkUrl);
		return false;
	}
	function log(str){
		console.log("tc: "+sstr);
    }
    function htmlEncode(param)
	{
		return(param.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;"));
	}
	function setHtml(str){
		html = str;
    }	
	
	
	function getSelectedAsHtml(clean){
				return  html; //the getting of html is done by the content script asynchronously BUT sanitizing should be done here
	}
	
	function  UserInputDialog(prompt, response) {
						response.value = window.prompt(prompt);
	}
//function must go before     
	return api;
}());


