//krpano instance
var krpano = null;
//trace
var debug = false;
//is krpano loaded
var krpanoLoaded = false;
//is tour started
var isTourStarted = false;
//fullscreen object
var kolorFullscreen = null;
//browser detection
var kolorBrowserDetect = null;
//start z-index value
var kolorStartIndex = 4000;
//target url for cross domains application
var crossDomainTargetUrl = "";

if ( debug ) {
	if ( typeof(console) == 'undefined' ) {
		console = {log : function (text) {} };
	}
}

/* ======== FULLSCREEN STUFF ========================================== */

/**
 * @description Register Fullscreen on DOM ready.
 */
jQuery(document).ready(function() {
	//add browser detection
	kolorBrowserDetect = new ktools.BrowserDetect();
	kolorBrowserDetect.init();
	//kolorBrowserDetect.browser : Browser string
	//kolorBrowserDetect.version : Browser version
	//kolorBrowserDetect.OS : Platform OS
	
	//add fullscreen
	kolorFullscreen = new ktools.Fullscreen(document.getElementById("tourDIV"));
	kolorFullscreen.supportsFullscreen();
	//activate krpano fallback and update methods
	kolorFullscreen.setExternal({
		'enter': krPanoFullscreenEnter,
		'exit': krPanoFullscreenExit,
		'change': krpanoFullscreenChange,
		'resize': krPanoFullscreenResize
	});
});

/**
 * @function
 * @description Enter fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenEnter() {
	getKrPanoInstance().call("enterFullScreenFallback");
}

/**
 * @function
 * @description Exit fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenExit() {
	getKrPanoInstance().call("exitFullScreenFallback");
}

/**
 * @function
 * @description Launch method for krpano on fullscreen change event.
 * @param {Boolean} state If true enter fullscreen event, else exit fullscreen event.
 * @return {void}
 */
function krpanoFullscreenChange(state) {
	if(state){
		getKrPanoInstance().call("enterFullScreenChangeEvent");
	}else{
		getKrPanoInstance().call("exitFullScreenChangeEvent");
	}
}

/**
 * @function
 * @description Launch resize method for krpano correct resize.
 * @return {void}
 */
function krPanoFullscreenResize() {
	getKrPanoInstance().call("resizeFullScreenEvent");
}

/**
 * @function
 * @description Set fullscreen mode.
 * @param {String|Boolean} value The fullscreen status: 'true' for open or 'false' for close.
 * @return {void}
 */
function setFullscreen(value) {
	var state;
	if(typeof value == "string")
		state = (value.toLowerCase() == "true");
	else
		state = Boolean(value);

	if (kolorFullscreen) {
		if(state){
			kolorFullscreen.request();
		}else{
			kolorFullscreen.exit();
		}
	}
}

/* ========== DIALOG BETWEEN KRPANO/JS STUFF ================================= */

/**
 * @function
 * @description Get krpano instance.
 * @return {Object} krpano instance.
 */
function getKrPanoInstance() {
	if ( krpano == null ) {
		krpano = document.getElementById('krpanoSWFObject');
	}
	return krpano;
}

/**
 * @function
 * @description Call krpano function.
 * @param {String} fnName The krpano action name.
 * @param {*} Following parameters are passed to the krPano function
 * @return {void}
 */
function invokeKrFunction(fnName) {
	var args = [].slice.call(arguments, 1);
	var callString = fnName+'(';
	for(var i=0, ii=args.length; i<ii; i++)
	{
		callString += args[i];
		if(i != ii-1) { callString += ', '; }
	}
	callString += ');';
	getKrPanoInstance().call(callString);
}

/**
 * @function
 * @description Get krpano identifier value.
 * @param {String} identifier The qualifier.
 * @param {String} type The converting type. Can be: 'int', 'float', 'string', 'boolean', 'object'.
 * @return {Object}
 */
function getKrValue(identifier, type) {
	if ( typeof identifier == "undefined" ){
		return identifier;
	}
	
	if(getKrPanoInstance().get(identifier) == null) {
		return null;
	}

	switch ( type ) {
		case "int":
			return parseInt(getKrPanoInstance().get(identifier));
		case "float":
			return parseFloat(getKrPanoInstance().get(identifier));
		case "string":
			return String(getKrPanoInstance().get(identifier));
		case "bool":
			return Boolean(getKrPanoInstance().get(identifier) === 'true' || parseInt(getKrPanoInstance().get(identifier)) === 1 || getKrPanoInstance().get(identifier) === 'yes' || getKrPanoInstance().get(identifier) === 'on');
		default:
			return getKrPanoInstance().get(identifier);
	}
}

/**
 * @function
 * @description Invoke a function of a plugin engine.
 * @param {String} pluginName The name/id of the plugin.
 * @param {String} functionName The name of the function to invoke.
 * @param {Object[]} arguments Additional arguments will be passed to the invoked function as an array.
 * @return {Object}
 */
function invokePluginFunction(pluginName, functionName) {
	if ( debug ) {
		console.log("invokePluginFunction("+pluginName+", "+functionName+")");
	}
	
	var plugin = ktools.KolorPluginList.getInstance().getPlugin(pluginName);
	if (plugin == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin instance doesn't exist"); }
		return false;
	}
	var engine = plugin.getRegistered();
	if (engine == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin isn't registered"); }
		return false;
	}
	var restArgs = [].slice.call(arguments, 2);
	return engine[functionName](restArgs);
}

/**
 * @function
 * @description This function is called when krpano is ready.
 * The ready state of krpano is told by its event onready (in fact it's not fully ready, included XML are not necessarily loaded) 
 * @return {void}
 */
function eventKrpanoLoaded () {
	if ( debug ) {
		console.log('krpano is loaded');
	}
	
	if (krpanoLoaded) { return false; }
	
	ktools.I18N.getInstance().initLanguage('en', crossDomainTargetUrl+'CostaRicadata/CostaRica_messages_','.xml');
	krpanoLoaded = true;
	
	

	addKolorMenu('panoramaMenu');
}

/**
 * @function
 * @description This function is called when tour is started.
 * @return {void}
 */
function eventTourStarted () {
	if ( debug ) {
		console.log('tour is started');
	}
	
	isTourStarted = true;
}


/* ========= KOLOR PLUGINS SCRIPTS ============================== */
/**
 * @function
 * @description Add an instance of kolorMenu JS Engine, loads JS and CSS files then init and populate related plugin that's based on it.
 * @param {String} pPlugID The name of the plugin you want to give to the kolorBox instance. 
 * @return {void} 
 */
function addKolorMenu(pPlugID) 
{
	if(typeof ktools.KolorPluginList.getInstance().getPlugin(pPlugID) == "undefined")
	{
		var kolorMenuCSS = new ktools.CssStyle("KolorMenuCSS", crossDomainTargetUrl+"CostaRicadata/graphics/KolorMenu/kolorMenu.css");
		var kolorMenuJS = new ktools.Script("KolorMenuJS", crossDomainTargetUrl+"CostaRicadata/graphics/KolorMenu/KolorMenu.min.js", [], true);
		var kolorMenuPlugin = new ktools.KolorPlugin(pPlugID);
		kolorMenuPlugin.addScript(kolorMenuJS);
		kolorMenuPlugin.addCss(kolorMenuCSS);
		ktools.KolorPluginList.getInstance().addPlugin(kolorMenuPlugin.getPluginName(), kolorMenuPlugin, true);
	}
}

/**
 * @function
 * @description Create KolorMenu and/or display it if exists.
 * @param {String} pPlugID The name of the plugin you want to init and show.
 * @return {void} 
 */
function openKolorMenu(pPlugID)
{
	if(debug) { console.log("openKolorMenu "+pPlugID); }
	
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() || !ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() || typeof KolorMenu == "undefined"){
		createKolorMenu(pPlugID);
	} else {
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered().showKolorMenu();
	}
}

/**
 * @function
 * @description Init, populate and show the kolorMenu.
 * @param {String} pPlugID The name of the plugin you want to init and show.
 * @return {void} 
 */
function createKolorMenu(pPlugID)
{	
	if(debug) { console.log("createKolorMenu "+pPlugID); }

	//Check if the KolorMenu is loaded
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized()  || typeof KolorMenu == "undefined")
	{
		err = "KolorMenu JS or XML is not loaded !";
		if(debug){ console.log(err); }
		//If not loaded, retry in 100 ms
		setTimeout(function() { createKolorMenu(pPlugID); }, 100);
		return;
	}

	//Check if the KolorMenu is instantiate and registered with the ktools.Plugin Object
	//If not, instantiate the KolorMenu and register it.
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() == null)
	{
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).register(new KolorMenu(pPlugID, "panoDIV"));
	}
	
	//Get the registered instance of KolorMenu
	var kolorMenu = ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered();
	
	//If kolorMenu is not ready, populate datas
	if(!kolorMenu.isReady())
	{
		var kolorMenuOptions = [];
		
		//Build the Options data for the KolorMenu
		var optionLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].settings[0].option.count"));
	
		for(var i = 0; i < optionLength; i++)
		{
			if (getKrValue("ptplugin["+pPlugID+"].settings[0].option["+i+"].name","string") == 'zorder') {
				kolorMenuOptions[getKrValue("ptplugin["+pPlugID+"].settings[0].option["+i+"].name","string")] = kolorStartIndex + getKrValue("ptplugin["+pPlugID+"].settings[0].option["+i+"].value", getKrValue("ptplugin["+pPlugID+"].settings[0].option["+i+"].type", "string"));
			} else {
				kolorMenuOptions[getKrValue("ptplugin["+pPlugID+"].settings[0].option["+i+"].name","string")] = getKrValue("ptplugin["+pPlugID+"].settings[0].option["+i+"].value", getKrValue("ptplugin["+pPlugID+"].settings[0].option["+i+"].type", "string"));
			}
		}
		
		kolorMenu.setKolorMenuOptions(kolorMenuOptions);
		
		var groupLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata[0].group.count"));
		var group = null;
		
		var itemLength = 0;
		var item = null;
		
		var itemOptionsLength = 0;
		
		for(var j = 0; j < groupLength; j++)
		{
			group = new KolorMenuObject();
			group.setName(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].name","string"));
			if(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].titleID","string") !== '')
				group.setTitle(ktools.I18N.getInstance().getMessage(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].titleID","string")));
			group.setAction(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].action","string"));
			group.setThumbnail(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].thumbnail","string"));
			group.setSubMenu(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].subMenu","bool"));
			group.setCssClass(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].cssClass","string"));
			
			itemLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item.count"));
			
			for(var k = 0; k < itemLength; k++)
			{
				item = new KolorMenuObject();
				item.setName(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].name","string"));
				if(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].titleID","string") !== '')
					item.setTitle(ktools.I18N.getInstance().getMessage(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].titleID","string")));
				item.setAction(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].action","string"));
				item.setThumbnail(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].thumbnail","string"));
				item.setCssClass(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].cssClass","string"));
				item.setParent(group);
				
				//Build the Options data for the item
				itemOptionsLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].option.count"));
				for(var l = 0; l < itemOptionsLength; l++)
				{
					item.addOption(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].option["+l+"].name","string"), getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].option["+l+"].value", getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].item["+k+"].option["+l+"].type", "string")));
				}
				
				group.addChild(item);
			}
			
			groupOptionsLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].option.count"));
			for(var m = 0; m < groupOptionsLength; m++)
			{
				group.addOption(getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].option["+m+"].name","string"), getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].option["+m+"].value", getKrValue("ptplugin["+pPlugID+"].internaldata[0].group["+j+"].option["+m+"].type", "string")));
			}
			
			kolorMenu.addKolorMenuGroup(group);
		}
		
		//KolorMenu is now ready
		kolorMenu.setReady(true);
		//call ready statement for krpano script
		invokeKrFunction("kolorMenuJsReady-"+pPlugID);
		
		//Display the menu
		kolorMenu.openKolorMenu();
	}
}