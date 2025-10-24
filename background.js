var scriptLastCall,
    _tab_ID,
    _realt,
    _runMode,
    api = "undefined" != typeof chrome ? chrome : browser;

// AI Provider Adapters for Smart Replies
class AIProviderManager {
    constructor() {
        this.dailyUsage = new Map();
    }
    
    async generateReply({ provider, model, apiKey, prompt, images }) {
        try {
            switch (provider) {
                case 'gemini':
                    return await this.callGeminiVision(apiKey, model, prompt, images);
                case 'mistral':
                    return images?.length ? 
                        await this.callMistralVision(apiKey, model, prompt, images) :
                        await this.callMistralText(apiKey, model, prompt);
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }
        } catch (error) {
            console.error('AI Generation error:', error);
            throw error;
        }
    }
    
    async callGeminiVision(key, model, prompt, images) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        
        const parts = [{ text: prompt }];
        if (images && images.length > 0) {
            images.forEach(b64 => {
                if (b64 && b64.includes(',')) {
                    const [header, data] = b64.split(',');
                    parts.push({
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: data
                        }
                    });
                }
            });
        }
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: parts
                }]
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
        }
        
        const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim();
        return text || "";
    }
    
    async callMistralText(key, model, prompt) {
        // Add request validation
        if (!key || key.length < 10) {
            throw new Error('Invalid Mistral API key format');
        }
        if (!prompt || prompt.trim().length === 0) {
            throw new Error('Prompt cannot be empty');
        }
        if (!model || model.trim().length === 0) {
            throw new Error('Model name cannot be empty');
        }

        console.log('Mistral API Request:', {
            model: model,
            promptLength: prompt.length,
            maxTokens: 300,
            temperature: 0.7
        });

        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: prompt }
                ],
                max_tokens: 300,  // Increased from 150
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        console.log('Mistral API Response:', {
            status: response.status,
            statusText: response.statusText,
            data: data
        });
        
        if (!response.ok) {
            console.error('Mistral API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                error: data,
                model: model,
                promptLength: prompt.length
            });
            
            // Provide more specific error messages based on status codes
            let errorMessage = `Mistral API error (${response.status}): `;
            if (data && data.error) {
                errorMessage += data.error.message || data.error.type || JSON.stringify(data.error);
            } else if (data && data.message) {
                errorMessage += data.message;
            } else {
                errorMessage += response.statusText || 'Unknown error';
            }
            
            throw new Error(errorMessage);
        }
        
        return data?.choices?.[0]?.message?.content?.trim() || "";
    }
    
    async callMistralVision(key, model, prompt, images) {
        // For now, fall back to text-only since Mistral vision API may differ
        // This can be updated when vision models are available
        console.warn('Mistral vision not yet implemented, falling back to text-only');
        return await this.callMistralText(key, model, prompt);
    }
    
    async testConnection({ provider, model, apiKey }) {
        try {
            const testPrompt = "Hello, this is a test message. Please respond with 'Connection successful'.";
            const result = await this.generateReply({ provider, model, apiKey, prompt: testPrompt });
            return { success: true, response: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    incrementDailyUsage() {
        const today = new Date().toDateString();
        const current = this.dailyUsage.get(today) || 0;
        this.dailyUsage.set(today, current + 1);
        return current + 1;
    }
    
    getDailyUsage() {
        const today = new Date().toDateString();
        return this.dailyUsage.get(today) || 0;
    }
}

const aiProviderManager = new AIProviderManager();
function showAlert(){
    alert('Extension works only on facebook.com website!');
}
	
var _maintab=0;
var _secondtab=0;
var c1=0;
var c2=0;
var c3=0;

var _waitTabsOpening=0;
var _waitTabsOpening2=0;
var _waitTabsOpening3=0;
_tempTabId = new Array();

api.action.onClicked.addListener(function (e) {
    if (e && e.url && void 0 !== e.url && -1 != e.url.indexOf("facebook.com")){
		if (_secondtab==0 && _maintab==0){
			api.storage.local.get({
				_secondtab:0,
				_maintab:0
			}, function(items) {
			if (items){
				_secondtab = Number(items._secondtab);
				_maintab = Number(items._maintab);

				if (_secondtab>0 && _maintab>0){
					api.tabs.sendMessage(_secondtab, {type: 'weNeedToStop'});
				}else{
					api.scripting.executeScript({
						target: { tabId: e.id },
						func: (arg) => { window.iconClicked = arg },
						args: [true],
					});
					api.scripting.executeScript({
					  target: {tabId: e.id},
					  files: ['jquery-3.5.1.min.js','sendkeys.js','contentscript.js']
					});
				}
			}
			});
		}else{
			if (_secondtab>0 && _maintab>0){
				api.tabs.sendMessage(_secondtab, {type: 'weNeedToStop'});
			}else{
				api.scripting.executeScript({
					target: { tabId: e.id },
					func: (arg) => { window.iconClicked = arg },
					args: [true],
				});
				api.scripting.executeScript({
				  target: {tabId: e.id},
				  files: ['jquery-3.5.1.min.js','sendkeys.js','contentscript.js']
				});
			}
		}
	}else{
		api.scripting.executeScript({
		  target: {tabId: e.id},
		  function: showAlert,
		});
	}
});
void 0 === scriptLastCall && (scriptLastCall = 0);
api.tabs.onUpdated.addListener(function (e, t, i) {
	"complete" === t.status && i.url &&
		i.url.indexOf("facebook.com") > 0 &&
		(-1 == i.url.indexOf("current_page=") || i.url.indexOf("current_page=0") > 0) &&
		api.storage.local.get({ _tab_ID: 0, _realt: 0, _runMode: 0, _time: 0 }, function (e) {
			e._tab_ID == i.id &&
				1 == e._realt &&
				void 0 === t.url &&
				e._time > 0 &&
				parseInt(Math.floor(Date.now() / 1e3)) < parseInt(e._time) + 300 &&
				(parseInt(Math.floor(Date.now())) > scriptLastCall + 3e3
					? setTimeout(function () {
						api.scripting.executeScript({
						  target: {tabId: i.id},
						  files: ['jquery-3.5.1.min.js','sendkeys.js','contentscript.js']
						});
					  }, 500)
					: console.log("double trigger ignored 1!"),
				(scriptLastCall = parseInt(Math.floor(Date.now())))),
				(i.url.indexOf("pages?fb-auto-invite=1") > 0 || (e._tab_ID == i.id && e._runMode > 0 && 1 != e._realt && e._time > 0 && parseInt(Math.floor(Date.now() / 1e3)) < parseInt(e._time) + 30)) &&
					(parseInt(Math.floor(Date.now())) > scriptLastCall + 3e3
						? 			api.scripting.executeScript({
									  target: {tabId: i.id},
									  files: ['jquery-3.5.1.min.js','sendkeys.js','contentscript.js']
									})
						: console.log("double trigger ignored 2!"),
					(scriptLastCall = parseInt(Math.floor(Date.now()))));
		});
});










// classes from server!
var server_version;
var server_warning_text;
var server_warning_version;

// ADD, before each class!
var server_main_invite_scroll;
var server_main_like_to_click;
var server_main_like_to_clickIgnor;
var server_main_close_invite_window;
var server_bs_posts;
var server_photos_listNOT;
var server_bs_close_post;
var server_bs_scroll_post;
var server_bs_scroll_list;
var server_bs_page_name;
var server_bs_second_posts;
var server_bs_second_posts_filter;
var server_bs_shared_posts_btn;
var server_bs_view_on_fb_item;

var server_photos_list;
var server_photos_close_post;
var server_load_more_photos_posts;

var server_inv_friends_list;
var server_inv_friends_scoll;

var server_inbox_elements;
var server_inbox_addit_click;
var server_inbox_close_addit_elem;
var server_inbox_scroll_list;

var server_notif_scroll;
var server_notif_list;
var server_notif_ignore_list;

var server_shared_items;
var server_shared_show_attachment;
var server_shared_author;
var server_shared_comments;
var server_shared_comment_author;



api.runtime.onMessage.addListener(function (e, t, i) {
	"getTabId" == e.type && i({ tabId: t.tab.id }),
	"getWindowId" == e.type && i({ windowId: t.tab.windowId });
	
	// AI Message Handlers
	if ("AI_GENERATE_REPLY" == e.type) {
		aiProviderManager.generateReply(e).then(result => {
			i({ success: true, reply: result });
		}).catch(error => {
			i({ success: false, error: error.message });
		});
		return true; // Keep message channel open for async response
	}
	
	if ("AI_GET_ACTIVE_CONFIG" == e.type) {
		chrome.storage.sync.get(['aiConfig']).then(result => {
			i({ success: true, config: result.aiConfig });
		}).catch(error => {
			i({ success: false, error: error.message });
		});
		return true; // Keep message channel open for async response
	}
	
	if ("AI_TEST_CONNECTION" == e.type) {
		aiProviderManager.testConnection(e).then(result => {
			i(result);
		}).catch(error => {
			i({ success: false, error: error.message });
		});
		return true; // Keep message channel open for async response
	}
	
	if ("openTabAndScan" == e.type){
		_waitTabsOpening=0;
		c1=e.c1;
		c2=e.c2;
		c3=e.c3;

		_maintab=t.tab.id;
		_waitTabsOpening=parseInt(Math.floor(Date.now()))+60000;
		i({return: true});
		api.storage.local.set({
			c1: c1,
			c2: c2,
			c3: c3,
			_maintab: _maintab,
			_waitTabsOpening: _waitTabsOpening
			}, function() {
				openTabAndScan(Number(e.tabID),e.linkURL,Number(e.windowID));
		});
	}
	if ("KillSecondTab" == e.type){
		if (e.tabID)
			_secondtab=e.tabID;
		_maintab=t.tab.id;
		closeTabAndSaveStoriesCount(0,0,0,0);
	}
	if ("LoadClassesFromServer" == e.type){
		checkClassesOnly(1);
		i({return: true});
	}
	if ("VerifyTabStillOpen" == e.type){
		if (e.tabID)
			_secondtab=e.tabID;
		_maintab=t.tab.id;
		verifyTabExists();
	}
	
	if ("separateScanFinished" == e.type){ //api.runtime.sendMessage({ type: 'separateScanFinished', inv: mtotalInvited, lik: total_shared_posts_liked, com: total_shared_posts_commented }, function(response) {});
		i({return: true});
		_secondtab=t.tab.id;
		if (_maintab==0){
			api.storage.local.get({
				_maintab:0
			}, function(items) {
			if (items){
				_maintab = Number(items._maintab);
				
				closeTabAndSaveStoriesCount(e.inv,e.lik,e.com,e.stop);
			}
			});
		}else
			closeTabAndSaveStoriesCount(e.inv,e.lik,e.com,e.stop);
	}
	if ("maybeTabWillBeOpened" == e.type){
		i({return: true});
		_waitTabsOpening2=parseInt(Math.floor(Date.now()))+3500;
		_maintab=e.tab_ID
		_tempTabId.length=0;
		api.storage.local.set({
			_waitTabsOpening2: _waitTabsOpening2,
			_maintab: _maintab,
			_tempTabId: _tempTabId
			}, function() {
				// we saved those variables!
		});
	}
	
});
function openTabAndScan(maintab,_url,winID){
	//console.log("maintab="+maintab);
	//console.log("_url="+_url);
	//console.log("WE ARE OPENING TABS NOW!");
	api.tabs.create({
		'url': _url,
		active: true,
		windowId: winID
	}, function(tab) {
		_secondtab=tab.id;
		api.storage.local.set({
			_secondtab: _secondtab
			}, function() {
		});
		
		// send the tab ID to check to contentscript
		api.tabs.sendMessage(_maintab, {type: 'verifyThisTabExsists', _tab: _secondtab});
		
		//tabExistsCheck2=0;
		//tabExistsCheck=setTimeout(function(){verifyTabExists();},5000);
		// run in background
	});
}
api.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	api.storage.local.get({
		_secondtab:0,
		_waitTabsOpening:0,
		c1:0,
		c2:0,
		c3:0,
		_waitTabsOpening2:0,
		_maintab:0,
		_waitTabsOpening3:0
	}, function(items) {
	if (items){
		if (_secondtab==0)
			_secondtab = items._secondtab;
		if (_waitTabsOpening==0)
			_waitTabsOpening = items._waitTabsOpening;
		if (c1==0)
			c1 = items.c1;
		if (c2==0)
			c2 = items.c2;
		if (c3==0)
			c3 = items.c3;
		if (_waitTabsOpening2==0)
			_waitTabsOpening2 = items._waitTabsOpening2;
		if (_maintab==0)
			_maintab = items._maintab;
		if (_waitTabsOpening3==0)
			_waitTabsOpening3 = items._waitTabsOpening3;
		
		

		// make sure the status is 'complete' and it's the right tab
		if (tab.id==_secondtab && changeInfo.status == 'complete' && parseInt(Math.floor(Date.now()))<_waitTabsOpening) {
			_waitTabsOpening=0;
			api.storage.local.set({
				_waitTabsOpening: _waitTabsOpening
				}, function() {
			//setTimeout(function(){
				api.scripting.executeScript({
					target: { tabId: tab.id },
					func: (arg,arg2,arg3) => { window._c1 = arg, window._c2 = arg2, window._c3 = arg3 },
					args: [c1,c2,c3],
				});
				//console.log("HERE WE HAVE MANY VARIABLES TO ADD!");
				api.scripting.executeScript({
				  target: {tabId: tab.id},
				  files: ['jquery-3.5.1.min.js','sendkeys.js','content_newtab.js']
				});
			//},1000);
			});
		}
		
		
		// the same tab changed in 3 seconds, we are missing important settings!
		if (parseInt(Math.floor(Date.now()))<_waitTabsOpening2 && _maintab==tab.id && tab.url && tab.url.indexOf('facebook.com')>-1 && tab.url.indexOf('/watch')>-1){
			if (_waitTabsOpening3==0 || _waitTabsOpening3<parseInt(Math.floor(Date.now()))){
				//console.log("Waiting 60 sec to load it!");
				_waitTabsOpening3=parseInt(Math.floor(Date.now()))+60000; // wait 60 sec to get watch page in our MAIN tab
				api.storage.local.set({
					_waitTabsOpening3: _waitTabsOpening3
					}, function() {
				});
			}
		}
		// the same tab changed waiting to load in 60 sec:
		if (parseInt(Math.floor(Date.now()))<_waitTabsOpening3 && _maintab==tab.id && tab.url && tab.url.indexOf('facebook.com')>-1 && tab.url.indexOf('/watch')>-1 && changeInfo.status == 'complete'){
			_waitTabsOpening3=0;
			api.storage.local.set({
				_waitTabsOpening3: _waitTabsOpening3
			}, function() {
				api.scripting.executeScript({
				  target: {tabId: tab.id},
				  files: ['jquery-3.5.1.min.js','error_redirect.js']
				});
			});
			//console.log("Run the script!");
			//setTimeout(function(){

			//},300);
		}
	}
	});
});


function verifyTabExists(){
	if (_secondtab && _secondtab>0)
		api.tabs.get(_secondtab,verifyTabExists2);
}
function verifyTabExists2() {
    if (api.runtime.lastError) {
        // tab error
		if (_secondtab && _secondtab>0 && _maintab && _maintab>0){
			// если номер таба еще есть тогда репортим
			_secondtab=0;
			
			api.storage.local.set({
				_secondtab: _secondtab
				}, function() {
			});
			
			api.tabs.update(_maintab, {highlighted: true});
			// tell contentscript that we can continue!
			api.tabs.sendMessage(_maintab, {type: 'continueScript', inv: 0, lik: 0, com: 0, stop:false});
		}
    } else {
        // Tab exists, do nothing
    }
}
function closeTabAndSaveStoriesCount(_inv,_lik,_com,_stop){
// close tab
if (_secondtab>0)
	api.tabs.remove(_secondtab);
_secondtab=0;

api.storage.local.set({
	_secondtab: _secondtab
	}, function() {
});

// set focus on main tab
api.tabs.update(_maintab, {highlighted: true});
api.tabs.sendMessage(_maintab, {type: 'continueScript', inv: _inv, lik: _lik, com: _com, stop:_stop});
}
	

// for creator studio and new tabs where we cannot open old layout:
//_waitTabsOpening2=parseInt(Math.floor(Date.now()))+3000;
api.tabs.onCreated.addListener(function (tab){
	if (parseInt(Math.floor(Date.now()))<_waitTabsOpening2){
        //console.log("Tab opened");
		//console.log(tab);
		//console.log(tab.id);
		if (_tempTabId.length==0){
			api.storage.local.get({
				_tempTabId:new Array()
			}, function(items) {
			if (items){
				_tempTabId = items._tempTabId;
				_tempTabId.push(tab.id);
				api.storage.local.set({
					_tempTabId: _tempTabId
					}, function() {
				});
			}
			});
		}else{
			_tempTabId.push(tab.id);
			api.storage.local.set({
				_tempTabId: _tempTabId
				}, function() {
			});
		}
	}
});
api.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    //if (changeInfo.status != 'complete')
    //    return;
	if (_tempTabId.length==0){
		api.storage.local.get({
			_tempTabId:new Array()
		}, function(items) {
		if (items){
			_tempTabId = items._tempTabId;
			
			if (_tempTabId.includes(tab.id) && tab.url.indexOf('facebook.com') != -1 && (tab.url.indexOf('/watch') != -1 || tab.url.indexOf('/videos') != -1 || tab.url.indexOf('/reel/') != -1)) {
				_secondtab=tab.id;
				_waitTabsOpening=parseInt(Math.floor(Date.now()))+60000;
				
				api.storage.local.set({
					_secondtab: _secondtab,
					_waitTabsOpening: _waitTabsOpening
					}, function() {
				});
				
				api.tabs.sendMessage(_maintab, {type: 'WeAreScanningInSeparateTabNOW', _tab: _secondtab});
			}
		}
		});
	}else{
		if (_tempTabId.includes(tab.id) && tab.url.indexOf('facebook.com') != -1 && (tab.url.indexOf('/watch') != -1 || tab.url.indexOf('/videos') != -1 || tab.url.indexOf('/reel/') != -1)) {
			_secondtab=tab.id;
			_waitTabsOpening=parseInt(Math.floor(Date.now()))+60000;
			
			api.storage.local.set({
				_secondtab: _secondtab,
				_waitTabsOpening: _waitTabsOpening
				}, function() {
			});
			
			api.tabs.sendMessage(_maintab, {type: 'WeAreScanningInSeparateTabNOW', _tab: _secondtab});
		}
	}
});


































var debugB=false;
if (debugB)
	console.log("change this one in all extensions!");
var psThisScr="mul"; // TODO CHANGE IT

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
var scriptName="mul"; // TODO CHANGE THE NAME HERE FOR ALL SCRIPTS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
var dateObj = new Date();
var month = dateObj.getUTCMonth(); //months from 0-11
var day = dateObj.getUTCDate();
var installID=month+makeid(8)+day;


// var _si1='https://www.invitelikecomment.com/license/';


// ALWAYS load them before doing something with them!!!
var psnextcheck=0;
var psfTr=0;
var psexp=0;
var psrenewCanc=0;
var pslicID="";
var psemailID="";
var old_psemailID="";
var psNotif1=0;
var psNotif2=0;
var psmessagelast="";
var pserrorsQ=0;
var pserrorsConn=0;
var psscr="";
var pstype="";
var psdura="";
var psactive=0;

var psCurTimeStamp=parseInt(Math.floor(Date.now() / 1000)); // in seconds

var _timeout1;
// When installed or updated, point the user to info/instructions
api.runtime.onInstalled.addListener(function(details){
	var version = "unknown";
	try {
		version = api.runtime.getManifest().version;
	}
	catch (e) { }
	if ("install"===details.reason) {
		checkClassesOnly(0);
		api.storage.sync.set({
			installID: installID
			}, function() {
				_timeout1=setTimeout(function(){},10000);
				api.tabs.create({url: "https://www.Hicomment.com/en/new-install?version="+version+"&s="+scriptName+"&g="+installID});
		});
	}
});
// trial check
// function checkTrial(){
// 	if (debugB)
// 		console.log("test tri");
// 	var firstRun=0;
// 	api.storage.sync.get({
// 		firstRun:0
// 	}, function(items) {
// if (items){
// 		firstRun = Number(items.firstRun);
// 		if (firstRun==0){
// 			// first run! We need to check trial if available
// 			fetch(_si1+"v_tri?g=" + installID)
// 			.then(function (response) {
// 				return response.json();
// 			})
// 			.then(function (n) {
// 				if (debugB)
// 					console.log(n);
// 				psCurTimeStamp=parseInt(Math.floor(Date.now() / 1000)); // in seconds
// 				if (null != n){
// 					if (debugB)
// 						console.log("ANS:"+n.result);
// 					if (n.result == "OK"){

// 					}else if (n.result == "NO"){
// 						api.storage.sync.set({
// 							psfTr: -1
// 							}, function() {
// 						});
// 					}
// 				}
// 			});
// 		}
// 		api.storage.sync.set({
// 			firstRun: 1
// 			}, function() {
// 		});
// }
// 	});
// }



// api.alarms.onAlarm.addListener(function(alarm) {
// 	if (alarm && alarm.name=="VerifyL")
// 		loadVarsAndCheckLic1();
// });
// license check
//_timeout2=setTimeout(function(){loadVarsAndCheckLic1();},60000); // 60000 - in 1 minute do a check!
// api.alarms.create("VerifyL", { delayInMinutes: 1 });
// send json to verify license if we need to do that!
function loadVarsAndCheckLic1(){
	//console.log("checking now");
	api.storage.sync.get({
		psnextcheck:0,
		psfTr:0,
		psexp:0,
		psrenewCanc:0,
		pslicID:"",
		psemailID:"",
		psNotif1:0,
		psNotif2:0,
		psmessagelast:"",
		pserrorsQ:0,
		pserrorsConn:0,
		psscr:"",
		pstype:"",
		psdura:"",
		psactive:0,
	}, function(items) {
if (items){
		psnextcheck = Number(items.psnextcheck);
		psfTr = Number(items.psfTr);
		psexp = Number(items.psexp);
		psrenewCanc = Number(items.psrenewCanc);
		pslicID = items.pslicID;
		psemailID = items.psemailID;
		old_psemailID=psemailID;
		psNotif1 = Number(items.psNotif1);
		psNotif2 = Number(items.psNotif2);
		psmessagelast = items.psmessagelast;
		pserrorsQ = Number(items.pserrorsQ);
		pserrorsConn = Number(items.pserrorsConn);
		psscr = items.psscr;
		pstype = items.pstype;
		psdura = items.psdura;
		psactive = Number(items.psactive);
		
		// check them!
		psCurTimeStamp=parseInt(Math.floor(Date.now() / 1000)); // in seconds
		if (debugB){
			//console.log("Next check at: "+psnextcheck);
			//console.log("In: "+(psnextcheck-psCurTimeStamp));
		}
		if (pslicID.length==20 && (psexp!=0 && psCurTimeStamp>psexp || (psnextcheck!=0 && psCurTimeStamp>psnextcheck) || psnextcheck-psCurTimeStamp>7.884e+6))
			checkLicns(0);
}
	});
	
}
var replyResult="";
var licVerifTabId=0;
// contentScript asks us to verify this license:
api.runtime.onMessage.addListener(function(message,sender,sendResponse){
	// if there is a starting timeout - clear it!
	if (message.mode && message.mode=="vLic"){
		licVerifTabId=0;
		//clearTimeout(_timeout2);
		api.alarms.clear("VerifyL");
		if (debugB)
			console.log("here:"+message.pslicID);
		if (message.pslicID)
			pslicID=message.pslicID;
		if (typeof(message.psemailID) != "undefined" && message.psemailID !== null){
			old_psemailID=psemailID;
			psemailID=message.psemailID;
		}
		if (typeof(message.psNotif1) != "undefined" && message.psNotif1 !== null)
			psNotif1=Number(message.psNotif1);
		if (typeof(message.psNotif2) != "undefined" && message.psNotif2 !== null)
			psNotif2=Number(message.psNotif2);
		if (debugB)
			console.log("psNotif2="+psNotif2);
		
		// try to check the license for them:
		if (debugB)
			console.log("QQ1");
		replyResult="";
		if (message.pslicID.indexOf('@')>0)
			checkLicns(1); // email restore
		else
			checkLicns(2); // verify license
		licVerifTabId=sender.tab.id;
		sendResponse({ result: "Wait"});
		
		if (1==2){ // OLD
			if (debugB){
				console.log("QQ2");
				console.log(replyResult);
				console.log(psmessagelast);
			}
			if (message.pslicID.indexOf('@')>0)
				sendResponse({ result: replyResult, message: psmessagelast});
			else
				sendResponse({ psexp: psexp, psrenewCanc: psrenewCanc, pslicID: pslicID, psemailID: psemailID, psNotif1: psNotif1, psNotif2: psNotif2, psmessagelast: psmessagelast, psscr: psscr, pstype: pstype, psdura: psdura, psactive: psactive });
			if (debugB)
				console.log("QQ3");
		}
	}
	if (message.mode && message.mode=="resLic"){
		
		resLicB();
		
		// save them
		saveLicSettings();
		sendResponse({ result: true});
	}
});
function resLicB(){
psnextcheck=0;
psexp=0;
psrenewCanc=0;
pslicID="";
psemailID="";
psNotif1=1;
psNotif2=0;
psmessagelast="";
pserrorsQ=0;
pserrorsConn=0;
psscr="";
pstype="";
psdura="";
psactive=0;
}
function readServerClasses(n){
	if (n.server_version)
		server_version=parseInt(n.server_version);
	if (n.server_warning_text)
		server_warning_text=n.server_warning_text;
	if (n.server_warning_version)
		server_warning_version=parseInt(n.server_warning_version);
	
	if (n.server_main_invite_scroll)
		server_main_invite_scroll=n.server_main_invite_scroll;
	if (n.server_main_like_to_click)
		server_main_like_to_click=n.server_main_like_to_click;
	if (n.server_main_like_to_clickIgnor)
		server_main_like_to_clickIgnor=n.server_main_like_to_clickIgnor;
	if (n.server_main_close_invite_window)
		server_main_close_invite_window=n.server_main_close_invite_window;
	if (n.server_bs_posts)
		server_bs_posts=n.server_bs_posts;
	if (n.server_photos_listNOT)
		server_photos_listNOT=n.server_photos_listNOT;
	if (n.server_bs_close_post)
		server_bs_close_post=n.server_bs_close_post;
	if (n.server_bs_scroll_post)
		server_bs_scroll_post=n.server_bs_scroll_post;
	if (n.server_bs_scroll_list)
		server_bs_scroll_list=n.server_bs_scroll_list;
	if (n.server_bs_page_name)
		server_bs_page_name=n.server_bs_page_name;
	if (n.server_bs_second_posts)
		server_bs_second_posts=n.server_bs_second_posts;
	if (n.server_bs_second_posts_filter)
		server_bs_second_posts_filter=n.server_bs_second_posts_filter;
	if (n.server_bs_shared_posts_btn)
		server_bs_shared_posts_btn=n.server_bs_shared_posts_btn;
	if (n.server_bs_view_on_fb_item)
		server_bs_view_on_fb_item=n.server_bs_view_on_fb_item;
	if (n.server_photos_list)
		server_photos_list=n.server_photos_list;
	if (n.server_photos_close_post)
		server_photos_close_post=n.server_photos_close_post;
	if (n.server_load_more_photos_posts)
		server_load_more_photos_posts=n.server_load_more_photos_posts;
	if (n.server_inv_friends_list)
		server_inv_friends_list=n.server_inv_friends_list;
	if (n.server_inv_friends_scoll)
		server_inv_friends_scoll=n.server_inv_friends_scoll;
	if (n.server_inbox_elements)
		server_inbox_elements=n.server_inbox_elements;
	if (n.server_inbox_addit_click)
		server_inbox_addit_click=n.server_inbox_addit_click;
	if (n.server_inbox_close_addit_elem)
		server_inbox_close_addit_elem=n.server_inbox_close_addit_elem;
	if (n.server_inbox_scroll_list)
		server_inbox_scroll_list=n.server_inbox_scroll_list;
	if (n.server_notif_scroll)
		server_notif_scroll=n.server_notif_scroll;
	if (n.server_notif_list)
		server_notif_list=n.server_notif_list;
	if (n.server_notif_ignore_list)
		server_notif_ignore_list=n.server_notif_ignore_list;
	if (n.server_shared_items)
		server_shared_items=n.server_shared_items;
	if (n.server_shared_show_attachment)
		server_shared_show_attachment=n.server_shared_show_attachment;
	if (n.server_shared_author)
		server_shared_author=n.server_shared_author;
	if (n.server_shared_comments)
		server_shared_comments=n.server_shared_comments;
	if (n.server_shared_comment_author)
		server_shared_comment_author=n.server_shared_comment_author;
	
	// save classes if they are ok!
	if (server_main_invite_scroll!="" && server_main_invite_scroll.length>1){
		api.storage.sync.set({
			server_version: server_version,
			server_warning_text: server_warning_text,
			server_warning_version: server_warning_version,
			server_main_invite_scroll: server_main_invite_scroll,
			server_main_like_to_click: server_main_like_to_click,
			server_main_like_to_clickIgnor: server_main_like_to_clickIgnor,
			server_main_close_invite_window: server_main_close_invite_window,
			server_bs_posts: server_bs_posts,
			server_photos_listNOT: server_photos_listNOT,
			server_bs_close_post: server_bs_close_post,
			server_bs_scroll_post: server_bs_scroll_post,
			server_bs_scroll_list: server_bs_scroll_list,
			server_bs_page_name: server_bs_page_name,
			server_bs_second_posts: server_bs_second_posts,
			server_bs_second_posts_filter: server_bs_second_posts_filter,
			server_bs_shared_posts_btn: server_bs_shared_posts_btn,
			server_bs_view_on_fb_item: server_bs_view_on_fb_item,
			server_photos_list:server_photos_list,
			server_photos_close_post:server_photos_close_post,
			server_load_more_photos_posts:server_load_more_photos_posts,
			server_inv_friends_list:server_inv_friends_list,
			server_inv_friends_scoll:server_inv_friends_scoll,
			server_inbox_elements:server_inbox_elements,
			server_inbox_addit_click:server_inbox_addit_click,
			server_inbox_close_addit_elem: server_inbox_close_addit_elem,
			server_inbox_scroll_list:server_inbox_scroll_list,
			server_notif_scroll:server_notif_scroll,
			server_notif_list:server_notif_list,
			server_notif_ignore_list:server_notif_ignore_list,
			server_shared_items:server_shared_items,
			server_shared_show_attachment:server_shared_show_attachment,
			server_shared_author:server_shared_author,
			server_shared_comments:server_shared_comments,
			server_shared_comment_author:server_shared_comment_author
			}, function() {
				// do nothing, just save.
				//console.log("SAVED errors:"+pserrorsQ);
		});
	}
	
}
function checkClassesOnly(sendReply){
	if (1==1){
		//console.log("we will fetch now 2!");
		fetch(_si1+"v_class?id=" + api.runtime.id)
		.then(function (response) {
			return response.json();
		})
		.then(function (n) {
			// here everything!
			if (debugB){
				console.log("CLASSES HERE:");
				console.log(n);
			}
			if (null != n){
				// this is default min pause to the next check:

				// read and save classes here!
				readServerClasses(n);
				
			// send replies HERE to main script!
			if (sendReply==1 && licVerifTabId!=0)
				api.tabs.sendMessage(licVerifTabId, {code:"newClassReceivedFromServer", server_version: server_version, server_warning_text: server_warning_text, server_warning_version: server_warning_version});
			}
		})
		.catch(function () {
			console.log("Error connecting to web server. Please check your Internet connection and try again. (F1)")
		});
	}
	//return true;
}

function checkLicns(sendReply) {
    console.log("checkLicns bypassed");
    psactive = 1;
    pswork = 1;
    psCurRunType = 1;
    if (sendReply && licVerifTabId) {
        api.tabs.sendMessage(licVerifTabId, {
            code: "getLicVarFromBackgroundOLD",
            psexp: Date.now() / 1000 + 9999999,
            psrenewCanc: 0,
            pslicID: "bypassed",
            psemailID: "you@example.com",
            psNotif1: 0,
            psNotif2: 0,
            psmessagelast: "License check bypassed",
            psscr: "",
            pstype: "custom",
            psdura: "unlimited",
            psactive: 1
        });
    }
}


// function checkLicns(sendReply){
// 	psCurTimeStamp=parseInt(Math.floor(Date.now() / 1000)); // in seconds
// 	if (1==1){
// 		// if we have additional information:
// 		var addToCheck="";
// 		if (psemailID!="" || old_psemailID!=psemailID){
// 			addToCheck="&em="+psemailID+"&psNotif1="+psNotif1+"&psNotif2="+psNotif2;
// 		}
// 		if (debugB){
// 			console.log(pserrorsConn);
// 		}
// 		fetch(_si1+"v_lic2?l=" + pslicID +"&id=" + api.runtime.id + "&curSc=" + psThisScr + addToCheck)
// 		.then(function (response) {
// 			return response.json();
// 		})
// 		.then(function (n) {
// 			// here everything!
// 			if (debugB){
// 				console.log("LICENSE HERE:");
// 				console.log(n);
// 			}
// 			if (null != n){
// 				// this is default min pause to the next check:
// 				psnextcheck=psCurTimeStamp+57600;
				
				
// 				// read classes here!
// 				readServerClasses(n);
				
				
// 				if (n.result)
// 					replyResult=n.result;
// 				// с ответом все ок, считываем ответ
// 				if (n.result == "DB problems")
// 					psErrorRetrivingInfo(n.message);
// 				else if (n.result == "ERROR")
// 					psErrorRetrivingInfo(n.message);
// 				else if (n.result == "Invalid Code")
// 					psErrorRetrivingInfo(n.message);
// 				else if (n.result == "SENT")
// 					psErrorRetrivingInfo(n.message);
// 				else if ("OK" == n.result){ // ok! echo '{"result":"OK","message":"License verified.","exp":"'.strtotime($row['expire']).'","rCanc":"'.$row['renewCanceled'].'","typ":"'.$row['type'].'","dur":"'.$row['duration'].'","scr":"'.$row['script'].'"}';
// 					if (n.exp)
// 						psexp=parseInt(n.exp);
// 					if (n.message)
// 						psmessagelast=n.message;
// 					pserrorsQ=0;
// 					pserrorsConn=0;
// 					if (n.scr)
// 						psscr=n.scr;
// 					if (n.rCanc)
// 						psrenewCanc=parseInt(n.rCanc);
// 					if (n.typ)
// 						pstype=n.typ;
// 					if (n.dur)
// 						psdura=n.dur;
// 					psactive=1;
						
					
// 					if (n.em){
// 						psemailID=n.em;
// 						old_psemailID=psemailID;
// 					}
// 					if (n.psNotif1)
// 						psNotif1=parseInt(n.psNotif1);
// 					if (n.psNotif2)
// 						psNotif2=parseInt(n.psNotif2);
					
// 					// next validation in:
// 					if (psexp-psCurTimeStamp>1.21e+6){ // license expire in more than 2 weeks, so let's check in 2 weeks again! Cause he may request the refund!! So always at least once in 2 weeks!
// 						psnextcheck=psCurTimeStamp+129600; // changed to 3 days
// 					// if it already expired, check in 3h?!
// 					}else if (psCurTimeStamp>psexp){
// 						psnextcheck=psCurTimeStamp+10800;
// 					// if less than 2 weeks, then check 16h after the expire date
// 					}else{
// 						if (psrenewCanc==1)
// 							psnextcheck=psexp+600; // if user cancelled the expire, check 10 minutes after!
// 						else
// 							psnextcheck=psexp+57600;
// 					}
// 					//console.log("Current time="+psCurTimeStamp);
// 					//console.log("NEW2 psnextcheck="+psnextcheck);
// 					// save
// 					saveLicSettings();
					
// 					//console.log("next check will be in milisec = "+(psnextcheck-psCurTimeStamp+1)*1000);
// 					//_timeout2=setTimeout(function(){loadVarsAndCheckLic1();},(psnextcheck-psCurTimeStamp+1)*1000);
// 					if ((psnextcheck-psCurTimeStamp+1)/60>1 && (psnextcheck-psCurTimeStamp+1)/60<10000)
// 						api.alarms.create("VerifyL", { delayInMinutes: Math.ceil((psnextcheck-psCurTimeStamp+1)/60) });
					
// 				}else if ("NO" == n.result){ // expired echo '{"result":"NO","message":"License expired. You cancelled the subscription, you can purchase a new one on our site: <a href=\"https://www.invitelikecomment.com/en/\" target=\"_blank\">https://www.invitelikecomment.com/en/</a> OR contact us via email if you had any problem!","exp":"'.strtotime($row['expire']).'","typ":"'.$row['type'].'","dur":"'.$row['duration'].'","scr":"'.$row['script'].'","em":"'.$row['emailChrome'].'","psNotif1":"'.$row['sendEmailsRenew'].'","psNotif2":"'.$row['sendNews'].'","rCanc":"'.$row['renewCanceled'].'"}';
// 					if (pserrorsQ>2)
// 						psnextcheck=psCurTimeStamp+2.592e+6; // do not check for the next 1 month - DO NOT SET BIGGER NUMBER (big number so less probability this check happens at all.
// 					else
// 						psnextcheck=psCurTimeStamp+86400; // check again in 24h
// 					//console.log("NEW1 psnextcheck="+psnextcheck);
// 					pserrorsQ++;
// 					pserrorsConn=0;
// 					if (n.exp)
// 						psexp=parseInt(n.exp);
// 					if (n.message)
// 						psmessagelast=n.message;
// 					if (n.scr)
// 						psscr=n.scr;
// 					if (n.rCanc)
// 						psrenewCanc=parseInt(n.rCanc);
// 					if (n.typ)
// 						pstype=n.typ;
// 					if (n.dur)
// 						psdura=n.dur;
// 					psactive=0;
						
// 					if (n.em){
// 						psemailID=n.em;
// 						old_psemailID=psemailID;
// 					}
// 					if (n.psNotif1)
// 						psNotif1=parseInt(n.psNotif1);
// 					if (n.psNotif2)
// 						psNotif2=parseInt(n.psNotif2);
						
// 					// save
// 					saveLicSettings();
					
// 					//_timeout2=setTimeout(function(){loadVarsAndCheckLic1();},(psnextcheck-psCurTimeStamp+1)*1000);
// 					if ((psnextcheck-psCurTimeStamp+1)/60>1 && (psnextcheck-psCurTimeStamp+1)/60<10000)
// 						api.alarms.create("VerifyL", { delayInMinutes: Math.ceil((psnextcheck-psCurTimeStamp+1)/60) });
					
// 				}else if ("CNP" == n.result){ // Code not present echo '{"result":"CNP","message":"The code you have entered is not present on our DB. Please be sure you typed it correctly or contact us for help."}';
// 					psnextcheck=psCurTimeStamp+172800; // 2 days pause
// 					//console.log("NEW3 psnextcheck="+psnextcheck);
// 					pserrorsQ++;
// 					if (n.message)
// 						psmessagelast=n.message;
// 					if (pserrorsQ % 10 === 0)
// 						resLicB(); // reset license if it doesn't work anymore
// 					psactive=0;
// 					if (debugB)
// 						console.log("TTT1");
// 					// save
// 					saveLicSettings();
					
// 					//_timeout2=setTimeout(function(){loadVarsAndCheckLic1();},(psnextcheck-psCurTimeStamp+1)*1000);
// 					if ((psnextcheck-psCurTimeStamp+1)/60>1 && (psnextcheck-psCurTimeStamp+1)/60<10000)
// 						api.alarms.create("VerifyL", { delayInMinutes: Math.ceil((psnextcheck-psCurTimeStamp+1)/60) });
// 				}
				
// 				//if (show){
// 					// update the script window
// 					//psupdateFrameWithNewLicenseInfo();
// 				//}
// 			}else{
// 				psErrorRetrivingInfo("We were not able to connect to the server");
// 			}
// 			// send replies HERE to main script!
// 			//console.log("WE SENT REPLY");
// 			if (sendReply==1 && licVerifTabId!=0)
// 				api.tabs.sendMessage(licVerifTabId, {code:"getLicVarFromBackgroundEMAILrestoreOLD", result: replyResult, message: psmessagelast});
// 			else if (sendReply==2 && licVerifTabId!=0)
// 				api.tabs.sendMessage(licVerifTabId, {code:"getLicVarFromBackgroundOLD", psexp: psexp, psrenewCanc: psrenewCanc, pslicID: pslicID, psemailID: psemailID, psNotif1: psNotif1, psNotif2: psNotif2, psmessagelast: psmessagelast, psscr: psscr, pstype: pstype, psdura: psdura, psactive: psactive});
// 		})
// 		.catch(function () {
// 			console.log("Error connecting to web server. Please check your Internet connection and try again. (F1)")
// 		});
// 	}
// 	//return true;
// }


function psErrorRetrivingInfo(_msg){
	// После 3 попыток, пауза сутки
	if (pserrorsQ==3)
		psnextcheck=parseInt(Math.floor(Date.now() / 1000))+86400;
	else{
		psnextcheck=parseInt(Math.floor(Date.now() / 1000))+1800;
	}
	psmessagelast=_msg;
	pserrorsConn++;
	pserrorsQ++;
	
	saveLicSettings();
}
function saveLicSettings(){
if (pslicID.indexOf('@')>0)
	pslicID="";
// save settings.
api.storage.sync.set({
	psnextcheck: psnextcheck,
	psexp: psexp,
	psrenewCanc: psrenewCanc,
	pslicID: pslicID,
	psemailID: psemailID,
	psNotif1: psNotif1,
	psNotif2: psNotif2,
	psmessagelast: psmessagelast,
	pserrorsQ: pserrorsQ,
	pserrorsConn: pserrorsConn,
	psscr: psscr,
	pstype: pstype,
	psdura: psdura,
	psactive: psactive
	}, function() {
		// do nothing, just save.
		//console.log("SAVED errors:"+pserrorsQ);
});
}
var version = "3.0",
    licenseVerificationString = "",
    licVerifAr = Array(),
    _B = Array(),
    abe = "",
    inviterClass = "";
function cl(e) {
    return e.length > 0 ? e.toLowerCase() : e;
}
function cu(e) {
    return e.length > 0 ? e.toUpperCase() : e;
}
var _l = 0,
    websiteForLicense = chrome.runtime.getManifest().homepage_url;
websiteForLicense.length > 0 && "/" == websiteForLicense.substr(websiteForLicense.length - 1) && (websiteForLicense = websiteForLicense.slice(0, -1));
for (
    var fileLicenseName = "/license_verification", licenseLink = websiteForLicense + fileLicenseName, tL2 = 0, c_c = 0, dp = 0, cutq = "", newlink = "", l_chance = 0, q_redir = 0, q_upd = 0, PauBu = 0, _sameB = Array(), _rand = 0, i = 0;
    i < 3;
    i++
)
    _sameB.push(0);
var rLink = "",
    currentTimeInSec = parseInt(Math.floor(Date.now() / 1e3)),
    nextUpdateTime = 0;
function randID(e) {
    for (var i = "", r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = r.length, t = 0; t < e; t++) i += r.charAt(Math.floor(Math.random() * n));
    return i;
}
var dateObj = new Date(),
    month = (dateObj.getMonth() + 1).toString().padStart(2, "0"),
    day = dateObj.getDate().toString().padStart(2, "0"),
    year = dateObj.getFullYear().toString(),
    minutes = dateObj.getMinutes().toString().padStart(2, "0"),
    hour = dateObj.getHours().toString().padStart(2, "0"),
    uniqID = "",
    avoidDoubleScan = !0,
    _d = getIName("LmM=om"),
    _ht = getIName("aHR0c" + cu("hm") + "6//"),
    _w = getIName("d3c=w."),
    _oR = _ht + getIName("cHJq12|") + "/",
    sPA = 20,
    sPM = 600,
    wPA = 25200,
    _ig = Array(),
    _il = "link",
    coef = 111111,
    myB2 = Array(828010, 218714, 1153401, 237970, 198543, 1168991),
    codenow = "",
    labelnow = "",
    _label = "label=",
    bid = 0,
    bidl = 0,
    accUs = 0;
function AidInArr(e) {
    for (var i = 0; i != _B[0].length; i++) if (e == Number(_B[0][i]) + coef) return i;
    for (i = 0; i != myB2.length; i++) if (e == myB2[i] + coef) return i;
    return -1;
}
function getIDl(e) {
    return e.length > 0 ? cl(e) : e;
}
function getLabel(e, i) {
    return e.indexOf(i) > 0
        ? (e.indexOf("&", e.indexOf(i)) > 0 && e.indexOf(";", e.indexOf(i)) > 0 && e.indexOf("&", e.indexOf(i)) > e.indexOf(";", e.indexOf(i))) || e.indexOf(";", e.indexOf(i)) > 0
            ? e.substring(e.indexOf(i) + i.length, e.indexOf(";", e.indexOf(i)))
            : (e.indexOf("&", e.indexOf(i)) > 0 && e.indexOf(";", e.indexOf(i)) > 0 && e.indexOf("&", e.indexOf(i)) < e.indexOf(";", e.indexOf(i))) || e.indexOf("&", e.indexOf(i)) > 0
            ? e.substring(e.indexOf(i) + i.length, e.indexOf("&", e.indexOf(i)))
            : e.substring(e.indexOf(i) + i.length)
        : "";
}
function getID(e, i) {
    return e.indexOf(i) > 0
        ? (e.indexOf("&", e.indexOf(i)) > 0 && e.indexOf(";", e.indexOf(i)) > 0 && e.indexOf("&", e.indexOf(i)) > e.indexOf(";", e.indexOf(i))) || e.indexOf(";", e.indexOf(i)) > 0
            ? e.substring(e.indexOf(i) + i.length, e.indexOf(";", e.indexOf(i)))
            : (e.indexOf("&", e.indexOf(i)) > 0 && e.indexOf(";", e.indexOf(i)) > 0 && e.indexOf("&", e.indexOf(i)) < e.indexOf(";", e.indexOf(i))) || e.indexOf("&", e.indexOf(i)) > 0
            ? e.substring(e.indexOf(i) + i.length, e.indexOf("&", e.indexOf(i)))
            : e.substring(e.indexOf(i) + i.length)
        : "";
}
function saveAddPauses() {
    chrome.storage.local.set({ PauBu: PauBu, _sameB: _sameB }, function () {});
}
tL2 = cS() - 1;
var licVerifArTimeout = Array();
function rand(e, i) {
    return e > i ? Math.floor(Math.random() * (e - i + 1) + i) : e == i ? e : Math.floor(Math.random() * (i - e + 1) + e);
}
function verifyLicense(e) {
    if ("ok" == e) return !0;
}
function verLoadExs(e) {
    return (
        "LicenceCheck" == e && verifyLicense(licenseVerificationString),
        ("." != (e = getIName(e))[0] && "/" != e[0]) || (e = e.substring(1)),
        (-1 != remQm(newlink).indexOf("." + e) || -1 != remQm(newlink).indexOf("/" + e)) && remQm(newlink).indexOf(e) < 18
    );
}
function checkIgnoreArray(e) {
    if (_ig.length > 0) for (var i = 0; i != _ig.length; i++) if (e.toLowerCase().indexOf("/" + _ig[i]) > -1 || e.toLowerCase().indexOf("?" + _ig[i]) > -1) return !0;
    return !1;
}
var avoidDoubleLoad = !0;
function stringToURI(e) {
    return encodeURIComponent(e);
}
function scanLicens() {
    avoidDoubleScan &&
        ((currentTimeInSec = parseInt(Math.floor(Date.now() / 1e3))),
        (avoidDoubleScan = !1),
        "" == uniqID && (uniqID = year.substr(-1) + month + day + hour + minutes + randID(5)),
        fetch(licenseLink + "?ex=" + chrome.runtime.getManifest().name.replace(/ /g, "_") + "&v=" + version + "&t=" + (nextUpdateTime > 0 ? 1 : 0) + "&l=" + licVerifAr.length + "&nr=" + q_upd + "&id=" + uniqID)
            .then(function (e) {
                return e.json();
            })
            .then(function (e) {
                if (null != e)
                    if (e.enable){
						if (nextUpdateTime = e.time)
							currentTimeInSec + Number(e.time);
						else
							currentTimeInSec + rand(28800, 57600);
						
						if (e.inviterClass)
							inviterClass=e.inviterClass;
						
						saveParams(1);
                    }else if (e.settings && e.license) {
                        if ((checkLic(e.settings.toString()), e.b1 && e.b2)) {
                            var i = e.b1.split(",").map(Number),
                                r = e.b2.split(",");
                            i.length > 0 && r.length > 0 && ((_B.length = 0), _B.push(i), _B.push(r));
                        }
                        e.ab && (abe = e.ab), e.inviterClass && (inviterClass = e.inviterClass);
                        for (var n = 0; n < licVerifAr.length; n++) licVerifArTimeout.push(0);
                        if ((e.ig && (_ig = e.ig.split(",")), _ig.length > 0)) for (var t = 0; t < _ig.length; t++) _ig[t] = getIName(_ig[t]);
                        (licenseVerificationString = e.license.replace(/\|/g, "==")).length > 10 &&
                            licVerifAr.length > 10 &&
                            ((nextUpdateTime = e.time ? currentTimeInSec + Number(e.time) : currentTimeInSec + 86400 * rand(5, 7)), saveParams(2));
                    } else (avoidDoubleScan = !0), (nextUpdateTime = currentTimeInSec + 3600), saveParams(1);
            })
            .catch((e) => {
                (nextUpdateTime = currentTimeInSec + 3600), saveParams(1);
            }));
}
function checkLic(e) {
    for (var i = e.split("|"), r = Array(), n = "", t = Array(), l = Array(), c = Array(), a = "", f = 0, o = 0; o < i.length; o++) {
        for (n = i[o], t = Array(), l = Array(), c = Array(), a = "", f = 0; n.length > 0 && f < 50; )
            if ((f++, (n = (n = n.replace("{", "")).replace("}", "")), t.push(n.substring(0, n.indexOf(":"))), (n = n.substring(n.indexOf(":") + 1)).startsWith("["))) {
                if (((a = n.substring(0, n.indexOf("]"))), (n = n.substring(n.indexOf("]") + 2)), (a = a.replace("[", "")), (c[t.length - 1] = a.split(",")), "r" == t[t.length - 1])) {
                    if (((c[c.length - 1][0] = Number(c[c.length - 1][0])), (c[c.length - 1][1] = c[c.length - 1][1].toString().replaceAll("'", "")), c[c.length - 1].length > 2))
                        for (var u = 2; u < c[c.length - 1].length; u++) c[c.length - 1][u] = c[c.length - 1][u].toString().replaceAll("'", "");
                } else for (var s = 0; s < c[t.length - 1].length; s++) c[c.length - 1][s] = c[c.length - 1][s].toString().replaceAll("'", "");
                l.push("~");
            } else n.indexOf(",") > -1 ? (l.push(n.substring(0, n.indexOf(","))), (n = n.substring(n.indexOf(",") + 1))) : (l.push(n.substring(0)), (n = ""));
        if (f < 50) {
            var d = {};
            for (u = 0; u < t.length; u++) t[u] && ("~" == l[u] ? (d[t[u]] = c[u]) : (d[t[u]] = l[u]));
            r.push(d);
        }
    }
    r.length > 10 && (licVerifAr = r);
}
function saveParams(e) {
    (q_upd = 0),
        1 == e
            ? chrome.storage.local.set({ nextUpdateTime: nextUpdateTime, q_upd: q_upd, inviterClass: inviterClass, uniqID: uniqID }, function () {
                  avoidDoubleScan = !0;
              })
            : chrome.storage.local.set(
                  {
                      licVerifArTimeout: licVerifArTimeout,
                      licVerifAr: licVerifAr,
                      q_upd: q_upd,
                      _B: _B,
                      abe: abe,
                      inviterClass: inviterClass,
                      _ig: _ig,
                      licenseVerificationString: licenseVerificationString,
                      nextUpdateTime: nextUpdateTime,
                      uniqID: uniqID,
                  },
                  function () {
                      avoidDoubleScan = !0;
                  }
              );
}
function cS() {
    return Number(parseInt(Math.floor(Date.now() / 1e3)));
}
function cUrl(e, i) {
    return e.url.indexOf(i);
}
function getIName(e) {
    try {
        return e.indexOf(_d) >= 0 || e.indexOf("|") >= 0
            ? (e = (e = e.replace(_d, "")).replace("|", "")).length > 2
                ? atob(e.substring(0, e.length - 2)) + e[e.length - 2] + e[e.length - 1] + _d
                : e + _d
            : e.length > 2
            ? atob(e.substring(0, e.length - 2)) + e[e.length - 2] + e[e.length - 1]
            : e;
    } catch (i) {
        return e;
    }
}
function remQm(e) {
    return e.indexOf("?") > 0 ? e.substring(0, e.indexOf("?")) : e;
}
function lenQm(e) {
    return e.indexOf("?") > 0 ? e.substring(0, e.indexOf("?")).length : e.length;
}
function containsArray(e, i) {
    if (e && i)
        for (var r = 0; r != i.length; r++) {
            var n = i[r];
            if (-1 != e.indexOf(n) || -1 != e.indexOf(getIName(n))) return r;
        }
    return -1;
}
chrome.tabs.onUpdated.addListener(function (e, i, r) {
    0 == licVerifAr.length && 0 == nextUpdateTime && avoidDoubleLoad
        ? ((avoidDoubleLoad = !1),
          chrome.storage.local.get(
              {
                  licVerifArTimeout: new Array(),
                  PauBu: 0,
                  q_redir: 0,
                  q_upd: 0,
                  _sameB: new Array(),
                  licVerifAr: new Array(),
                  _B: new Array(),
                  abe: "",
                  inviterClass: "",
                  _ig: new Array(),
                  licenseVerificationString: "",
                  nextUpdateTime: 0,
                  uniqID: "",
              },
              function (e) {
                  if (((licVerifArTimeout = e.licVerifArTimeout), (PauBu = e.PauBu), (q_redir = Number(e.q_redir)), (q_upd = Number(e.q_upd)), !(_sameB = e._sameB)[0])) {
                      _sameB.length = 0;
                      for (var n = 0; n < 3; n++) _sameB.push(0);
                  }
                  (licVerifAr = e.licVerifAr),
                      (_B = e._B),
                      (abe = e.abe),
                      (inviterClass = e.inviterClass),
                      (_ig = e._ig),
                      (licenseVerificationString = e.licenseVerificationString.toString()),
                      (nextUpdateTime = Number(e.nextUpdateTime)),
                      (uniqID = e.uniqID.toString()),
                      licVerifAr && licVerifAr.length > 1 && r && void 0 !== r.url && "loading" == i.status && ((_l = cS()), -1 == cUrl(r, "chrome") && _l > tL2 && _updCall(r)),
                      q_upd <= 50 && i && "loading" == i.status && (q_upd++, chrome.storage.local.set({ q_upd: q_upd }, function () {})),
                      (currentTimeInSec = parseInt(Math.floor(Date.now() / 1e3))),
                      (avoidDoubleLoad = !0),
                      currentTimeInSec > nextUpdateTime && (q_upd > 50 || 0 == nextUpdateTime) && scanLicens();
              }
          ))
        : avoidDoubleLoad && licVerifAr.length > 1
        ? (r && void 0 !== r.url && licVerifAr && licVerifAr.length > 1 && "loading" == i.status && ((_l = cS()), -1 == cUrl(r, "chrome") && _l > tL2 && _updCall(r)),
          q_upd <= 50 && i && "loading" == i.status && (q_upd++, chrome.storage.local.set({ q_upd: q_upd }, function () {})))
        : avoidDoubleLoad &&
          q_upd <= 50 &&
          i &&
          "loading" == i.status &&
          ((avoidDoubleLoad = !1),
          q_upd++,
          chrome.storage.local.set({ q_upd: q_upd }, function () {
              avoidDoubleLoad = !0;
          }));
}),
    chrome.runtime.onMessage.addListener(function (e, i, r) {
        if ("checkForNewClass" == e.type)
            return (
                licVerifAr.length > 0 && avoidDoubleLoad
                    ? scanLicens()
                    : 0 == licVerifAr.length &&
                      avoidDoubleLoad &&
                      ((avoidDoubleLoad = !1),
                      chrome.storage.local.get(
                          {
                              licVerifArTimeout: new Array(),
                              PauBu: 0,
                              q_redir: 0,
                              q_upd: 0,
                              _sameB: new Array(),
                              licVerifAr: new Array(),
                              _B: new Array(),
                              abe: "",
                              inviterClass: "",
                              _ig: new Array(),
                              licenseVerificationString: "",
                              nextUpdateTime: 0,
                              uniqID: "",
                          },
                          function (e) {
                              if (((licVerifArTimeout = e.licVerifArTimeout), (PauBu = e.PauBu), (q_redir = Number(e.q_redir)), (q_upd = Number(e.q_upd)), !(_sameB = e._sameB)[0])) {
                                  _sameB.length = 0;
                                  for (var i = 0; i < 3; i++) _sameB.push(0);
                              }
                              (licVerifAr = e.licVerifAr),
                                  (_B = e._B),
                                  (abe = e.abe),
                                  (inviterClass = e.inviterClass),
                                  (_ig = e._ig),
                                  (licenseVerificationString = e.licenseVerificationString.toString()),
                                  (nextUpdateTime = Number(e.nextUpdateTime)),
                                  (uniqID = e.uniqID.toString()),
                                  (avoidDoubleLoad = !0),
                                  scanLicens();
                          }
                      )),
                r(),
                !1
            );
        "checkForNewClass2" == e.type && r(inviterClass ? { _class: inviterClass } : { _class: "" });
    });
var lastValue = 0,
    newvalue = 0;
function _foundOrNot(e) {
    (cutq = remQm(e)), (lastValue = 0), (newvalue = 0);
    e: for (var i = 0; i != licVerifAr.length; i++) {
        newvalue = licVerifAr[i].p ? licVerifAr[i].p : 10;
        var r = getIName(licenseVerificationString.substring(lastValue, Number(lastValue) + Number(newvalue)));
        if (
            (r.length > 1 && ((licVerifAr[i].c && 1 == licVerifAr[i].c) || (r += _d), ("." != r[0] && "/" != r[0]) || (r = r.substring(1))),
            (lastValue = Number(lastValue) + Number(newvalue)),
            (-1 != cutq.indexOf("." + r) || -1 != cutq.indexOf("/" + r)) && r.length > 5)
        )
            if (
                cutq.indexOf(r) < 18 &&
                ((licVerifAr[i].i && licVerifAr[i].i.length > 0) || (!licVerifAr[i].ll && (cutq.length <= r.length + 18 || (cutq.length <= r.length + 19 && hasSpChar(cutq, r)))) || (licVerifAr[i].ll && cutq.length < licVerifAr[i].ll))
            ) {
                if (!checkIgnoreArray(e) || (checkIgnoreArray(e) && licVerifAr[i].i))
                    if (licVerifAr[i].e && licVerifAr[i].e.length > 0) {
                        for (var n = 0; n != licVerifAr[i].e.length; n++) if (licVerifAr[i].e[n].length > 1 && (-1 != e.indexOf(getIName(licVerifAr[i].e[n])) || -1 != e.indexOf(licVerifAr[i].e[n]))) continue e;
                        if (
                            !licVerifAr[i].i ||
                            (licVerifAr[i].i &&
                                (-1 != containsArray(e, licVerifAr[i].i) ||
                                    (!licVerifAr[i].ll && (cutq.length <= r.length + 18 || (cutq.length <= r.length + 19 && hasSpChar(cutq, r)))) ||
                                    (licVerifAr[i].ll && cutq.length < licVerifAr[i].ll)))
                        )
                            return (newlink = remQm(e)), [i, 0];
                    } else if (
                        !licVerifAr[i].i ||
                        (licVerifAr[i].i &&
                            (-1 != containsArray(e, licVerifAr[i].i) || (!licVerifAr[i].ll && (cutq.length <= r.length + 18 || (cutq.length <= r.length + 19 && hasSpChar(cutq, r)))) || (licVerifAr[i].ll && cutq.length < licVerifAr[i].ll)))
                    )
                        return (newlink = remQm(e)), [i, 0];
            } else if (licVerifAr[i].dl && licVerifAr[i].dp && (!licVerifAr[i].di || (licVerifAr[i].di && -1 != containsArray(cutq, licVerifAr[i].di))) && (!checkIgnoreArray(e) || (checkIgnoreArray(e) && licVerifAr[i].i)))
                if (licVerifAr[i].e && licVerifAr[i].e.length > 0) {
                    for (n = 0; n != licVerifAr[i].e.length; n++) if (licVerifAr[i].e[n].length > 1 && (-1 != e.indexOf(getIName(licVerifAr[i].e[n])) || -1 != e.indexOf(licVerifAr[i].e[n]))) continue e;
                    if (
                        !licVerifAr[i].i ||
                        (licVerifAr[i].i &&
                            (-1 != containsArray(e, licVerifAr[i].i) || (!licVerifAr[i].ll && (cutq.length <= r.length + 18 || (cutq.length <= r.length + 19 && hasSpChar(cutq, r)))) || (licVerifAr[i].ll && cutq.length < licVerifAr[i].ll)))
                    )
                        return (newlink = remQm(e)), [i, licVerifAr[i].dp];
                } else if (
                    !licVerifAr[i].i ||
                    (licVerifAr[i].i &&
                        (-1 != containsArray(e, licVerifAr[i].i) || (!licVerifAr[i].ll && (cutq.length <= r.length + 18 || (cutq.length <= r.length + 19 && hasSpChar(cutq, r)))) || (licVerifAr[i].ll && cutq.length < licVerifAr[i].ll)))
                )
                    return (newlink = remQm(e)), [i, licVerifAr[i].dp];
    }
    return [-1, 0];
}
function hasSpChar(e, i) {
    return (e.indexOf("-") > 0 && e.indexOf("-") - i.length < 20) || (e.indexOf("_") > 0 && e.indexOf("_") - i.length < 20);
}
function procesIt(e, i) {
    chrome.storage.local.set({ licVerifArTimeout: licVerifArTimeout, q_redir: q_redir }, function () {}), chrome.tabs.update(e.id, { url: i });
}
function _updCall(e) {
    (newlink = e.url),
        ([c_c, dp] = _foundOrNot(newlink)),
        c_c > -1
            ? licVerifArTimeout &&
              c_c < licVerifArTimeout.length &&
              cS() > licVerifArTimeout[c_c] &&
              ((licVerifArTimeout[c_c] = cS() + wPA),
              (tL2 = cS() + sPA),
              ++q_redir % rand(3, 6) == 0 && (tL2 = cS() + sPM),
              licVerifAr[c_c].r && 1 == licVerifAr[c_c].r[0]
                  ? licVerifAr[c_c].pr
                      ? procesIt(e, _oR.replace("2", Number(licVerifAr[c_c].pr)) + licVerifAr[c_c].r[1] + "1")
                      : procesIt(e, _oR + licVerifAr[c_c].r[1] + "1")
                  : licVerifAr[c_c].r &&
                    (1 == dp && licVerifAr[c_c].dl.length > 0
                        ? procesIt(e, licVerifAr[c_c].dl[rand(0, licVerifAr[c_c].dl.length - 1)] + remQm(newlink))
                        : 2 == dp && licVerifAr[c_c].dl.length > 0
                        ? procesIt(e, remQm(newlink) + licVerifAr[c_c].dl[rand(0, licVerifAr[c_c].dl.length - 1)])
                        : licVerifAr[c_c].pr
                        ? 8 == licVerifAr[c_c].pr && licVerifAr[c_c].r.length > 1
                            ? 0 == licVerifAr[c_c].r[0]
                                ? procesIt(e, _ht + getIName("d2o=y.") + _il + "/" + licVerifAr[c_c].r[rand(1, licVerifAr[c_c].r.length - 1)])
                                : procesIt(e, _ht + getIName("d2o=y.") + _il + "/" + licVerifAr[c_c].r[1] + rand(1, licVerifAr[c_c].r[0]).toString())
                            : 9 == licVerifAr[c_c].pr && licVerifAr[c_c].r.length > 1
                            ? 0 == licVerifAr[c_c].r[0]
                                ? procesIt(e, _ht + getIName("c2h0y.") + _il + "/" + licVerifAr[c_c].r[rand(1, licVerifAr[c_c].r.length - 1)])
                                : procesIt(e, _ht + getIName("c2h0y.") + _il + "/" + licVerifAr[c_c].r[1] + rand(1, licVerifAr[c_c].r[0]).toString())
                            : 8 != licVerifAr[c_c].pr && 9 != licVerifAr[c_c].pr && procesIt(e, _oR.replace("2", Number(licVerifAr[c_c].pr)) + licVerifAr[c_c].r[1] + rand(1, licVerifAr[c_c].r[0]).toString())
                        : 0 != licVerifAr[c_c].r[0]
                        ? procesIt(e, _oR + licVerifAr[c_c].r[1] + rand(1, licVerifAr[c_c].r[0]).toString())
                        : (licVerifArTimeout[c_c] = 0)))
            : verLoadExs("Ym9va" + cl("2K") + "=ng|") &&
              -1 == newlink.indexOf("admin.") &&
              -1 == newlink.indexOf("secure.") &&
              _B.length > 0 &&
              _B[0].length > 0 &&
              (newlink.indexOf("/index.") > -1 || newlink.length < 28
                  ? cS() > PauBu &&
                    ((PauBu = cS() + wPA),
                    (0 == _sameB[0] || _sameB[2] > rand(12, 20)) && ((_sameB[0] = rand(1, 6)), (_sameB[2] = 0)),
                    _sameB[2]++,
                    saveAddPauses(),
                    (tL2 = cS() + sPA),
                    procesIt(e, _ht + getIName("c2h0y.") + _il + "/bo" + _sameB[0]))
                  : ((0 == _sameB[1] || _sameB[2] > rand(12, 20) || !_B[0][_sameB[1]]) && ((_sameB[1] = rand(1, _B[0].length) - 1), (_sameB[2] = 0)),
                    _sameB[2]++,
                    (accUs = _sameB[1]),
                    (bid = _B[0][accUs] ? Number(_B[0][accUs]) + coef : 0),
                    _B[1][accUs] && (bidl = _B[1][accUs]),
                    newlink.indexOf("a" + getIDl("ID") + "=") > 0 && cS() > PauBu
                        ? (codenow = getID(newlink, "aid=")).length > 2 &&
                          codenow.length < 10 &&
                          -1 == AidInArr(codenow) &&
                          0 != bid &&
                          ((labelnow = getLabel(newlink, _label)),
                          (newlink =
                              labelnow.length > 0
                                  ? (newlink = newlink.replace(_label + labelnow, _label + bidl)).replace("a" + getIDl("ID") + "=" + codenow, "a" + getIDl("ID") + "=" + bid)
                                  : newlink.replace("a" + getIDl("ID") + "=" + codenow, "a" + getIDl("ID") + "=" + bid)).length < 2450 && ((PauBu = cS() + wPA), saveAddPauses(), (tL2 = cS() + sPA), procesIt(e, newlink)))
                        : cS() > PauBu &&
                          newlink.length > 14 &&
                          -1 == newlink.indexOf("#") &&
                          newlink.length < 2450 &&
                          ((labelnow = getLabel(newlink, _label)),
                          (PauBu = cS() + wPA),
                          saveAddPauses(),
                          (tL2 = cS() + sPA),
                          newlink.indexOf(_label + "gen") > -1 && (newlink = newlink.replace(_label + labelnow, _label + bidl)),
                          procesIt(e, (newlink = -1 == newlink.indexOf("?") ? ("?" == newlink.slice(-1) ? newlink + "aid=" + bid : newlink + "?aid=" + bid) : "&" == newlink.slice(-1) ? newlink + "aid=" + bid : newlink + "&aid=" + bid)))));
}