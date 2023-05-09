tiddlycut.modules.tClip = (function () {
	

	
	var api = 
	{
		onLoad:onLoad,				getSectionNames:getSectionNames,	
		hasMode:hasMode,			loadSectionFromFile:loadSectionFromFile, 	
		setClipConfig:setClipConfig,	
		getModeBegining:getModeBegining,
		hasModeBegining:hasModeBegining	

	};
	var pref, tcBrowser,   defaults, browseris;

	function onLoad(browser) {
		browseris	= browser;
		pref	 	= tiddlycut.modules.pref;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		defaults	= tiddlycut.modules.defaults;
	}

	var sectionNames=[];
    
    var ClipConfig;
    
 	//overrides are for global contextmenu
	var self = {
		ClipConfig:ClipConfig
	}
//////////public section/////////////////////
	function loadActiveSectionCategories(table, sectionName,id) {
		var categoryRows = table.split("\n");
		var cat = {};
		var tagsAndModes;
		var pieces;
		setMenu(sectionName,id);
		for (var i=0; i<categoryRows.length; i++) {
			cat = {rules:null,valid:true};
			pieces = categoryRows[i].split("|");// form |Category|Tip|Tags|Rules Tid|Modes|
			if (pieces.length==1) continue; //ingore blanklines
			if (pieces.length < 5) {alert('config table format error no of row incorrect'); return;}
			if (pieces[1].substring(0,1)==='!') continue; //first row is column headings
			var catName = pieces[1]; 
			if (pieces.length > 5) { //extension -remember that we expect a final blank piece and blank start piece;
                 cat.valid = true;
			} else return;//error
			
			cat.modes= extractModes(pieces[5]);
			cat.tags = pieces[3];
			cat.tip  = pieces[2];
			if (hasModeBegining(cat,"debug")) {
				debugcontrol(cat);
			} else {
				setSubMenu(cat,catName,sectionName,id);	
			}
			pref.addTags();
		} 
		return;
	}
	function setSubMenu(cat,catname,sectionName,id)  {
			chrome.contextMenus.create(
				{
					"id":catname+"::"+cat.modes.join("::"),
					"title" : catname,
					parentId: id+"::"+sectionName,
					"contexts":["all"]
				}
			);
	}
	
	function setMenu(sectionName,id)  {
			chrome.contextMenus.create(
				{
					"id":id+"::"+sectionName,
					"title" : sectionName,
					"contexts":["all"]
				}
			);
	}
		function extractModes(tagString) {
		var modes =[], tList = tagString.split(' ');
		for (var i=0; i< tList.length; i++) {
			modes[i] = tList[i].trim();
		}
		return modes;
	}

	function hasMode (cat,mode) {
			if (!cat.modes) return false;
		for (var i=0; i< cat.modes.length;i++)
			if (mode === cat.modes[i]) return true;
		return false;
	}
	
	function hasModeBegining (cat,mode) {
			if (!cat.modes) return false;
		for (var i=0; i< cat.modes.length;i++)
			if (mode === cat.modes[i].substr(0,mode.length)) return true;
		return false;
	}
	function getModeBegining (cat,mode) {
			if (!cat.modes) return "";
		for (var i=0; i< cat.modes.length;i++)
			if (mode === cat.modes[i].substr(0,mode.length)) return cat.modes[i];
	}
//////////////////////////////////////		
	function defaultCategories() {
		var defaultcats  =defaults.getDefaultCategories();
		for (var i= 0; i< defaultcats.length; i++) {
			loadActiveSectionCategories(defaultcats[i]);
		}
	}
		

	function getSectionNames()	{ 
		return sectionNames;
	}

	function loadSectionFromFile(id) {
        sectionNames=['Default'];
        var sectionStrgs, catIsNotSet = true;

		var content = self.ClipConfig;//where all sections are defined
		if (content) {
			sectionStrgs = content.split('\n!'); //sections begin with a title, eg !mysection, followed by a table of categories
			//the ! has not be removed by the split in the case of the first section
			sectionStrgs[0] = sectionStrgs[0].substr(1);
			//remember all section names - used to allow the user to see sections and change which is active
			for (var  j =0; j< sectionStrgs.length;  j++) { 
				
				sectionNames[j] = sectionStrgs[j].split('\n')[0];//first line is name

					// assumes that '|' means there is a def table otherwise move to next sections def table
					//only load active categories
					loadActiveSectionCategories(sectionStrgs[j].replace(/(^\|)*\n/,''),sectionNames[j],id);//strip of section name from first line


						
			}	

		}else {
			defaultCategories();
			//alert("config tiddler not found");
		}
	}

////////private section///////////////

//  TODO ADD A LOG THAT IS ONLY WRITTEN WHEN SAVING THE TW
	function debugcontrol(cat) {
		if (hasMode(cat,"debugoff")) {
				tiddlycut.logoff =true;
		} 
	}

    function setClipConfig(Config){
			self.ClipConfig = Config;
			tiddlycut.log("setclipconfig ",self.ClipConfig);

	}
	
	function getFileStuff() {
        //BJ FIXME - remove redundent
		return true;
	}
	return api;
}());
