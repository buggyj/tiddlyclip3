 tiddlycut.modules.pageData =(function ()
{
	var api = 
	{
		onLoad:onLoad,  					
		SetupVars:SetupVars,				
		SetTidlist:SetTidlist
	}
	var tClip, tcBrowser, tiddlerAPI, browseris;	
	function onLoad(browser) {
		browseris 	= browser;
		pref		= tiddlycut.modules.pref;
		tClip	 	= tiddlycut.modules.tClip;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		tiddlerAPI	= tiddlycut.modules.tiddlerAPI;

	}
	api.userExtensions = {};
	api.data = {};

	function SetTidlist(tidlist) {
		api.remoteTidArr=[];
		if (Array.isArray(tidlist)) {
			for (var i=0;i<tidlist.length;i++){
				api.remoteTidArr[i]= (new tiddlerAPI.Tiddler(tidlist[i])).EncodedDiv();
			}	
		}else {
			api.remoteTidArr[0]=(new tiddlerAPI.Tiddler(tidlist)).EncodedDiv();
			tiddlycut.log("remoteTidArr",api.remoteTidArr[0],"<---",tidlist);
		}
	}
	
	function makepercent (value) {
		if(/^[0-9][0-9]$/.test(value)) {
			return Number(value)/100;
		}
		return NaN;
	}

	function SetupVars(category,section, modes) {
		var i;
		tiddlycut.log("setupvars ",category);
		//expose parameters - used for userExtensions
		api.data ={"__remoteusage__":""};
		api.data.section  = section;
		api.data.category = category;
		api.data.pageTitle= tcBrowser.getPageTitle();//replaces  %PageTitle%
		api.data.pageRef =  tcBrowser.getPageRef();  //replaces  %PageRef%
		api.data.text = 	tcBrowser.getSelectedAsText()||"";
		api.data.clip = 	tcBrowser.getClipboardString()||"";
		api.data.cliphtml = tcBrowser.getClipboardHtml()||"";
		api.data.imageURL=	unescape(tcBrowser.getImageURL());
		api.data.largestImgURL=	unescape(tcBrowser.getLargestImgURL())||"";
		api.data.hasText=	(tcBrowser.hasSelectedText()).toString();
		api.data.clipText=	(tcBrowser.hasCopiedText()).toString();
		api.data.onImage =	(tcBrowser.onImage()).toString();
		api.data.onLink=	(tcBrowser.onLink()).toString();
		api.data.classic =	(tcBrowser.isTiddlyWikiClassic()).toString();
		api.data.linkURL =	unescape(tcBrowser.getlinkURL())||"";
		api.data.onLinkLocal=	(tcBrowser.onLinkLocal()).toString();		
		api.data.onLinkRemote=	(tcBrowser.onLinkRemote()).toString();
		api.data.tw5 =		(tcBrowser.isTiddlyWiki5()).toString();
		api.data.snap = tcBrowser.getSnapImage();
		api.data.clipsnap = tcBrowser.getCBImage();
		api.data.note = tcBrowser.getNote();
		api.data.mediaImage = tcBrowser.getMediaImage();
		api.data.description = tcBrowser.getDescription();
		
		if (tcBrowser.getExtraTags()) api.data.extraTags = tcBrowser.getExtraTags();
		api.data.cptext = tcBrowser.getcptext();
		var extraFlags = tcBrowser.getExtraFlags();	
		for (var ii in extraFlags) {
			api.data[ii] = extraFlags[ii]?"true":"false";
		}
		var locale = api.data.pageRef.split('/');
			locale.length--;
			locale = locale.join('/');
		var styles=false;
		var safety=false;

		if (tClip.hasMode(modes,"dirty") ) safety = false;
		api.data.web  = tcBrowser.getSelectedAsHtml(safety);

		// these are the structures for hold an array of tiddlers from a remote tw
		// that are to to be pasted into the local tw
		api.data.remoteTidTags = '';
		api.data.remoteTidText = '';
		api.data.remoteTidTitle = '';
		
		api.remoteTidArr  = [''];

		api.remoteTidIndex = 0;
        //////////end of remote data struct //////////////////
        
		//execute any user defined extensions
		/* update for ff57 */
		if (tClip.hasModeBegining(modes,"user") )  { 
		    var userString = {value:''};
		    var promptindex =tClip.getModeBegining(modes,"user").split("user")[1];
			//tcBrowser.UserInputDialog(pref.Get(promptindex),userString);
			api.data["user"+promptindex]=tcBrowser.getusrstring();
		}
		
		for (var userExtends in api.userExtensions) {

			api.userExtensions[userExtends]();
		}	
		return true;//no error
	}//end func


	return api;
}());

	 
