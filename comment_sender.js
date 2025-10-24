//20200926 - this part for IFRAME (new UI bug fix
console.log("loaded");
var elemTemp1=document.querySelectorAll('[unExsistsElemForSure="true"]');
var elemReturn = document.querySelectorAll('[unExsistsElemForSure="true"]');
function querySelectorVerify(a1){
	console.log("ELEM INSIDE IFRAME:"+a1.length);
	if (a1.length>0){
		elemTemp1=a1;
	}
}
function querySelectorAllIFrame(txt){
	elemTemp1.length=0;
	elemReturn = document.querySelectorAll(txt);
	if (elemReturn.length==0){
		if (document.querySelectorAll('iframe') && document.querySelectorAll('iframe').length>0){
			try {
					document.querySelectorAll('iframe').forEach( item =>
						querySelectorVerify(item.contentWindow.document.body.querySelectorAll(txt))
				)
				if (elemTemp1.length>0)
					elemReturn=elemTemp1;
				elemTemp1.length=0;
				
			}
			catch(err) {
				elemReturn = document.querySelectorAll(txt);
			}
		}
	}
return elemReturn;
}
// iframe END



// read the phrase and search for it
function foundElement_invite_comm(){
	console.log("lets run it2");
  var spans = getAllElementsWithAttribute('data-text');
  var searchText = "";
  if (document.getElementById('invite-shared-elem-comment'))
	  searchText=document.getElementById('invite-shared-elem-comment').innerHTML;
  var found;
  var posted=0;
//disable search for the comment, use attribute always
	//for (var i = 0; i < spans.length; i++) {
	//if (spans[i].textContent === searchText) {
		//found = spans[i];
		//posted = 1;
		console.log('found', found);
		//submitComment(found);
		//break;
	//}
	//}
  if (posted==0){
	  // search by attribute
	  console.log("search by attribute");
	if (querySelectorAllIFrame('[data-comment-sender="true"]') && querySelectorAllIFrame('[data-comment-sender="true"]').length==1){
		console.log("Q found");
		found=querySelectorAllIFrame('[data-comment-sender="true"]')[0];
		found.setAttribute("data-comment-sender", "false");
		console.log("elem");
		console.log(found);
		console.log(found.innerHTML);
		console.log('Posting comment');
		submitComment(found);
		posted=1;
	}
  }
  if (posted==0){
	console.log("search by text");
  	for (var i = 0; i < spans.length; i++) {
	if (spans[i].textContent === searchText) {
		found = spans[i];
		posted = 1;
		console.log('found', found);
		submitComment(found);
		break;
	}
	}
  }
}

function getAllElementsWithAttribute(attribute)
{
  var matchingElements = [];
  var allElements = document.getElementsByTagName('span');
  for (var i = 0, n = allElements.length; i < n; i++) {
    if (allElements[i].getAttribute(attribute) !== null) {
      matchingElements.push(allElements[i]);
    }
  }
  return matchingElements;
}
  var myevent;
  var firsttime=true;
function submitComment(el) {

console.log("post");
if (firsttime){
  if(document.createEvent) {
	  console.log("E1");
    myevent = document.createEvent("HTMLEvents");
    myevent.initEvent('keydown', true, true);
  } else {
	  console.log("E2");
    myevent = document.createEventObject();
    myevent.eventType = 'keydown';
  }

  myevent.eventName = 'keydown';
  myevent.keyCode = 13;
  myevent.which = 13;
  firsttime=false;
}
  if(document.createEvent) {
	  console.log("E3");
    el.dispatchEvent(myevent);
  } else {
	  console.log("E4");
    el.fireEvent("on" + myevent.eventType, myevent);
  }
}