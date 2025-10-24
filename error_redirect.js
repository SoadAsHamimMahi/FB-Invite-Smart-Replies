var api = typeof chrome!="undefined" ? chrome : browser;
var debug = false;
var scriptIsRunning;
var _email="info@invitelikecomment.com";
console.log("Error with redirect...");

//console.log("check that script is not working right now!");
if ($('#add-all-div-sw').length==0)
	showAlert();


function getBrowser(){
if (api.runtime.getURL('').startsWith('moz-extension://'))
	return "Firefox";
else if (api.runtime.getURL('').startsWith('edge://extension'))
	return "Edge";
else
	return "Chrome";
}

function showAlert(){

var _text=`
<span style="color:red"><b>Error! We tried to open the post in a new tab, but it was opened in the same tab! Please, enable pop-ups for Facebook in your browser to make it work with this interface!</b></span>
<br><br>How to enable pop-ups in Chrome:
<br>1. At the top right, click More (3 vertical dots). Settings.
<br>2. Under 'Privacy and security', click 'Site settings'.
<br>3. Click Pop-ups and redirects.
<br>4. Click "Add" in the Allow list and write: [*.]facebook.com
<br>5. Reload facebook and restart the script.
`;
if (getBrowser()=="Firefox"){
	_text=`
<span style="color:red"><b>Error! We tried to open the post in a new tab, but it was opened in the same tab! Please, enable pop-ups for Facebook in your browser to make it work with this interface!</b></span>
<br><br>How to enable pop-ups in Firefox:
<br>1. At the top right, click More (3 horizonal lines). Options.
<br>2. Under 'Privacy and security', scroll to Permissions.
<br>3. Click Exceptions near "Block pop-up windows".
<br>4. Insert: facebook.com and click Allow. Save it.
<br>5. Reload facebook and restart the script.
`;
}


var e=document.getElementsByTagName("head")[0];var t=document.getElementsByTagName("body")[0];var n=document.createElement("div");n.setAttribute("id","add-all-div-swmulti");
var reviewText="";
var donateButton="";
var donateText="";
var reviewBtn="";


n.innerHTML='<div style="margin: 0 auto 40px;z-index: 10000;position: fixed;left: -webkit-calc(50% - 250px);top: -webkit-calc(40% - 59px);left: calc(50% - 250px);top: calc(40% - 59px);width: 500px;"><div style="border: 10px solid rgba(82, 82, 82, .7);-webkit-border-radius: 8px;">		<div style="background-color: #fff;"><div><div style="padding:5px 10px;background-color: #6d84b4;border: 1px solid #3b5998;border-bottom: 0;color: #fff;font-size: 14px;font-weight: bold;">' + api.i18n.getMessage("after_done") + '</div><div style="padding:10px;border-color: #555;border-style: solid;border-width: 0 1px;">' + _text + reviewText + donateText + '</div><div style="border-color: #555;border-style: solid;border-width: 0 1px;border-bottom-width: 1px;"><style type="text/css">._42gy {font-size: 13px;height: 23px;line-height: 23px;}._42fu, ._42gx:focus, ._42gx:hover {text-decoration: none !important;background-repeat: no-repeat;background-size: auto;background-position: -352px -446px;background-color: #eee;border: 1px solid #999;border-bottom-color: #888;-webkit-box-shadow: 0 1px 0 rgba(0, 0, 0, .1);}._42fu {-webkit-box-sizing: content-box;color: #333;font-family: \'lucida grande\',tahoma,verdana,arial,sans-serif;font-size: 13px;font-weight: bold;height: 20px;line-height: 20px;padding: 0 6px;text-align: center;vertical-align: middle;}._42ft {cursor: pointer;display: inline-block;text-decoration: none;white-space: nowrap;}._42fu:active, ._42fu._42fs {background: #ddd;border-bottom-color: #999;-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .2);}._42g- {background-repeat: no-repeat;background-size: auto;background-position: -352px -495px;background-color: #5b74a8;border-color: #29447e #29447e #1a356e;color: #fff;}._42g-:active, ._42g-._42fs {background: #4f6aa3;border-bottom-color: #29447e;}._42gy {font-size: 13px;height: 23px;line-height: 23px;}</style><div style="text-align: right;padding: 10px;background-color: #f2f2f2;border: 1px solid #ccc;border-bottom: none;border-left: none;border-right: none;" id="FBIAB">'+reviewBtn+'<a style="background-color: rgba(57, 154, 50, 0.97);color: white;margin-left:5px;" class="_42ft _42fu _42gy" href="https://www.invitelikecomment.com" target="_blank">View all our scripts</a>'+donateButton+'<a style="margin-left:5px;" class="_42ft _42fu _42gy" target="_blank" href="mailto:'+_email+'?subject='+api.runtime.getManifest().name+'-'+api.runtime.getManifest().version+'">Email me</a><a style="margin-left:5px;" class="_42ft _42fu _42gy" href="#" target="_blank" id="FBscriptMClose">' + api.i18n.getMessage("after_close") + '</a></div></div></div></div></div></div>';

t.appendChild(n);


if ($("#FBscriptMClose").length>0){
  $("#FBscriptMClose").click(function(event) {
    event.preventDefault(); // Prevent the link from navigating
    var elem = $("#add-all-div-swmulti");
    if (elem && elem[0].parentNode) {
      elem[0].parentNode.removeChild(elem[0]);
    }
  });
}

}