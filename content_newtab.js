var api = typeof chrome!="undefined" ? chrome : browser;
//works only on FB website and only under specific situations
var debug = false;
var scriptIsRunning;
var iconClicked;
var iconClicked2;
var userClickedOnIcon=false;
var commentSenderLoaded;


var c_c1;
if (typeof _c1 !== 'undefined' && _c1){
	c_c1=_c1;
}
var c_c2;
if (typeof _c2 !== 'undefined' && _c2){
	c_c2=_c2;
}
var c_c3;
if (typeof _c3 !== 'undefined' && _c3){
	c_c3=_c3;
}

//console.log("FILE WAS RUNNING 0");

// iFrame Support!!!
function getElem(code,non){
// без not
if (non){
	if ($(code).not(non).length>0){
		return $(code).not(non);
	}else{
		try {
			if ($('iframe').first().contents().find(code).not(non).length>0){
				return $('iframe').first().contents().find(code).not(non);
			}else if ($('iframe').last().contents().find(code).not(non).length>0){
				return $('iframe').last().contents().find(code).not(non);
			}
		}
		catch(err) {
		}
	}
}else{
	if ($(code).length>0){
		return $(code);
	}else{
		try {
			if ($('iframe').first().contents().find(code).length>0){
				return $('iframe').first().contents().find(code);
			}else if ($('iframe').last().contents().find(code).length>0){
				return $('iframe').last().contents().find(code);
			}
		}
		catch(err) {
		}
	}
}
//default return element with 0 length for sure!
//return $('.CODENOTFOUND .la .errorMy');
if (non){
	return $(code).not(non);
}else{
	return $(code);
}
}






// 202004 Facebook  new NEW design!!
var scanByNameNewUI=false;
var inviteFailed=0; // 0 - все ок, 1/2 - ждем по 10 сек и нажимаем еще раз, после второго идем к след элементу пропуская этот, 3 - СТОПАЕМ СКРИПТ и показываем лимит.
var likeButtonsElaborated=0;
var stringForjQuerySearch=""; // only Invite + Invited
var stringForjQuerySearch2=""; // all of them!
var currentFbLang="";
var usedFbLang="";
var newFBinviteDesign=false;
var scrollingNewFBDesignClassDef=".xb57i2i.xkhd6sd"; // default, always check it and do not change! IMPORTANT! USE only one! DO not use comma or select buttons inside this elem will not work!
var scrollingNewFBDesignClass=".xb57i2i.xkhd6sd";
var checkInsideScrolledWindow=""; // to avoid finding them who knows where, we check only inside scroll area
var searchInAllLangArray1=Array();
var searchInAllLangArray2=Array();
var tempreturnNumber=0;
var tempreturnNumber2=0;
var newFBinviteDesignFromSourceCode=false;
function isThisNewFbDesign2020(){
	if (newFBinviteDesignFromSourceCode!="")
		return newFBinviteDesignFromSourceCode;
	else{
		if ((getElem('html').length>0 && ((getElem('html').attr('dir') && getElem('html').attr('dir')=="ltr") || (getElem('body').attr('dir') && getElem('body').attr('dir')=="ltr"))) || (getElem(scrollingNewFBDesignClass).length>0 || getElem(scrollingNewFBDesignClassDef).length>0)){
			newFBinviteDesignFromSourceCode=true;
		}
		return newFBinviteDesignFromSourceCode;
	}
}
function getCurrentFbLang(){
	if (currentFbLang!="")
		return currentFbLang;
	else{
		if (getElem('html').length>0 && getElem('html').attr('lang') && getElem('html').attr('lang').replace('-','').length>1){
			currentFbLang=getElem('html').attr('lang').replace('-','');

			//20201013 for Spanish global instead of es it shows EN fix!
			if (currentFbLang=="en" && getElem('body.Locale_es_LA').length==1)
				currentFbLang="es";
			if (getElem('body.Locale_ar_AR').length==1)
				currentFbLang="ar";
			if (getElem('body.Locale_zh_HK').length==1)
				currentFbLang="zh-Hanh";
		}
		return currentFbLang;
	}
}
var fbInviteBtnArrayLang=Array('en','it','da','de','et','es','tl','fr','hr','lv','lt','hu','mt','nl','no','nb','pl','pt','ro','sl','sv','fi','tr','cs','el','be','bg','mk','ru','uk','he','ar','fa','th','ka','cn','jp','ja','ko','vi','hi','zhHant','zhHans','zhHanh','jv','ms','ca');
var fbInviteBtnArray={
en:{
	lan:'en', // English & Spanish is shown as English so we add it here.
	inv:['Invite','Invitar'],
	inv2:['Invited','Invitado','Invitado(a)'],
	oth:['Like','Liked','Follow','Unfollow','Me gusta','Te gusta','Seguir'],
	comment:['Comment'],
	likeButton:['Like','Me gusta'],
	addFriend:['Add Friend','Agregar','Añadir'],
	leaveAComment:['Leave a comment']
},
it:{
	lan:'it', // Italiano
	inv:['Invita'],
	inv2:['Invitato/a','Utente invitato'],
	oth:['Mi piace','Ti piace','Segui'],
	comment:['Commenta'],
	likeButton:['Mi piace'],
	addFriend:['Aggiungi'],
	leaveAComment:['Lascia un commento']
},
da:{
	lan:'da', // Dansk
	inv:['Inviter'],
	inv2:['Inviteret'],
	oth:['Synes godt om'],
	comment:['Kommenter'],
	likeButton:['Synes godt om'],
	addFriend:['Tilføj ven'],
	leaveAComment:['Skriv en kommentar']
},
de:{
	lan:'de', // Deutsch
	inv:['Einladen'],
	inv2:['Gefällt dir','Eingeladen'],
	oth:['Like','Gefällt dir','Abonnieren'],
	comment:['Kommentieren'],
	likeButton:['Gefällt mir'],
	addFriend:['Freund/in hinzufügen'],
	leaveAComment:['Kommentar hinterlassen']
},
et:{
	lan:'et', // Eesti
	inv:['Kutsu'],
	inv2:['Kutsutud'],
	oth:['Meeldib'],
	comment:['Kommenteeri'],
	likeButton:['Meeldib'],
	addFriend:['Lisa sõbraks'],
	leaveAComment:['Jäta kommentaar']
},
es:{
	lan:'es', // Español
	inv:['Invitar'],
	inv2:['Invitado','Invitado(a)'],
	oth:['Me gusta','Te gusta','Seguir'],
	comment:['Comentar'],
	likeButton:['Me gusta'],
	addFriend:['Agregar','Añadir'],
	leaveAComment:['Dejar un comentario']
},
tl:{
	lan:'tl', // Filipino
	inv:['Imbitahan'],
	inv2:['Invited'],
	oth:['I-like','Liked'],
	comment:['Mag-comment'],
	likeButton:['I-like'],
	addFriend:['I-add na Friend'],
	leaveAComment:['Mag-iwan ng komento']
},
fr:{
	lan:'fr', // Francais
	inv:['Inviter'],
	inv2:['Invité(e)','En attente'],
	oth:['J’aime','J’aime déjà','S’abonner'],
	comment:['Commenter'],
	likeButton:['J’aime'],
	addFriend:['Ajouter'],
	leaveAComment:['Laissez un commentaire']
},
hr:{
	lan:'hr', // Hrvatski
	inv:['Pozivnica'],
	inv2:['Pozvani'],
	oth:['Sviđa mi se','Sviđa vam se',"Follow"],
	comment:['Komentar'],
	likeButton:['Sviđa mi se'],
	addFriend:['Dodaj'],
	leaveAComment:['Napišite komentar']
},
lv:{
	lan:'lv', // Latviešu
	inv:['Uzaicināt'],
	inv2:['Uzaicināti'],
	oth:['Patīk'],
	comment:['Komentēt'],
	likeButton:['Patīk'],
	addFriend:['Pievienot draugu'],
	leaveAComment:['Pievienot komentāru']
},
lt:{
	lan:'lt', // Lietuvių
	inv:['Invite'],
	inv2:['Pakviesta'],
	oth:['Patinka','Patiko'],
	comment:['Komentuoti'],
	likeButton:['Patinka'],
	addFriend:['Pridėti prie draugų'],
	leaveAComment:['Komentuoti']
},
hu:{
	lan:'hu', // Magyar
	inv:['Meghívás','Ajánlás'],
	inv2:['Meghívva','Ajánlás elküldve'],
	oth:['Tetszik','Kedveli'],
	comment:['Hozzászólás'],
	likeButton:['Tetszik'],
	addFriend:['Jelölés'],
	leaveAComment:['Hozzászólás írása',"Követem"]
},
mt:{
	lan:'mt', // Malti
	inv:['Invite'],
	inv2:['Mistiedna'],
	oth:['Jogħġobni','Intogħġob'],
	comment:['Ikkummenta'],
	likeButton:['Jogħġobni'],
	addFriend:['Żid bħala Ħabib/a'],
	leaveAComment:['Ħalli kumment']
},
nl:{
	lan:'nl', // Nederlands
	inv:['Uitnodigen'],
	inv2:['Uitgenodigd'],
	oth:['Vind ik leuk'],
	comment:['Opmerking plaatsen'],
	likeButton:['Vind ik leuk'],
	addFriend:['Toevoegen','Toevoegen als vriend'],
	leaveAComment:['Opmerking plaatsen','Volgen']
},
no:{
	lan:'no', // Norsk ??
	inv:['Inviter'],
	inv2:['Invitert','Inviterte'],
	oth:['Liker','Likt','Lik dette','Følg','Slutt å følge'],
	comment:['Kommenter'],
	likeButton:['Liker'],
	addFriend:['Legg til venn'],
	leaveAComment:['Skriv en kommentar']
},
nb:{
	lan:'nb', // Norsk (bo)
	inv:['Inviter'],
	inv2:['Invitert','Inviterte'],
	oth:['Liker','Likt','Lik dette','Følg','Slutt å følge'],
	comment:['Kommenter'],
	likeButton:['Liker'],
	addFriend:['Legg til venn'],
	leaveAComment:['Skriv en kommentar']
},
pl:{
	lan:'pl', // Polski
	inv:['Zaproś'],
	inv2:['Zaproszono'],
	oth:['Lubię to!','Polubiono'],
	comment:['Komentarz'],
	likeButton:['Like'],
	addFriend:['Dodaj'],
	leaveAComment:['Dodaj komentarz']
},
pt:{
	lan:'pt', // Portuguese
	inv:['Convidar'],
	inv2:['Convidado'],
	oth:['Gosto','Gostou','Curtir','Curtiu','Seguir'],
	comment:['Comentar'],
	likeButton:['Gosto'],
	addFriend:['Adicionar'],
	leaveAComment:['Deixe um comentário']
},
ro:{
	lan:'ro', // Romana
	inv:['Invită'],
	inv2:['A primit invitaţie','Invitat(ă)'],
	oth:['Îmi place','A apreciat'],
	comment:['Comentează'],
	likeButton:['Îmi place'],
	addFriend:['Adaugă'],
	leaveAComment:['Lasă un comentariu']
},
sk:{
	lan:'sk', // Slovenčina + Slovenščina
	inv:['Pozvať','Povabi'],
	inv2:['Invited'],
	oth:['Páči sa mi to','Páčilo sa mi to','Všeč mi je'],
	comment:['Komentovať'],
	likeButton:['Páči sa mi to'],
	addFriend:['Pridať priateľa','Dodaj prijatelja'],
	leaveAComment:['Pridať komentár']
},
sl:{
	lan:'sl', // Slovenčina + Slovenščina
	inv:['Pozvať','Povabi'],
	inv2:['Invited'],
	oth:['Páči sa mi to','Páčilo sa mi to','Všeč mi je'],
	comment:['Komentovať'],
	likeButton:['Páči sa mi to'],
	addFriend:['Pridať priateľa','Dodaj prijatelja'],
	leaveAComment:['Pridať komentár']
},
sv:{
	lan:'sv', // Svenska
	inv:['Bjuda in'],
	inv2:['Inbjuden'],
	oth:['Gilla','Har gillat'],
	comment:['Kommentera'],
	likeButton:['Gilla'],
	addFriend:['Lägg till vän'],
	leaveAComment:['Kommentera']
},
fi:{
	lan:'fi', // Suomi
	inv:['Kutsu'],
	inv2:['Kutsuttu'],
	oth:['Tykkää','Tykkäsi'],
	comment:['Kommentti'],
	likeButton:['Tykkää'],
	addFriend:['Lisää kaveriksi'],
	leaveAComment:['Jätä kommentti']
},
tr:{
	lan:'tr', // Türkçe
	inv:['Davet Et'],
	inv2:['Davet Edildi'],
	oth:['Beğen','Beğendi'],
	comment:['Yorum Yap'],
	likeButton:['Beğen'],
	addFriend:['Arkadaşı Ekle'],
	leaveAComment:['Yorum bırak']
},
cs:{
	lan:'cs', // Čeština
	inv:['Pozvat'],
	inv2:['Pozván(a)'],
	oth:['To se mi líbí','Tohle se mi líbí'],
	comment:['Okomentovat'],
	likeButton:['To se mi líbí'],
	addFriend:['Přidat přítele'],
	leaveAComment:['Zanechte vzkaz']
},
el:{
	lan:'el', // Ελληνικά
	inv:['Πρόσκληση'],
	inv2:['Έχει προσκληθεί'],
	oth:['Μου αρέσει!','Δήλωσε ότι του αρέσει'],
	comment:['Σχόλιο'],
	likeButton:['Μου αρέσει!'],
	addFriend:['Προσθήκη'],
	leaveAComment:['Αφήστε ένα σχόλιο']
},
be:{
	lan:'be', // Belarusian
	inv:['Запрасіць'],
	inv2:['Запрошана'],
	oth:['Падабаецца','Liked'],
	comment:['Каментаваць'],
	likeButton:['Падабаецца'],
	addFriend:['Дадаць да сяброў'],
	leaveAComment:['Пакіньце каментарый']
},
bg:{
	lan:'bg', // Български
	inv:['Invite'],
	inv2:['Invited'],
	oth:['Liked','Харесва ми','Харесване'],
	comment:['Коментар'],
	likeButton:['Харесване'],
	addFriend:['Добавяне'],
	leaveAComment:['Оставете коментар']
},
mk:{
	lan:'mk', // Македонски
	inv:['Покани'],
	inv2:['Invited'],
	oth:['Liked','Ми се допаѓа'],
	comment:['Коментирај'],
	likeButton:['Ми се допаѓа'],
	addFriend:['Додај пријател'],
	leaveAComment:['Остави коментар']
},
ru:{
	lan:'ru', // русский
	inv:['Пригласить'],
	inv2:['Приглашение отправлено','Приглашен(-а)'],
	oth:['Нравится','Подписаться'],
	comment:['Комментировать'],
	likeButton:['Нравится'],
	addFriend:['Добавить'],
	leaveAComment:['Оставьте комментарий']
},
uk:{
	lan:'uk', // ukraine
	inv:['Запросити'],
	inv2:['Invited','Запрошено'],
	oth:['Liked','Подобається'],
	comment:['Коментувати'],
	likeButton:['Подобається'],
	addFriend:['Додати друга'],
	leaveAComment:['Залишити коментар']
},
he:{
	lan:'he', // עברית
	inv:['הזמן'],
	inv2:['הוזמן'],
	oth:['לייק','סימנת בלייק'],
	comment:['תגובה'],
	likeButton:['לייק'],
	addFriend:['הוספה לחברים'],
	leaveAComment:['השאירי תגובה']
},
ar:{
	lan:'ar', // العربية
	inv:['دعوة'],
	inv2:['مدعو'],
	oth:['أعجبني','أعجبك'],
	comment:['تعليق'],
	likeButton:['أعجبني'],
	addFriend:['add friend'],
	leaveAComment:['كتابة تعليق']
},
fa:{
	lan:'fa', // فارسی
	inv:['دعوت'],
	inv2:['دعوت‌شده'],
	oth:['پسندیدن','پسندیده است'],
	comment:['نظر'],
	likeButton:['پسندیدن'],
	addFriend:['دوست شوید'],
	leaveAComment:['نظر بدهید']
},
th:{
	lan:'th', // ภาษาไทย
	inv:['เชิญ'],
	inv2:['เชิญแล้ว'],
	oth:['ถูกใจ','ถูกใจแล้ว'],
	comment:['แสดงความคิดเห็น'],
	likeButton:['ถูกใจ'],
	addFriend:['เพิ่มเป็นเพื่อน'],
	leaveAComment:['แสดงความคิดเห็น']
},
ka:{
	lan:'ka', // ქართული
	inv:['მოწვევა'],
	inv2:['მოწვეულია'],
	oth:['Liked','მოწონება','მომწონს'],
	comment:['კომენტარი'],
	likeButton:['მომწონს'],
	addFriend:['მეგობრის დამატება'],
	leaveAComment:['დატოვეთ კომენტარი']
},
cn:{
	lan:'cn', // 中文(台灣) китайские
	inv:['邀請','邀请'],
	inv2:['已邀請','已邀请'],
	oth:['讚','已說讚','赞','赞了','讚好','已讚好'],
	comment:['留言'],
	likeButton:['讚'],
	addFriend:['加朋友'],
	leaveAComment:['留言']
},
zhHant:{
	lan:'zhHant', // different cinese: taiwan 中文(台灣)
	inv:['邀請'],
	inv2:['已邀請'],
	oth:['讚','已說讚'],
	comment:['回應'],
	likeButton:['讚'],
	addFriend:['加朋友'],
	leaveAComment:['留下回應']
},
zhHans:{
	lan:'zhHans', // different cinese: semplified 中文(简体)
	inv:['邀请'],
	inv2:['已邀请'],
	oth:['赞','赞了','关注'],
	comment:['评论'],
	likeButton:['赞'],
	addFriend:['加为好友'],
	leaveAComment:['发表评论']
},
zhHanh:{
	lan:'zhHanh', // different cinese: hong kong bug 中文(香港)
	inv:['邀請'],
	inv2:['已邀請'],
	oth:['讚好','已讚好','追蹤'],
	comment:['回應'],
	likeButton:['讚好'],
	addFriend:['加為朋友'],
	leaveAComment:['留下回應']
},
jp:{
	lan:'jp', // japanese 日本語
	inv:['招待'],
	inv2:['招待されています','呼ばれとる人'],
	oth:['いいね！','「いいね！」しました','ええやん！'],
	comment:['コメントする'],
	likeButton:['いいね！'],
	addFriend:['友達になる'],
	leaveAComment:['コメントする']
},
ja:{
	lan:'ja', // japanese 日本語
	inv:['招待'],
	inv2:['招待されています','呼ばれとる人'],
	oth:['いいね！','「いいね！」しました','ええやん！'],
	comment:['コメントする'],
	likeButton:['いいね！'],
	addFriend:['友達になる'],
	leaveAComment:['コメントする']
},
ko:{
	lan:'ko', // 한국어
	inv:['요청'],
	inv2:['요청됨'],
	oth:['좋아요'],
	comment:['댓글 달기'],
	likeButton:['좋아요'],
	addFriend:['친구 추가'],
	leaveAComment:['댓글 남기기']
},
vi:{
	lan:'vi', // Tiếng Việt
	inv:['Mời'],
	inv2:['Đã mời'],
	oth:['Thích','Đã thích'],
	comment:['Bình luận'],
	likeButton:['Thích'],
	addFriend:['Thêm bạn bè'],
	leaveAComment:['Viết bình luận']
},
hi:{
	lan:'hi', // different indian: मराठी    हिन्दी  বাংলা  ગુજરાતી  etc
	inv:['Invite','आमंत्रित करें'],
	inv2:['आमंत्रित','Invited'],
	oth:['आवडले','आवडलेले','पसंद करें','पसंद किया','লাইক করুন','Liked','પસંદ કર્યું','પસંદ કરો'],
	comment:['कमेंट करें'],
	likeButton:['आवडले'],
	addFriend:['मित्र जोडा'],
	leaveAComment:['टिप्पणी करें']
},
jv:{
	lan:'jv', // Javanese - Basa Jawa
	inv:['Ngundang'],
	inv2:['Diundang'],
	oth:['Seneng'],
	comment:['Komentar'],
	likeButton:['Seneng'],
	addFriend:['Tambah Kanca'],
	leaveAComment:['Ninggali tanggepan']
},
ms:{
	lan:'ms', // Bahasa Melayu
	inv:['Invite'],
	inv2:['Dijemput'],
	oth:['Suka','Liked','Ikut'],
	comment:['Komen'],
	likeButton:['Suka'],
	addFriend:['Tambah Rakan'],
	leaveAComment:['Tinggalkan komen']
},
ca:{
	lan:'ca', // Català
	inv:['Convida'],
	inv2:['Convidats'],
	oth:['M\'ha agradat','Segueix'],
	comment:['Comenta'],
	likeButton:['M\'agrada'],
	addFriend:['Afegeix'],
	leaveAComment:['Write a comment']
}, // НЕ ЗАБЫВАТЬ ДОБАВЛЯТЬ ЯЗЫКИ НОВЫЕ В АРРЕЙ fbInviteBtnArrayLang через который идет поиск!!!!!


};


var fbEmotionsBtnArray={
oldEmoClass:{ // это классы, поэтому точка в начале
	like:['.sx_7afd17','.sx_86b67d','.sx_351704','.sx_a971b3'],
	love:['.sx_48d270','.sx_d97dc9','.sx_59d6f8','.sx_7e36d4'],
	haha:['.sx_ae9006','.sx_8627fe','.sx_dd8f5a','.sx_45e823'],
	wow:['.sx_380365','.sx_3c0ae5','.sx_042cc2','.sx_419b17'],
	sad:['.sx_237696','.sx_26fc6a','.sx_24bed0','.sx_b43c4f'],
	care:['.sx_239a9d'],
	angry:['.sx_552061','.sx_c1a7c1','.sx_218204','.sx_e08ca0']
},
oldEmoText:{
	like:'reacted with Like', // cast lower here
	love:'reacted with Love',
	haha:'reacted with Haha',
	wow:'reacted with Wow',
	sad:'reacted with Sad',
	care:'reacted with Care',
	angry:'reacted with Angry'
},
newEmoLink:{ // это имена ФАЙЛОВ, поэтому без точки в начале
	like:['kcvCNizVjn7sw','dOJFaVZihS_','XNiSml5lbzb','fqb8rfFxpfX','tc5IAx58Ipa','L3l7S5zaUNIcxYJ4uUPCNDlXP','lKwYrzcNLupv27','1635855486666999'], // первый это большой сверху, второй это мелкий возле профайл пикчур и тд все мелкие потом
	love:['p59iYz6MDdtqgcTZw','emi3_1IpGVz','T0C85G0d1wU','r4h1SXzlm0B','MB1XWOdQjV0','hCqkOc3spA_jeOHZBc-iWlwewzM','jmJufFtJoVJCUklu','1678524932434102'],
	haha:['fVK3zAMCRSiYtsWTpWSid0DJlPasg','yzxDz4ZUD49','4p2OacwLD66','yMAXL0cdq9q','bkP6GqAFgZ_','qaYFNgTSXlvM4nCbmBfRzzGxNu8','ZXzVvFJ_KvvB4','115940658764963'],
	wow:['7MBZ2WKuJXvOK6WdOQfGi2Ixg9Sd','qZOYbiV8BHS','Sn9UlMA89ls','7-3YmWpFyGJ','tHO3j6Ngeyx','FqjvZsZw6gGAhzX1fLhIoNydmCt','4BTtfpxJ2KfylUgpq','478547315650144'],
	sad:['o0cYKS_GprBBJlcwiBHomFx7hQ','dhZwLwMz9U7','jxIs0b3ls9g','bltK5gY9gdu','1eqxxZX7fYp','bdRgKREz_QwfdpBYw58UhnXQ','y8lxxQ9edz-6r6_o9YroQ','908563459236466'],
	care:['QTVmPoFjk5O','p_-PTXnrxIv','C2OIiRxzS02cOuKEoo'],
	angry:['BEent1vmcy8MXOQt0msew','i6eZvvUMZW5','Xz-3pbeBbW-','3uLTUTwjP7O','PByJ079GWfl','Vvist1cde3YJ3mCMK0A6yjn-D-','4Bm3UKlJBnXJyqwKsR','444813342392137']
}

};
function getStringBtnByLang(lang,secondVariableGenerate){
	if (checkInsideScrolledWindow==""){
		if (getElem(scrollingNewFBDesignClass).length>0)
			checkInsideScrolledWindow=scrollingNewFBDesignClass+" ";
		else if (getElem(scrollingNewFBDesignClassDef).length>0)
			checkInsideScrolledWindow=scrollingNewFBDesignClassDef+" ";
	}
	if (lang && lang.length>1 && fbInviteBtnArray[lang]){
		for (i = 0; i < fbInviteBtnArray[lang]['inv'].length; i++) {
			if (secondVariableGenerate){
				if (stringForjQuerySearch!="")
					stringForjQuerySearch=stringForjQuerySearch+",";
				stringForjQuerySearch=stringForjQuerySearch+checkInsideScrolledWindow+'span>span:contains("'+fbInviteBtnArray[lang]["inv"][i]+'")';
			}
			if (stringForjQuerySearch2!="")
				stringForjQuerySearch2=stringForjQuerySearch2+",";
			stringForjQuerySearch2=stringForjQuerySearch2+checkInsideScrolledWindow+'span>span:contains("'+fbInviteBtnArray[lang]["inv"][i]+'")';
		}
		for (i = 0; i < fbInviteBtnArray[lang]['inv2'].length; i++) {
			if (secondVariableGenerate){
				if (stringForjQuerySearch!="")
					stringForjQuerySearch=stringForjQuerySearch+",";
				stringForjQuerySearch=stringForjQuerySearch+checkInsideScrolledWindow+'span>span:contains("'+fbInviteBtnArray[lang]["inv2"][i]+'")';
			}
			if (stringForjQuerySearch2!="")
				stringForjQuerySearch2=stringForjQuerySearch2+",";
			stringForjQuerySearch2=stringForjQuerySearch2+checkInsideScrolledWindow+'span>span:contains("'+fbInviteBtnArray[lang]["inv2"][i]+'")';
		}
		for (i = 0; i < fbInviteBtnArray[lang]['oth'].length; i++) {
			if (stringForjQuerySearch2!="")
				stringForjQuerySearch2=stringForjQuerySearch2+",";
			stringForjQuerySearch2=stringForjQuerySearch2+checkInsideScrolledWindow+'span>span:contains("'+fbInviteBtnArray[lang]["oth"][i]+'")';
		}
	}
return stringForjQuerySearch2;
}

function getTextForCurrentLanguage(whatWeNeed){
	if (fbInviteBtnArray && fbInviteBtnArray[getCurrentFbLang()] && fbInviteBtnArray[getCurrentFbLang()][whatWeNeed] && fbInviteBtnArray[getCurrentFbLang()][whatWeNeed][0])
		return fbInviteBtnArray[getCurrentFbLang()][whatWeNeed][0];
	else
		return whatWeNeed;
}


function getNewInviteButtonsByText(){
return getNewInviteButtonsByText2().filter(function(){
	// 20201229 - we add a check that we MUST have .parents('div[role="dialog"]') here
	if ($(this).parents('div[role="dialog"]').length>0)
		return true;
	else
		return false;
}).closest('div[role="button"]').not('div.fbNubFlyout[role="dialog"] div[role="button"],.uiLayer._31e div[role="dialog"] div[role="button"]').filter(function () {
	//var outerThis = this;
	var ret=true;
	$(this).parents('div').each(function() {
		if ($(this).attr('aria-hidden') && $(this).attr('aria-hidden')=='true'){
			ret=false;
		}
    });
	//if (ret){
		// verify also we don't have scroll inside scroll
	//	if ($(outerThis).parents(newclass).length!=0){
	//		ret=false;
	//	}
	//}
	return ret;
});
}


function getNewInviteButtonsByText2(){

// if we found elements already, just use the same query, no need to scan again!
if (stringForjQuerySearch2!="" && getElem(stringForjQuerySearch2).length>0)
	return getElem(stringForjQuerySearch2);

// for the first time we scan:
// current language to test only (normally it should work for main languages)
var langInTheList=false;
if (getCurrentFbLang()!="" && fbInviteBtnArray[getCurrentFbLang()]){
	//console.log("we have this lang:"+getCurrentFbLang());
	langInTheList=true;
	getStringBtnByLang(getCurrentFbLang(),true);
}
// at least 5 all buttons or 1 Invite(-d) button then it's ok!
if (stringForjQuerySearch.length>0 && stringForjQuerySearch2.length>0 && (getElem(stringForjQuerySearch).length>0 || getElem(stringForjQuerySearch2).length>5)){
	// we have a list perfect here!
	//console.log(stringForjQuerySearch2);
	usedFbLang=getCurrentFbLang();
	return getElem(stringForjQuerySearch2);
}


// if current lang doesn't return nothing good, we need to test with ALL languages! And see where we get MORE results, that language wins!

// FOR PAID SCRIPTS DO NOT CHECK ALL LANGUAGES!
if (!langInTheList){
for (r = 0; r < fbInviteBtnArrayLang.length; r++) {
stringForjQuerySearch="";
stringForjQuerySearch2="";
//console.log("r="+r+". lang="+fbInviteBtnArrayLang[r]);
//console.log("we test lang:"+fbInviteBtnArrayLang[r]);
getStringBtnByLang(fbInviteBtnArrayLang[r],false);
tempreturnNumber=getElem(stringForjQuerySearch2).length;
if (stringForjQuerySearch2.length>0 && tempreturnNumber>0){
	// we have a list perfect here!
	console.log("we have FOUND possible lang:"+fbInviteBtnArrayLang[r]);
	
	// let's save it to the array to we can know what is the biggest number we get!
	searchInAllLangArray1.push(fbInviteBtnArrayLang[r]);
	searchInAllLangArray2.push(tempreturnNumber);
	//usedFbLang=fbInviteBtnArrayLang[r];
	//return getElem(stringForjQuerySearch2);
}
}
// check where we have the biggest number:
if (searchInAllLangArray1.length>0 && searchInAllLangArray2.length>0){
	tempreturnNumber=0;
	tempreturnNumber2=0;
	for (u = 0; u < searchInAllLangArray2.length; u++) {
		if (searchInAllLangArray2[u]>tempreturnNumber){
			tempreturnNumber=searchInAllLangArray2[u];
			tempreturnNumber2=u;
		}
	}
	getStringBtnByLang(searchInAllLangArray1[tempreturnNumber2],false);
	usedFbLang=searchInAllLangArray1[tempreturnNumber2];
	console.log("We think that this is the next LANGUAGE:"+usedFbLang);
	return getElem(stringForjQuerySearch2);
}
}

// clean strings here cause nothing was found!
stringForjQuerySearch="";
stringForjQuerySearch2="";

// tested ALL languages, found nothing, so just standard return:
return getElem(checkInsideScrolledWindow+'span>span:contains("Invite"),'+checkInsideScrolledWindow+'span>span:contains("Invited")');
}
// 202004 facebook new NEW design end code!




if (typeof iconClicked !== 'undefined' && iconClicked){
	iconClicked2=true;
	userClickedOnIcon=true;
}
var showEndNotifOnly2;
if (typeof showEndNotifOnly !== 'undefined' && showEndNotifOnly){
	showEndNotifOnly2=true;
}

var inviteDuringShareCheck;
var inviteDuringShareCheck2;
var sharedI;
var sharedI2;
var sharedInputs;
var sharedInputs2;
var antiSpamCommentSkipped=0;

var totalShowModeClickedForRun=0;

var doNotStartNowFix=false;
if (scriptIsRunning==1 && (iconClicked2 === 'undefined' || !iconClicked2)){
	doNotStartNowFix=true;
	//console.log('We DONT STOP IT!!!!!!!! BUG WAS FIXED!!!!!!!!!!!!!!!!!!');
}
iconClicked=false;
iconClicked2=false;

var _textR;
var _matches, _options, _random;
var _regEx = new RegExp(/{([^{}]+?)}/);

var _tempTimeoutLoc1;
var _tempTimeoutLoc2;
var _tempTimeoutLoc3;

var adsNewManagerScrollPartially;
var additionalCoefToScrollLess;

var scrollingLimitsInARow;


var commentLink;
var weAreInvitingFromShared;
var weAreScanningOnlyShared;
var weAreScanningOnlyInvites;

//20200307 - we need to scan them AT THE SAME time, name + description + ID!
var creatorStudioPostOpenedForScrollArray = new Array();
creatorStudioPostOpenedForScrollArray.length=7;
creatorStudioPostOpenedForScrollArray[0] = new Array();
creatorStudioPostOpenedForScrollArray[1] = new Array();
creatorStudioPostOpenedForScrollArray[2] = new Array();
creatorStudioPostOpenedForScrollArray[3] = new Array();
creatorStudioPostOpenedForScrollArray[4] = new Array();
creatorStudioPostOpenedForScrollArray[5] = new Array();
creatorStudioPostOpenedForScrollArray[6] = new Array();
creatorStudioPostOpenedForScrollArray[0].length=0;
creatorStudioPostOpenedForScrollArray[1].length=0;
creatorStudioPostOpenedForScrollArray[2].length=0;
creatorStudioPostOpenedForScrollArray[3].length=0;
creatorStudioPostOpenedForScrollArray[4].length=0;
creatorStudioPostOpenedForScrollArray[5].length=0;
creatorStudioPostOpenedForScrollArray[6].length=0;

var ignoreScannedPosts=false;



var postsIgnoredInArrowToStopScript=0;

var FPa=false;


if (document.location.href.indexOf('facebook.com') > -1 && !doNotStartNowFix && !showEndNotifOnly2){

if (!commentSenderLoaded){
	var commentScript = document.createElement("script");
	commentScript.setAttribute('src', api.runtime.getURL('comment_sender.js'));
	document.head.appendChild(commentScript);
	commentSenderLoaded=true;
}

if (debug)
	console.log('We start the script now!');



var _elsHelpCont;
var _timeCheckLimit;
var oneReportOnly=false;


// 20190219 - новые переменные для релода
var _tab_ID;
var _realt;
var _time;
var _runMode;
var _fbe_number;
var _shared_p_liked;
var _shared_p_comm;
var _totalInvited;


var tab_ID;
var fb_limit=490;
var fb_limit_show_more_btn=199;
var fb_limit_show_more_btn_add_sec=0;
var fb_limit_multi=490;
var fb_lim_this_page_counter=0;
var mtotalInvited;
var totalPostsElaborated;
var MaxPostFound=0;
var totalLikedCheck=-1;
var loadsWithNoInvite=0;
var loadsWithNoWorkOnShares=0;
var tryToLoad=0;
var checkTwice=0;
var locali=0;
var runMode;
var runModetext;
var nextPage;
var PagesCheckedText;
var limitreached=0;
var try_after_limit;
var pauseAfterLimit;
var pauseAfterLimit2;
var pauseAfterLimit3;
var pauseLastNumber=0;
var monthSave;
var localuse=0;
var selectedpostsRun=0;
var showLessInfoDate;
var loopTimerDelay;
var TimerDelayVar1;
var TimerDelayVar2;
var timerShowNotifEnd;
var fmob=false;
var photosTabRunAll=false;
var tryAgainForFullScan=0;
var FPactivation=false; // TEST
var tryloadVar1=0;
var itemRemovedSharedScroll=false;
var scanManySharedOnPage=-1;
var doNotCloseFirstRunSelectPostsVerif=false;

var fixedStartOfI=0;
var fixedMaxTries=0;
var itemElement4;
var posterFoundToChange=false;
var posterFoundToChange2;
var posterFoundToChange3;
var pageNameAdditionalCheck="";
var shares_list_delete_days;
var obj={};
obj["msgListSentID"]=new Object();

var inviteEvent;
var scrollQ=0;
var invitedToEvent=0;
var itemElaborated=0;
var docHeight = 0;
var localtimeout=10;
var elementUpdCommentText;
var temp_block_help=false;
var multi_notif_page=false;
var multi_random_order=false;
var tryToChangePoster=false;
var fast_scan_loads;
var fast_scan;
var temp_random_array = new Array();
var shares_reply_ignore_string;
var pageNameFixedByUser;
var shares_reply_ignore_array = Array();
var imgSharedCommentPoster="";

var bigPostArray=Array('0K','1K','2K','3K','4K','5K','6K','7K','8K','9K','0 K','1 K','2 K','3 K','4 K','5 K','6 K','7 K','8 K','9 K','.',',','0 K','1 K','2 K','3 K','4 K','5 K','6 K','7 K','8 K','9 K');
var bigPostTabs=Array();


var TotalInvited;
var FirstInstalled;

var dateObj = new Date();
var month = dateObj.getUTCMonth() + 1; //months from 1-12
var day = dateObj.getUTCDate();
var year = dateObj.getUTCFullYear();
var currentTimeInSec=parseInt(Math.floor(Date.now() / 1000));

var ButtonClass='_51sy';

var inputsComments = getElem('._2x4v','.hidden_elem ._2x4v');
var ID='reaction_profile_browser1';
var inputsInvites;
var inputsInvites2;

var timeout=1000;
var loadMoreClicked;
var found;
var elsHelpCont;
var addText='';

var canSKIPButton=0;
var hadInvitedButton=0;
var hadClickedMoreButton=0;
var clickedForMore;
var loopmaxtry=0;
var uiMorePagerPrimary=0;
var inputsInvMore2;
var skip_post_setting=0;
var share_put_likes = false;
var likeSharedComments = false;
var share_put_comments = false;
var skip_Invite = false;
var share_likes_limit=300;
var share_comments_limit=300;
var stop_on_captcha_shown = true;
var postMoreUnderSameAccount = false;
var do_not_check_who_comments2 = "";
var do_not_check_shared_my_name_skip = "";
var do_not_check_shared_my_name_s_Array = Array();
var total_shared_posts_liked=0;
var total_shared_posts_commented=0;
var sharedPostIsCheckingNow=0;
var sharedPostsHeight=0;
var sharedMaxScroll=0;
var skip_angry_emotion = false;
var like_other_pages = false;
var skip_haha_emotion = false;
var skip_sad_emotion = false;
var skip_like_emotion = false;
var skip_love_emotion = false;
var skip_wow_emotion = false;
var scan_reactions_tabs = false;
var scan_reactions_tabs_more1 = true;
var name_comm_filter1 = "";
var accept_ashii_names_only = false;
var ascii = /^[ -~]+$/;
var skip_no_profile_image = false;
var slow_internet = false;
var notif_other_tab = false;
var namesFilter = Array();

var lastlengthPosts=-1;
var publishingToolInv;
var isNotificationTab;
var InsightsTabInv;
var publishingToolTotPost;
var publishingTabNumber;
var publishingToolElem;
var publishingResetArray=false;
var tryMoreToScroll=0;
var lastphotoOpen=-1;
var checkOnceVideoPost=true;
var sharedPostsStuckCheck;
var weAreElaboratingAlbums=0;

var total=0;
var FriendsListHeight=0;
var FriendsTry=0;
var elementUpd;
var urllist1 = Array();
var urllist2 = Array();


//202102xx
var psThisScr="mul";
var psfTr; // free trial. -1 if ended! by default add 7 days to the current timeStamp when installed!
var pslicID; // licenseID that user inserted
var psemailID; // user email if given
var psNotif1; // send email before subscription
var psNotif2; // send news
var psexp; // expire timestamp
var psrenewCanc; // if user cancelled the renew do not give him additional days.
var psmessagelast; // last message from the server we received
var psscr; // script name (to check that the current script license we have
var pstype; // individual / business / corporate
var psdura; // duration of license
var psactive; // 1/0 if user requested refund then we must stop it!

// do not save:
var pstries=0; // this one we do not save, during one run we can send max 3 requests.
var psCurTimeStamp=parseInt(Math.floor(Date.now() / 1000)); // in seconds
var pswork; // ПРОВЕРЯТЬ ТУТ ЧТО РАБОТАЕТ ИЛИ НЕ РАБОТАЕТ В ТЕКУЩИЙ RUN!
var psCurRunType; //  0 - дефолт, 1 - работает платная сингл, 2 - работает платная ФУЛЛ ПАК, 5 - лицензия скоро закончится СИНГЛ, 6 - лицензия скоро закончится фулл пак, 9 - ЛИЦЕНЗИЯ закончилась, 10 - фриал активен, 11 - фриал закончился и не работает. 99 - лицензия от НЕПРАВИЛЬНОГО СКРИПТА!
var installID;
var psdivtitle="";
var psTimerSaveButton;
var psSaveButtonEnabled=true;

var psInvTot; // сколько сегодня инвайтили
var psInvDay; // какой день сегодня

var _psmaxtries1=0; // to disable too fast clicks
var _psmaxtries2=0;
var _psShowLicFrame=true;
var _psLicScripts={
pro:'Script #1: Inviter PRO version',
mul:'Script #1: Inviter Multi-Pages version',
lit:'Script #2: Comments - LITE version',
plu:'Script #2: Comments - PLUS version',
max:'Script #2: Comments - MAX version',
gro:'Script #3: for Groups',
fp:'Full Pack: access to all our scripts'
}
var _email="info@invitelikecomment.com";
var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
var _txtreturn1="";
var psels;



var isPhotoInviting=0;
var inputsPhoto=$('#content_container ._2eec ._3x2f .rfloat ._4crj .ZZZZZZZZZZZZZZ');
var inputsPhoto2=$('#content_container ._2eec ._3x2f .rfloat ._4crj .ZZZZZZZZZZZZZ');



var waitForLoad=30;

var curr_timestamp=parseInt(Math.floor(Date.now() / 1000));

var _ret="";
function urlCode(_l){
_ret=_l.trim();
if (_ret.indexOf('https://business.facebook.com/')>-1)
	_ret=_ret.replace('https://business.facebook.com/','|bf|');
if (_ret.indexOf('http://business.facebook.com/')>-1)
	_ret=_ret.replace('http://business.facebook.com/','|bf|');
if (_ret.indexOf('https://www.facebook.com/')>-1)
	_ret=_ret.replace('https://www.facebook.com/','|f|');
if (_ret.indexOf('http://www.facebook.com/')>-1)
	_ret=_ret.replace('http://www.facebook.com/','|f|');
return _ret;
}
function urlDeCode(_l){
_ret=_l;
if (_ret.indexOf('|bf|')>-1)
	_ret=_ret.replace('|bf|','https://business.facebook.com/');
if (_ret.indexOf('|f|')>-1)
	_ret=_ret.replace('|f|','https://www.facebook.com/');
return _ret;
}
function javascript_abort()
{
   throw new Error('This is NOT an error. This is just to abort javascript during other tasks.');
}




function stopBreakIt(){
	scriptIsRunning=0;
	clearTimeout(loopTimerDelay);
	clearTimeout(TimerDelayVar1);
	clearTimeout(TimerDelayVar2);
	console.log('You stopped the script');
	stopScript(api.i18n.getMessage("you_stop") + '\r');
}




if (window.location.href.indexOf('pages?fb-auto-invite=1')==-1){
scriptIsRunning=1;
var popup=null;

mtotalInvited=0;
totalPostsElaborated=0;

runMode=0;
runModetext="";
nextPage=0;
PagesCheckedText="";
try_after_limit=false;
pauseAfterLimit=false;
pauseAfterLimit2=180;
pauseAfterLimit3=50;
InsightsTabInv=false;
publishingToolTotPost=0;
publishingTabNumber=1;
sharedPostsStuckCheck=0;

TotalInvited = 0;
FirstInstalled = 0;
showLessInfoDate = 0;

publishingToolInv=false;
isNotificationTab=false;
fast_scan_loads=4;
fast_scan=false;


inviteDuringShareCheck=false;
inviteDuringShareCheck2=false;
_tempTimeoutLoc1=0;
_tempTimeoutLoc2=0;
_tempTimeoutLoc3=0;

adsNewManagerScrollPartially=0;
additionalCoefToScrollLess=1;

scrollingLimitsInARow=0;


//202102xx
psfTr=0;
psexp=0;
psrenewCanc=0;
pslicID="";
psemailID="";
psNotif1=1;
psNotif2=0;
psmessagelast="";
psscr="";
pstype="";
psdura="";
psactive=0;
pswork=0;
psCurRunType=0;
installID="";

psInvTot=0; // сколько сегодня инвайтили
psInvDay=""; // какой день сегодня


weAreInvitingFromShared=0;
weAreScanningOnlyShared=false;
weAreScanningOnlyInvites=false;

api.runtime.sendMessage({ type: 'getTabId' }, function(res) {
	//console.log("Send message to read tabid 3:"+res.tabId);
	tab_ID = res.tabId;
});


var p1_1 = 3;
var p1_2 = 5;
var p2_1 = 3;
var p2_2 = 5;
var pc_1 = 10;
var pc_2 = 15;
var text_comm_shares = "";
var text_comm_shares2 = "";
var text_comm_shares3 = "";
var text_comm_shares4 = "";
var text_comm_shares5 = "";
var temp_text = "";
var randomNum = 0;
var fb_timeout_1 = 7000;
var fb_timeout_2 = 2000;
var fb_timeout_3 = 1500;
var fb_timeout_4 = 7000;
var fb_timeout_5 = 10000;
var fb_timeout_6 = 15000;
var additional_script_pause = true;
var check_post_first = true;
monthSave = 0;

// LOOP
var loop_PostsList="1,2,3,4,5";
var loop_PostsListArray=new Array();
var loop_currentPostJustForCounter=0;
var loop_Pause=5;
var reloadloop=true;
var loop_skip_secondtime=false;
var loopTimerDelay;
var notloadtoomuch=false; // it should be true, change to true if you want to not scan all posts on the 2nd loop of realtime
var skip_if_no_buttons_after_first_loop=false;
var normal_run_limitposts = 100;
var normal_run_limitNoInvGoNextPage = 100;
var normal_run_limitNoInvitePosts=0; // -1 means we invited someone, if not do ++

api.storage.sync.get({
    p1_1: 3,
    p1_2: 5,
    p2_1: 3,
    p2_2: 5,
	pc_1: 10,
	pc_2: 15,
	text_comm_shares: "",
	text_comm_shares2: "",
	text_comm_shares3: "",
	text_comm_shares4: "",
	text_comm_shares5: "",
	fb_timeout_1: 5000,
	fb_timeout_2: 2000,
	fb_timeout_3: 1500,
	fb_timeout_4: 7000,
	fb_timeout_5: 10000,
	fb_timeout_6: 15000,
	
	//202102xx
	psfTr:0,
	psexp:0,
	psrenewCanc:0,
	pslicID:"",
	psemailID:"",
	psNotif1:1,
	psNotif2:0,
	psmessagelast:"",
	psscr:"",
	pstype:"",
	psdura:"",
	psactive:0,
	installID:"",
	
	psInvTot:0,
	psInvDay:"",

	additional_script_pause: true,
	check_post_first: true,
	skip_angry_emotion: false,
	like_other_pages: false,
	skip_haha_emotion: false,
	skip_like_emotion: false,
	skip_love_emotion: false,
	skip_wow_emotion: false,
	scan_reactions_tabs: false,
	scan_reactions_tabs_more1: true,
	skip_sad_emotion: false,
	name_comm_filter1: "",
	accept_ashii_names_only: false,
	skip_no_profile_image: false,
	slow_internet: false,
	notif_other_tab: false,
	scrollingNewFBDesignClass: scrollingNewFBDesignClassDef,
	fb_limit: 490,
	fb_limit_multi: 490,
	fb_limit_show_more_btn: 199,
	fb_limit_show_more_btn_add_sec: 0,
	TotalInvited: 0,
	FirstInstalled: 0,
	showLessInfoDate: 0,
	skip_post_setting: 0,
	share_put_likes: false,
	likeSharedComments: false,
	share_put_comments: false,
	skip_Invite: false,
	inviteDuringShareCheck: false,
	inviteDuringShareCheck2: false,
	share_likes_limit: 300,
	share_comments_limit: 300,
	stop_on_captcha_shown: true,
	postMoreUnderSameAccount: false,
	do_not_check_who_comments2: 'postPage',
	do_not_check_shared_my_name_skip: "",
	shares_list_delete_days: 14,
	multi_notif_page: false,
	multi_random_order: false,
	loop_PostsList: "1,2,3,4,5",
	loop_Pause: 5,
	urllist1: new Array(),
	urllist2: new Array(),
	normal_run_limitposts : 100,
	normal_run_limitNoInvGoNextPage : 100,
	shares_reply_ignore_string: "",
	pageNameFixedByUser: "",
	monthSave: 0,
	fast_scan_loads: 4,
	fast_scan: false,
	try_after_limit:false,
	pauseAfterLimit:false,
	pauseAfterLimit2:180,
	pauseAfterLimit3:50,
	ignoreScannedPosts: false
	
	//reloadloop: true,
	//notloadtoomuch: true
  }, function(items) {
if (items){
	if (Number(items.p1_2)>=Number(items.p1_1)){
		p1_1 = Number(items.p1_1)*1000;
		p1_2 = Number(items.p1_2)*1000;
	}
	if (Number(items.p2_2)>=Number(items.p2_1)){
		p2_1 = Number(items.p2_1)*1000;
		p2_2 = Number(items.p2_2)*1000;
	}
	if (Number(items.pc_2)>=Number(items.pc_1)){
		pc_1 = Number(items.pc_1)*1000;
		pc_2 = Number(items.pc_2)*1000;
	}
	if (p1_1==0 || p1_1=="" || p1_1<2000)
		p1_1=2000;
	if (p1_2==0 || p1_2=="" || p1_2<2000)
		p1_2=2500;
	loop_Pause = Number(items.loop_Pause)*1000*60;
	//reloadloop = items.reloadloop;
    //fb_timeout_1 = Number(items.fb_timeout_1);
    fb_timeout_2 = Number(items.fb_timeout_2);
    fb_timeout_3 = Number(items.fb_timeout_3);
    fb_timeout_4 = Number(items.fb_timeout_4);
    fb_timeout_5 = Number(items.fb_timeout_5);
    fb_timeout_6 = Number(items.fb_timeout_6);
	
	//202102xx
	psfTr = Number(items.psfTr);
	psexp = Number(items.psexp);
	psrenewCanc = Number(items.psrenewCanc);
	pslicID = items.pslicID;
	psemailID = items.psemailID;
	psNotif1 = Number(items.psNotif1);
	psNotif2 = Number(items.psNotif2);
	psmessagelast = items.psmessagelast;
	psscr = items.psscr;
	pstype = items.pstype;
	psdura = items.psdura;
	psactive = Number(items.psactive);
	installID = items.installID;
	
	psInvTot = Number(items.psInvTot);
	psInvDay = items.psInvDay;
	if (psInvDay!=month+"-"+day){
		psInvDay=month+"-"+day;
		psInvTot=0;
	}
	
	skip_post_setting = Number(items.skip_post_setting);
	share_put_likes = items.share_put_likes;
	likeSharedComments = items.likeSharedComments;
	share_put_comments = items.share_put_comments;
	skip_Invite = items.skip_Invite;
	inviteDuringShareCheck = items.inviteDuringShareCheck;
	inviteDuringShareCheck2 = items.inviteDuringShareCheck2;
	share_likes_limit = Number(items.share_likes_limit);
	if (share_likes_limit==0)
		share_likes_limit=500;
	share_comments_limit = Number(items.share_comments_limit);
	if (share_comments_limit==0)
		share_comments_limit=500;
	stop_on_captcha_shown = items.stop_on_captcha_shown;
	postMoreUnderSameAccount = items.postMoreUnderSameAccount;
	do_not_check_who_comments2 = items.do_not_check_who_comments2.toString();
	do_not_check_shared_my_name_skip = items.do_not_check_shared_my_name_skip;
	if (do_not_check_shared_my_name_skip.slice(-1)==",")
		do_not_check_shared_my_name_skip=do_not_check_shared_my_name_skip.slice(0, -1);
	if (do_not_check_shared_my_name_skip.length>1)
		do_not_check_shared_my_name_s_Array=do_not_check_shared_my_name_skip.split(',').map(function(item) {
			return item.trim();
		});
	shares_list_delete_days = Number(items.shares_list_delete_days);
	multi_notif_page = items.multi_notif_page;
	multi_random_order = items.multi_random_order;
	loop_PostsList = items.loop_PostsList;
	additional_script_pause = items.additional_script_pause;
	check_post_first = items.check_post_first;
	skip_angry_emotion = items.skip_angry_emotion;
	like_other_pages = items.like_other_pages;
	skip_haha_emotion = items.skip_haha_emotion;
	skip_sad_emotion = items.skip_sad_emotion;
	skip_like_emotion = items.skip_like_emotion;
	skip_love_emotion = items.skip_love_emotion;
	skip_wow_emotion = items.skip_wow_emotion;
	scan_reactions_tabs = items.scan_reactions_tabs;
	scan_reactions_tabs_more1 = items.scan_reactions_tabs_more1;
	name_comm_filter1 = items.name_comm_filter1.toString().trim();
	if (name_comm_filter1.slice(-1)==",")
		name_comm_filter1=name_comm_filter1.slice(0, -1);
	if (name_comm_filter1.length>0)
		namesFilter=name_comm_filter1.split(',').map(function(item) {
			return item.trim();
		});
	if (do_not_check_who_comments2.length<2)
		do_not_check_who_comments2='postPage';
	accept_ashii_names_only = items.accept_ashii_names_only;
	skip_no_profile_image = items.skip_no_profile_image;
	slow_internet = items.slow_internet;
	notif_other_tab = items.notif_other_tab;
	scrollingNewFBDesignClass = items.scrollingNewFBDesignClass;
	fb_limit = Number(items.fb_limit);
	fb_limit_multi = Number(items.fb_limit_multi);
	fb_limit_show_more_btn = Number(items.fb_limit_show_more_btn);
	if (fb_limit_show_more_btn<10)
		fb_limit_show_more_btn=10;
	fb_limit_show_more_btn_add_sec = Number(items.fb_limit_show_more_btn_add_sec);
	if (fb_limit_show_more_btn_add_sec>1000)
		fb_limit_show_more_btn_add_sec=10;
	if (fb_limit_show_more_btn_add_sec>300)
		fb_limit_show_more_btn_add_sec=120;
	TotalInvited = Number(items.TotalInvited);
	if (TotalInvited>200000)
		TotalInvited=5000;
    FirstInstalled = items.FirstInstalled.toString();
	showLessInfoDate = items.showLessInfoDate.toString();
	urllist1 = items.urllist1;
	urllist2 = items.urllist2;
	normal_run_limitposts = items.normal_run_limitposts;
	if (typeof normal_run_limitposts === 'undefined' || normal_run_limitposts=="")
		normal_run_limitposts=300;
	normal_run_limitNoInvGoNextPage = items.normal_run_limitNoInvGoNextPage;
	if (typeof normal_run_limitNoInvGoNextPage === 'undefined' || normal_run_limitNoInvGoNextPage=="")
		normal_run_limitNoInvGoNextPage=100;
	
	try_after_limit=items.try_after_limit;
	pauseAfterLimit=items.pauseAfterLimit;
	pauseAfterLimit2 = Number(items.pauseAfterLimit2);
	pauseAfterLimit3 = Number(items.pauseAfterLimit3);
	monthSave = Number(items.monthSave);
	fast_scan_loads = Number(items.fast_scan_loads);
	fast_scan = items.fast_scan;
	text_comm_shares = items.text_comm_shares.toString();
	text_comm_shares2 = items.text_comm_shares2.toString();
	text_comm_shares3 = items.text_comm_shares3.toString();
	text_comm_shares4 = items.text_comm_shares4.toString();
	text_comm_shares5 = items.text_comm_shares5.toString();
	shares_reply_ignore_string = items.shares_reply_ignore_string.toString().trim();
	if (shares_reply_ignore_string.slice(-1)==",")
		shares_reply_ignore_string=shares_reply_ignore_string.slice(0, -1);
	if (shares_reply_ignore_string.length>1)
		shares_reply_ignore_array=shares_reply_ignore_string.split(',').map(function(item) {
			return item.trim().replace("‬","").replace("‫","");
		});
	temp_random_array.length=0;
	pageNameFixedByUser = items.pageNameFixedByUser.toString().trim();
	if (text_comm_shares.length>1)
		temp_random_array.push(text_comm_shares);
	if (text_comm_shares2.length>1)
		temp_random_array.push(text_comm_shares2);
	if (text_comm_shares3.length>1)
		temp_random_array.push(text_comm_shares3);
	if (text_comm_shares4.length>1)
		temp_random_array.push(text_comm_shares4);
	if (text_comm_shares5.length>1)
		temp_random_array.push(text_comm_shares5);
	//notloadtoomuch = items.notloadtoomuch;
	console.log("Tot invited:" + TotalInvited);
	
	
	// load array of saved posts
	ignoreScannedPosts = items.ignoreScannedPosts;
}else{
	temp_random_array.length=0;
	if (text_comm_shares.length>1)
		temp_random_array.push(text_comm_shares);
	if (text_comm_shares2.length>1)
		temp_random_array.push(text_comm_shares2);
	if (text_comm_shares3.length>1)
		temp_random_array.push(text_comm_shares3);
	if (text_comm_shares4.length>1)
		temp_random_array.push(text_comm_shares4);
	if (text_comm_shares5.length>1)
		temp_random_array.push(text_comm_shares5);
}
	api.storage.local.get({
		creatorStudioPostOpenedForScrollArray: new Array()
	}, function(items) {
		if (items)
			creatorStudioPostOpenedForScrollArray = items.creatorStudioPostOpenedForScrollArray;
		if (typeof creatorStudioPostOpenedForScrollArray === "undefined" || creatorStudioPostOpenedForScrollArray.length<2 || !ignoreScannedPosts){
			creatorStudioPostOpenedForScrollArray = new Array();
			creatorStudioPostOpenedForScrollArray.length=7;
			creatorStudioPostOpenedForScrollArray[0] = new Array();
			creatorStudioPostOpenedForScrollArray[1] = new Array();
			creatorStudioPostOpenedForScrollArray[2] = new Array();
			creatorStudioPostOpenedForScrollArray[3] = new Array();
			creatorStudioPostOpenedForScrollArray[4] = new Array();
			creatorStudioPostOpenedForScrollArray[5] = new Array();
			creatorStudioPostOpenedForScrollArray[6] = new Array();
			creatorStudioPostOpenedForScrollArray[0].length=0;
			creatorStudioPostOpenedForScrollArray[1].length=0;
			creatorStudioPostOpenedForScrollArray[2].length=0;
			creatorStudioPostOpenedForScrollArray[3].length=0;
			creatorStudioPostOpenedForScrollArray[4].length=0;
			creatorStudioPostOpenedForScrollArray[5].length=0;
			creatorStudioPostOpenedForScrollArray[6].length=0;
		}
	});
	
	// console log everything here.
	//console.log('Facebook REAL TIME, timeouts that you\'ve set:');
	//console.log('Random between each click: ' + p1_1 + ' - ' + p1_2 + ' and ' + p2_1 + ' - ' + p2_2 + ' milliseconds. Start at post: ' + skip_post_setting + '. Realtime: ' + loop_PostsList + '. Loop pause: ' + loop_Pause);
	//console.log('Other timeouts: ' + additional_script_pause + ', ' + fb_timeout_1 + ', ' + fb_timeout_2 + ', ' + fb_timeout_3 + ', ' + fb_timeout_4 + ', ' + fb_timeout_5 + ', ' + fb_timeout_6 + '. Limit:' + fb_limit);

	
	
	// read local storage
	api.storage.local.get(obj,function(result){
		obj = result;
		if (typeof obj["msgListSentID"]=='undefined' || !obj["msgListSentID"])
			obj["msgListSentID"]=new Object();
		for (var key in obj["msgListSentID"]) {
			//console.log("TEST:"+key);
			if(currentTimeInSec>obj["msgListSentID"][key]+(shares_list_delete_days*86400)){
				delete obj["msgListSentID"][key];
			}
		}
	});
	
	
if (p1_1<1000)
	p1_1=p1_1*1000;
if (p1_2<1000)
	p1_2=p1_2*1000;
if (p2_1<1000)
	p2_1=p2_1*1000;
if (p2_2<1000)
	p2_2=p2_2*1000;
if (pc_1<1000)
	pc_1=pc_1*1000;
if (pc_2<1000)
	pc_2=pc_2*1000;
if (loop_Pause<1000)
	loop_Pause=loop_Pause*1000*60;
  
isPhotoInviting=0;
inputsPhoto=$('#content_container ._2eec ._3x2f .rfloat ._4crj .ZZZZZZZZZZZZZZ');
inputsPhoto2=$('#content_container ._2eec ._3x2f .rfloat ._4crj .ZZZZZZZZZZZZZ');





curr_timestamp=parseInt(Math.floor(Date.now() / 1000));



  });








// get parameter if it is availabe in the string
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}










function destroyPopupInfo(){
scriptIsRunning=0;
if (typeof popupInfo !== 'undefined'){
if (popupInfo && popupInfo.parentElement)
	popupInfo.parentElement.removeChild(popupInfo)
}
popupInfo=null;
}
function reset_posts_elabList(){
	if (debug) console.log("Todo: reset saved lists!");
    //if (confirm("Do you want to reset settings to default parameters?")){
		creatorStudioPostOpenedForScrollArray = new Array();
		creatorStudioPostOpenedForScrollArray.length=7;
		creatorStudioPostOpenedForScrollArray[0] = new Array();
		creatorStudioPostOpenedForScrollArray[1] = new Array();
		creatorStudioPostOpenedForScrollArray[2] = new Array();
		creatorStudioPostOpenedForScrollArray[3] = new Array();
		creatorStudioPostOpenedForScrollArray[4] = new Array();
		creatorStudioPostOpenedForScrollArray[5] = new Array();
		creatorStudioPostOpenedForScrollArray[6] = new Array();
		creatorStudioPostOpenedForScrollArray[0].length=0;
		creatorStudioPostOpenedForScrollArray[1].length=0;
		creatorStudioPostOpenedForScrollArray[2].length=0;
		creatorStudioPostOpenedForScrollArray[3].length=0;
		creatorStudioPostOpenedForScrollArray[4].length=0;
		creatorStudioPostOpenedForScrollArray[5].length=0;
		creatorStudioPostOpenedForScrollArray[6].length=0;

		// save to google
		api.storage.local.set({
			creatorStudioPostOpenedForScrollArray: creatorStudioPostOpenedForScrollArray
			}, function() {
		});
		
		// update info on screen
		document.getElementById("elPosts").innerHTML="0";
	//}
}

function checkSpintaxFormatOk(){
// check every text
var ret=1;
if (document.getElementsByName("text_comm_shares") && document.getElementsByName("text_comm_shares")[0]){
	for (var i=1; i < 6; i++) {
		if (document.getElementsByName("text_comm_shares"+(i!=1 ? i:''))[0].value.toString().length>0){
			if (document.getElementById('share_put_comments').checked && ret==1 && (document.getElementsByName("text_comm_shares"+(i!=1 ? i:''))[0].value.toString().match(new RegExp("{", "g")) || []).length != (document.getElementsByName("text_comm_shares"+(i!=1 ? i:''))[0].value.toString().match(new RegExp("}", "g")) || []).length){
				alert("Spintax format error in field "+i+" (shared posts comments). Quntity of '{' is not the same as '}'.\r\nSTOP THE SCRIPT and check better the text you've inserted if you want to comment!");
				ret=0;
				break;
			}
		}
	}
}

return ret;
}

function saveQuickVars(){
	
checkSpintaxFormatOk();

	if (document.getElementById('p1_1')){
		p1_1 = Number(document.getElementById('p1_1').value);
		p1_2 = Number(document.getElementById('p1_2').value);
		if (p1_1>p1_2){
			var tttemp=p1_1;
			p1_1=p1_2;
			p1_2=tttemp;
		}
		share_put_likes = document.getElementById('share_put_likes').checked;
		likeSharedComments = document.getElementById('likeSharedComments').checked;
		share_put_comments = document.getElementById('share_put_comments').checked;
		skip_Invite = !document.getElementById('skip_Invite2').checked;
		inviteDuringShareCheck = document.getElementById('inviteDuringShareCheck').checked;
		inviteDuringShareCheck2 = document.getElementById('inviteDuringShareCheck2').checked;
		ignoreScannedPosts = document.getElementById('ignoreScannedPosts').checked;
		
		pc_1 = Number(document.getElementById('pc_1').value);
		pc_2 = Number(document.getElementById('pc_2').value);
		if (pc_1>pc_2){
			var tttemp=pc_1;
			pc_1=pc_2;
			pc_2=tttemp;
		}
		text_comm_shares = document.getElementsByName("text_comm_shares")[0].value.replace("% name", "%name");
		text_comm_shares2 = document.getElementsByName("text_comm_shares2")[0].value.replace("% name", "%name");
		text_comm_shares3 = document.getElementsByName("text_comm_shares3")[0].value.replace("% name", "%name");
		text_comm_shares4 = document.getElementsByName("text_comm_shares4")[0].value.replace("% name", "%name");
		text_comm_shares5 = document.getElementsByName("text_comm_shares5")[0].value.replace("% name", "%name");

		temp_random_array.length=0;
		if (text_comm_shares.length>1)
			temp_random_array.push(text_comm_shares);
		if (text_comm_shares2.length>1)
			temp_random_array.push(text_comm_shares2);
		if (text_comm_shares3.length>1)
			temp_random_array.push(text_comm_shares3);
		if (text_comm_shares4.length>1)
			temp_random_array.push(text_comm_shares4);
		if (text_comm_shares5.length>1)
			temp_random_array.push(text_comm_shares5);
		
		// save fast scan
		if (document.getElementsByName('fast_scan_loads') && document.getElementsByName('fast_scan_loads')[0])
			fast_scan_loads = document.getElementsByName('fast_scan_loads')[0].value;
		if (document.getElementById('fast_scan'))
			fast_scan = document.getElementById('fast_scan').checked;
		
		// save to google
		api.storage.sync.set({
			p1_1: p1_1,
			p1_2: p1_2,
			pc_1: pc_1,
			pc_2: pc_2,
			text_comm_shares: text_comm_shares,
			text_comm_shares2: text_comm_shares2,
			text_comm_shares3: text_comm_shares3,
			text_comm_shares4: text_comm_shares4,
			text_comm_shares5: text_comm_shares5,
			share_put_likes: share_put_likes,
			likeSharedComments: likeSharedComments,
			share_put_comments: share_put_comments,
			skip_Invite: skip_Invite,
			inviteDuringShareCheck: inviteDuringShareCheck,
			inviteDuringShareCheck2: inviteDuringShareCheck2,
			fast_scan_loads: fast_scan_loads,
			fast_scan: fast_scan,
			ignoreScannedPosts: ignoreScannedPosts
			}, function() {
		});
		// increase timeouts
		if (p1_1<1000)
			p1_1=p1_1*1000;
		if (p1_2<1000)
			p1_2=p1_2*1000;
		if (pc_1<1000)
			pc_1=pc_1*1000;
		if (pc_2<1000)
			pc_2=pc_2*1000;
	}
}
function multiPageUniqueFunc(_urltoopen,fbeNumber,runMo,_total_shared_posts_liked,_total_shared_posts_commented,_mtotalInvited,_real,_stopLoad){
	//urltoopen=urltoopen + "?fbe-number=0&runMode=3&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented + "&totalInvited=" + mtotalInvited + "&time=" + Math.floor(Date.now() / 1000);
	//console.log("SAVE DATA");
	
	// save all data
	api.storage.local.set({
		_tab_ID: tab_ID,
		_realt: _real,
		_time: Math.floor(Date.now() / 1000),
		_runMode: runMo,
		_fbe_number: fbeNumber,
		_shared_p_liked: _total_shared_posts_liked,
		_shared_p_comm: _total_shared_posts_commented,
		_totalInvited: _mtotalInvited
	}, function() {
		// redirect
		if (_stopLoad){}else{
			_urltoopen=_urltoopen.replace("&current_page=","&rem=");
			window.location.replace(_urltoopen);
		}
	});
	

}

function mode1(){
if (licWorking()){
doNotCloseFirstRunSelectPostsVerif=true;
// 20201105 remove top bar from creator studio trying to remove focus from it
if (getElem('#mediaManagerGlobalChromeBar').length>0)
	getElem('#mediaManagerGlobalChromeBar')[0].remove();
saveQuickVars();
loop_PostsListArray.length=0;
loop_PostsList="";
runMode=1;
runModetext=api.i18n.getMessage("UI_9");
do1();
}
}
function mode2(){
if (licWorking()){
doNotCloseFirstRunSelectPostsVerif=true;
// 20201105 remove top bar from creator studio trying to remove focus from it
if (getElem('#mediaManagerGlobalChromeBar').length>0)
	getElem('#mediaManagerGlobalChromeBar')[0].remove();
saveQuickVars();
forceRefresh();
destroyPopupInfo();
if (loop_PostsList.length==0){
	//console.log("ERROR: not choosed how many posts to check with loop, let's check 5 posts.");
	loop_PostsList="1,2,3,4,5";
}
runMode=2;
runModetext=api.i18n.getMessage("UI_10");
setTimeout(function(){startDowithDelay(0);},1500);
}
}
function start_mode3(){
if (licWorking()){
saveQuickVars();
if (urllist1.length==0)
	alert(api.i18n.getMessage("UI_13"));
else{
	//url to open
	var urltoopen=urlDeCode(urllist1[0]);
	if (urltoopen.slice(-1)=="/")
		urltoopen=urltoopen.slice(0, -1);
	//if (urltoopen.indexOf("/events/") > 0 && urltoopen.indexOf("?") > 0)
	//	urltoopen=urltoopen + "&fbe-number=0&runMode=3&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented + "&totalInvited=" + mtotalInvited + "&time=" + Math.floor(Date.now() / 1000);
// ELSE 3 times!
	if (urltoopen.indexOf("/posts/") > 0 || urltoopen.indexOf("/videos/") > 0 || urltoopen.indexOf("/watch/") > 0 || urltoopen.indexOf("/photos/") > 0 || urltoopen.indexOf("/events/") > 0 || urltoopen.indexOf("/ads/manage/") > 0 || urltoopen.indexOf("album_id=") > 0 || urltoopen.indexOf("/adsmanager/pages") > 0 || urltoopen.indexOf("/content_management") > 0 || urltoopen.indexOf("/latest/posts") > 0){
		// 20190219 - we do not open the url as before, we save all data in the file now
		// urltoopen=urltoopen + "?fbe-number=0&runMode=3&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented + "&totalInvited=" + mtotalInvited + "&time=" + Math.floor(Date.now() / 1000);
	}else{
		//urltoopen=urltoopen + "/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending&fbe-number=0&runMode=3&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented +"&totalInvited=" + mtotalInvited + "&time=" + Math.floor(Date.now() / 1000);
		urltoopen=urltoopen + "/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending";
	}
	if (urltoopen.indexOf("/ads/manage/") > 0){
		urltoopen=urltoopen.replace("?fbe-number=","&fbe-number=");
	}
	if (urltoopen.indexOf('/groups/')>0){
		urltoopen=urltoopen.replace("/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending","");
	}
	if (multi_notif_page){
		urltoopen=urltoopen.replace("/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending","/notifications");
	}
	multiPageUniqueFunc(urltoopen,0,3,total_shared_posts_liked,total_shared_posts_commented,mtotalInvited,0);
	//urltoopen=urltoopen.replace("&current_page=","&rem=");
	//window.location.replace(urltoopen);
}
}
}
function start_mode4(){
if (licWorking()){
saveQuickVars();
forceRefresh();
destroyPopupInfo();
if (urllist2.length==0)
	alert(api.i18n.getMessage("UI_13"));
else{
	//url to open
	var urltoopen=urlDeCode(urllist2[0]);
	if (urltoopen.slice(-1)=="/")
		urltoopen=urltoopen.slice(0, -1);
	if (urltoopen.indexOf("/posts/") > 0 || urltoopen.indexOf("/videos/") > 0 || urltoopen.indexOf("/watch/") > 0 || urltoopen.indexOf("/photos/") > 0 || urltoopen.indexOf("/events/") > 0 || urltoopen.indexOf("/ads/manage/") > 0 || urltoopen.indexOf("album_id=") > 0 || urltoopen.indexOf("/adsmanager/pages") > 0 || urltoopen.indexOf("/content_management") > 0 || urltoopen.indexOf("/latest/posts") > 0){
		//urltoopen=urltoopen + "?fbe-number=0&runMode=4&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented + "&totalInvited=" + mtotalInvited + "&time=" + Math.floor(Date.now() / 1000);
	}else{
		//urltoopen=urltoopen + "/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending&fbe-number=0&runMode=4&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented + "&totalInvited=" + mtotalInvited + "&time=" + Math.floor(Date.now() / 1000);
		urltoopen=urltoopen + "/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending";
	}
	if (urltoopen.indexOf("/ads/manage/") > 0){
		urltoopen=urltoopen.replace("?fbe-number=","&fbe-number=");
	}
	if (urltoopen.indexOf('/groups/')>0){
		urltoopen=urltoopen.replace("/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending","");
	}
	if (multi_notif_page){
		urltoopen=urltoopen.replace("/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending","/notifications");
	}
	multiPageUniqueFunc(urltoopen,0,4,total_shared_posts_liked,total_shared_posts_commented,mtotalInvited,0);
	//urltoopen=urltoopen.replace("&current_page=","&rem=");
	//window.location.replace(urltoopen);
}
}
}
function mode3(){
if (urllist1.length==0)
	alert(api.i18n.getMessage("UI_13"));
else{
	loop_PostsListArray.length=0;
	loop_PostsList="";
	runMode=3;
	runModetext=api.i18n.getMessage("UI_11");
	if (_fbe_number>=0)
		nextPage=(parseInt(_fbe_number)+1);
	setTimeout(function(){startDowithDelay(0);},1500);
}
}
function mode4(){
forceRefresh();
if (urllist2.length==0)
	alert(api.i18n.getMessage("UI_13"));
else{
if (loop_PostsList.length==0){
	//console.log("ERROR: not choosed how many posts to check with loop, let's check 5 posts.");
	loop_PostsList="1,2,3,4,5";
}
	runMode=4;
	runModetext=api.i18n.getMessage("UI_12");
	if (_fbe_number>=0)
		nextPage=(parseInt(_fbe_number)+1);
	setTimeout(function(){startDowithDelay(0);},1500);
}
}
function startDowithDelay(_try){
	if (_try>2){
		// 20200505 - check if we have Creator Studio button here?!?! - WE CANNOT!!! They open in a new TAB so we need to change tab and close current window in this case!!!!
		//if (getElem('._8qvm a._7tv4').length>0){
		//	console.log("Creator Studio button is shown, let's click on it!");
		//	// we click on Creator Studio button
		//	getElem('._8qvm a._7tv4')[0].click();
		//}else
			do1();
	}else{
		_try++;
		if ((window.location.href.indexOf('/notifications') > 0 && getElem('._5tdr ._1t7p ._2v5c','.hidden_elem ._2v5c').length>0) || (window.location.href.indexOf('/publishing_tools') > 0 && getElem('._3h1j ._1gda ._3pzj ._4h2m ._4h2x._4lge ._2pir','.hidden_elem ._2pir').length>0)){
			do1();
		}else
			setTimeout(function(){startDowithDelay(_try);},2000);
	}
}
function forceRefresh(){
var th = document.getElementsByTagName('body')[0];
var s = document.createElement('script');
s.setAttribute('type','text/javascript');
s.innerHTML = "window.onbeforeunload = function() {}";
th.appendChild(s);
}
function myrand(a,b,dif){
var rV=-1;
b=b-1;
if (dif<0)
	dif=0;
do {
    rV=Math.floor(Math.random()*(b-a+1)+a);
}
while (rV<0 || rV==dif);
return rV;
}
function open_next_page(){
	
	goBackToMainTab(0);

}














// START THE EXTENSION HERE!!!!!!!!!!!!!!!
// first of all, check if it was reloaded automatically.
// SINGLE MODE PAGE - REALTIME
setTimeout(function(){

// 20190219 - now we load from local storage and check if we have those vars for multipages!
api.storage.local.get({
_tab_ID: 0,
_realt: 0,
_time: 0,
_runMode: 0,
_fbe_number: 0,
_shared_p_liked: 0,
_shared_p_comm: 0,
_totalInvited: 0
}, function(items) {
if (items){
	_tab_ID=items._tab_ID;
	_realt=items._realt;
	_time=items._time;
	_runMode=items._runMode;
	_fbe_number=items._fbe_number;
	_shared_p_liked=items._shared_p_liked;
	_shared_p_comm=items._shared_p_comm;
	_totalInvited=items._totalInvited;
}
	
	// moved, this check was before
	waitForLoad=30;
	if (slow_internet){
		waitForLoad=180;
fb_timeout_1 = 7000+25000;
fb_timeout_2 = 2000+2000;
fb_timeout_3 = 1500+2000;
fb_timeout_4 = 7000+2000;
fb_timeout_5 = 10000+5000;
fb_timeout_6 = 15000+5000;
	}
	
	// 20190502 - we wait for 300 sec now! if we do not press button manually
	waitForLoad=300;

	curr_timestamp=parseInt(Math.floor(Date.now() / 1000));
	if (_time>0 && curr_timestamp<(parseInt(_time)+waitForLoad)){
		mtotalInvited = _totalInvited;
		total_shared_posts_liked = _shared_p_liked;
		total_shared_posts_commented = _shared_p_comm;
		
		nextPage=(parseInt(_fbe_number)+1);
	}
	if (mtotalInvited==null)
		mtotalInvited=0;
	mtotalInvited=Number(mtotalInvited);
	if (total_shared_posts_liked==null)
		total_shared_posts_liked=0;
	if (total_shared_posts_commented==null)
		total_shared_posts_commented=0;
	if (mtotalInvited>0)
		skip_if_no_buttons_after_first_loop=true;
	
	
	if (userClickedOnIcon)
		just_start();
	else if (_realt==1 && _time>0 && curr_timestamp<(parseInt(_time)+waitForLoad)){
		//we have reloaded the page, whick mod is it?
		if (_runMode==2)
			setTimeout(function(){mode2()},310);
		else if (_runMode==4)
			setTimeout(function(){mode4()},310);
		else
			just_start();
	}else if (_runMode==3 && _time>0 && curr_timestamp<(parseInt(_time)+waitForLoad)){
		// MULTIPAGE - ONLY SCAN
		setTimeout(function(){mode3()},310);
	}else if (_runMode==4 && _time>0 && curr_timestamp<(parseInt(_time)+waitForLoad)){
		// MULTIPAGE - REALTIME
		setTimeout(function(){mode4()},310);
	}else
		just_start();
});

},400);


}
}else if (!doNotStartNowFix){
if (debug)
	console.log("We verify if we need to show progress bar of the script in another tab. Also check stop script notification and reminder to run the script");
if (typeof fbmultiprogressBarActive !== 'undefined') {
	if (debug)
		console.log("Progress Bar shown on this page");
	var e=document.getElementsByTagName("head")[0];
	var t=document.getElementsByTagName("body")[0];
	var n=document.createElement("div");n.setAttribute("id","fb-progress-bar");
	n.innerHTML='<div id="fb-notification" class="fb-style"><div class="fb-logo">'+api.runtime.getManifest().name+'</div><div class="progress-bar" width="'+progress_bar_len+'"><span class="fb-close"></span></div>';
}
// тут делаем код для финал баннера
if (typeof fbmultiscriptStoppedNotif !== 'undefined') {
	if (debug)
		console.log("Progress Bar shown on this page");
	var e=document.getElementsByTagName("head")[0];
	var t=document.getElementsByTagName("body")[0];
	var n=document.createElement("div");n.setAttribute("id","fb-progress-bar");
	n.innerHTML='<div id="fb-notification" class="fb-style"><div class="fb-logo">'+api.runtime.getManifest().name+' stopped! Open Facebook to see the result and run it on the other post/page/account!</div><span class="fb-close"></span>';
}
// тут делаем код для нотификейшена что давно не юзали скрипт
if (typeof fbmultireminderToRunScript !== 'undefined') {
	if (debug)
		console.log("reminderToRunScript shown on this page");
	var e=document.getElementsByTagName("head")[0];
	var t=document.getElementsByTagName("body")[0];
	var n=document.createElement("div");n.setAttribute("id","fb-progress-bar");
	n.innerHTML='<div id="fb-notification" class="fb-style"><div class="fb-logo">You did not run the script '+api.runtime.getManifest().name+' for a while! Open Faceboook.com and run the script or disable this notification!</div><span class="fb-close"></span>';
}

}







var justOnePost=true;
function just_start(){


// 20210406 JUST 1 POST in a new TAB!
// create a popup and start!
runModetext="Scanning the post in a separate tab. Do not close or change tab.";
createPopup();

setTimeout(function(){
//StartInvitePeople();
do4();
},800);

}





//Start normal activity
//setTimeout(function(){do1()},500);



function doPHOTO(){
	doNotCloseFirstRunSelectPostsVerif=false;
	if (debug)
		console.log("doPhoto");
//console.log("current length00:"+inputsPhoto.length);
if (scriptIsRunning==1){
if ((inputsPhoto.length==0 || inputsPhoto.length<=totalPostsElaborated) && !publishingToolInv && !isNotificationTab && window.location.href.indexOf("/photos/")==-1){
	inputsPhoto=getElem('#content_container ._2eec ._3x2f .rfloat ._4crj','.hidden_elem ._4crj');
}
//console.log("current length01:"+inputsPhoto.length);
if ((inputsPhoto.length==0 || inputsPhoto.length<=totalPostsElaborated || publishingResetArray) && publishingToolInv && !isNotificationTab){
	if (getElem('._3h1j ._1gda ._30p6 ._3pzj ._4h2m ._4h2x._4lge ._2pir','.hidden_elem ._2pir').length>0 && ((totalPostsElaborated==0 && publishingTabNumber==1) || selectedpostsRun==1)){
		inputsPhoto=getElem('._3h1j ._1gda ._30p6 ._3pzj ._4h2m ._4h2x._4lge ._2pir','.hidden_elem ._2pir');
		selectedpostsRun=1;
		publishingResetArray=false;
	}else if (getElem('._3h1j ._1gda ._3pzj ._4h2m ._4h2x._4lge ._2pir','.hidden_elem ._2pir').length>0){
		inputsPhoto=getElem('._3h1j ._1gda ._3pzj ._4h2m ._4h2x._4lge ._2pir','.hidden_elem ._2pir');
		publishingResetArray=false;
	}
}
//console.log("current length02:"+inputsPhoto.length);
// 20190212 - fix for Creator Studio
//console.log("publishingToolInv="+publishingToolInv);
//console.log("isNotificationTab="+isNotificationTab);
//console.log("publishingResetArray="+publishingResetArray);
// 20200814 - now, new publishing tools tab seems like creator studio by the code, so we change window.location.href.indexOf("/creatorstudio")>0 OR the next...
if ((window.location.href.indexOf("/creatorstudio")>0 || ((window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || window.location.href.indexOf("/publishing_tools")>0) && getElem('table tr._2zxd._2zyc,._1ug5','.hidden_elem tr._2zxd._2zyc,.hidden_elem ._1ug5').length>0)) && (inputsPhoto.length==0 || inputsPhoto.length<=totalPostsElaborated || publishingResetArray) && publishingToolInv && !isNotificationTab){
	//console.log("WE GET THE NEW LIST");
	fb_timeout_1=10000;
	// 20200716 ._3rmr._2506._80o0._7uaw._7uax ._1ug5 изменил просто на ._1ug5 из=за емейла macko.sb92@gmail.com
	var studCr=getElem('table tr._2zxd._2zyc,._1ug5','.hidden_elem tr._2zxd._2zyc,.hidden_elem ._1ug5').filter(function () {
		 return ($(this).closest('._2e42._2yi0').length>0 && $(this).closest('._2e42._2yi0').prev() && $(this).closest('._2e42._2yi0').prev().prev() && $(this).closest('._2e42._2yi0').prev().prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').length>0 && $(this).closest('._2e42._2yi0').prev().prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').filter(function () {return ($(this).attr('aria-checked') == "true")}).length>0);
		});
		//console.log(totalPostsElaborated);
		//console.log("lol:"+publishingTabNumber);
	if (studCr.length>0 && ((totalPostsElaborated==0 && publishingTabNumber==1) || selectedpostsRun==1)){
		inputsPhoto=getElem('table tr._2zxd._2zyc,._1ug5','.hidden_elem tr._2zxd._2zyc,.hidden_elem ._1ug5').filter(function () {
		 return ($(this).closest('._2e42._2yi0').length>0 && $(this).closest('._2e42._2yi0').prev() && $(this).closest('._2e42._2yi0').prev().prev() && $(this).closest('._2e42._2yi0').prev().prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').length>0 && $(this).closest('._2e42._2yi0').prev().prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').filter(function () {return ($(this).attr('aria-checked') == "true")}).length>0);
		});
		selectedpostsRun=1;
	}else
		inputsPhoto=getElem('table tr._2zxd._2zyc,._1ug5','.hidden_elem tr._2zxd._2zyc,.hidden_elem ._1ug5');
	publishingResetArray=false;
}
// 20200127 - fix for ADS manager NEW
//console.log("current length:"+inputsPhoto.length);
//console.log("MMMMMMMMMMMMMMM 1");
//console.log(publishingToolInv);
//console.log(isNotificationTab);
//console.log(getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').filter(function () {return ($(this).find('.ellipsis,.kiex77na,.l6kht628>div').length>0);}).length);
if ((window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || window.location.href.indexOf("/publishing_tools")>0) && (inputsPhoto.length==0 || inputsPhoto.length<=totalPostsElaborated || publishingResetArray) && publishingToolInv && !isNotificationTab && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').filter(function () {return ($(this).find('.ellipsis,.kiex77na,.l6kht628>div').length>0);}).length>0){
	//console.log("MMMMMMMMMMMMMMM 2");
	//console.log("current length2:"+inputsPhoto.length);
	fb_timeout_1=10000;
	var studCr=getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').filter(function () {
		 return ($(this).closest('._2e42._2yi0').length>0 && $(this).closest('._2e42._2yi0').prev() && $(this).closest('._2e42._2yi0').prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').length>0 && $(this).closest('._2e42._2yi0').prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').filter(function () {return ($(this).attr('aria-checked') == "true")}).length>0);
		});
	if (studCr.length>0 && ((totalPostsElaborated==0 && publishingTabNumber==1) || selectedpostsRun==1)){
		inputsPhoto=getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').filter(function () {
		 return ($(this).closest('._2e42._2yi0').length>0 && $(this).closest('._2e42._2yi0').prev() && $(this).closest('._2e42._2yi0').prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').length>0 && $(this).closest('._2e42._2yi0').prev().find('._88ly input,button._1gcq,._1gcq._29c-._1gco._5e9w').filter(function () {return ($(this).attr('aria-checked') == "true")}).length>0);
		});
		selectedpostsRun=1;
	}else
		inputsPhoto=getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').filter(function () {return ($(this).find('.ellipsis,.kiex77na,.l6kht628>div').length>0 && ($(this).find('i').length==0 || ($(this).find('i').length>0 && (!$(this).find('i').text() || ($(this).find('i').text() && $(this).find('i').text().toLowerCase().indexOf('instagram')==-1)))));});
	publishingResetArray=false;
}
//console.log("current length3:"+inputsPhoto.length);
// 20200826 - fix for new Creator Studio!
if (inputsPhoto.length==0 && isThisNewFbDesign2020() && (getElem('.l9j0dhe7:visible').not('.y3zKF.sqdOP.yWX7d._8A5w5').filter(function () {return ($(this).attr('role') == "row" && $(this).find('.sx_e9b3e2,.sx_848308').length==0);}).length>0 && (document.location.href.indexOf('/notifications') || document.location.href.indexOf('&notif_t=')))){
	//console.log("HERE we are");
	inputsPhoto = getElem('.l9j0dhe7:visible').not('.y3zKF.sqdOP.yWX7d._8A5w5').filter(function () {return ($(this).attr('role') == "row" && $(this).find('.sx_e9b3e2,.sx_848308').length==0);});
	
	inputsPhoto=$(inputsPhoto).find('a');
}


// 20190913 - fix for watch!
if (inputsPhoto.length==0 && (getElem('._wyj._20nr ._7gpd a._7gm_').length>0 && document.location.href.indexOf('/watch/')))
	inputsPhoto = getElem('._wyj._20nr ._7gpd a._7gm_');
if ((inputsPhoto.length==0 || inputsPhoto.length<=totalPostsElaborated) && isNotificationTab){
	if (getElem('._5tdr ._1t7p ._2v5c._4vb9 ._5aj7','._5tdr ._1t7p ._1d2k ._5aj7,.hidden_elem ._5aj7').length>0 && ((totalPostsElaborated==0 && publishingTabNumber==1) || selectedpostsRun==1)){
		inputsPhoto=getElem('._5tdr ._1t7p ._2v5c._4vb9 ._5aj7','._5tdr ._1t7p ._1d2k ._5aj7,.hidden_elem ._5aj7');
		selectedpostsRun=1;
	}else
		inputsPhoto=getElem('._5tdr ._1t7p ._2v5c ._5aj7','._5tdr ._1t7p ._1d2k ._5aj7,.hidden_elem ._5aj7');
}
if ((inputsPhoto.length==0 || inputsPhoto.length<=totalPostsElaborated) && window.location.href.indexOf("/photos/")>0 && getElem('#content_container ._2eec ._2eea>a>img,#content_container ._2eec ._2eea._4zc->a ._1g1c>img').length>0){
	// FOR PHOTOS TAB FIX THIS:
	publishingToolInv=true;
	photosTabRunAll=true;
	weAreElaboratingAlbums=1;
	inputsPhoto=getElem('#content_container ._2eec ._2eea>a>img,#content_container ._2eec ._2eea._4zc->a ._1g1c>img');
	if (debug)
		console.log("we update here how many photos we have, new number:"+inputsPhoto.length);
}
checkOnceVideoPost=true;

if (debug)
	console.log("LENGTH of items this time:"+inputsPhoto.length+". Tot post:"+totalPostsElaborated+". Selected posts:"+selectedpostsRun);

if (loop_PostsListArray.length>0){
	//loop
	if (debug)
		console.log('doPHOTO for real time.');
	if (totalPostsElaborated<inputsPhoto.length){
		tryloadVar1=0;
		totalPostsElaborated++;
		if (normal_run_limitNoInvitePosts>=0)
			normal_run_limitNoInvitePosts++;
		else
			normal_run_limitNoInvitePosts=0;
		if (loop_PostsListArray.indexOf(totalPostsElaborated)>-1 && !publishingToolInv){
			loop_currentPostJustForCounter++;
			if (photosTabRunAll)
				inputsPhoto[totalPostsElaborated-1].click();
			else
				$(inputsPhoto[totalPostsElaborated-1]).children('a')[0].click();
			updatePopup();
			//console.log('exists');
			TimerDelayVar1=setTimeout(function(){doPHOTO2()},fb_timeout_1);
		}else if (loop_PostsListArray.indexOf(totalPostsElaborated)>-1 && publishingToolInv){
			loop_currentPostJustForCounter++;
			inputsPhoto[totalPostsElaborated-1].click();
			updatePopup();
			//console.log('exists');
			TimerDelayVar1=setTimeout(function(){doPHOTO2()},fb_timeout_1);
		}else
			doPHOTO();
	}else{
		
		// TO DO!! Почему релод? А как же загрузить другие посты если это нотификейшен таб ????????? ПОДУМАТь!
		if (debug){
			console.log('try to load more IF we need this just for notification tab!');
			console.log(multi_notif_page);
			console.log(Math.max.apply(null,loop_PostsListArray));
			console.log(totalPostsElaborated);
			console.log(tryloadVar1);
		}
		if (multi_notif_page && Math.max.apply(null,loop_PostsListArray)>totalPostsElaborated && tryloadVar1<5){
			tryClickToLoadMorePosts();
			tryloadVar1++;
			TimerDelayVar1=setTimeout(function(){doPHOTO()},7000);
		}else{
			if (reloadloop)
				prepareforReloadPage();
			else{
				updatePopup('. ' + api.i18n.getMessage("pause_1") + ' ' + (loop_Pause/1000) + ' ' + api.i18n.getMessage("pause_2") + '',1);
				skip_if_no_buttons_after_first_loop=true;
				totalPostsElaborated=0;
				loopTimerDelay=setTimeout(function(){doPHOTO3s()},loop_Pause);
			}
		}
	}
}else{
//OLD
if (inputsPhoto.length>0 && inputsPhoto.length>totalPostsElaborated){
	if ($(inputsPhoto[totalPostsElaborated]).children('a') && $(inputsPhoto[totalPostsElaborated]).children('a')[0] && !publishingToolInv){
		if (photosTabRunAll){
			inputsPhoto[totalPostsElaborated].click();
		}else
			$(inputsPhoto[totalPostsElaborated]).children('a')[0].click();
		//console.log('Click on expand info about photo/post');
		totalPostsElaborated++;
		if (normal_run_limitNoInvitePosts>=0)
			normal_run_limitNoInvitePosts++;
		else
			normal_run_limitNoInvitePosts=0;
		//if (share_put_likes)
			updatePopup();
		//else
		//	updatePopup('. <span style="color:blue">New feature (November 2017): check shared posts, like  and comment them</span><small style="font-size: 0.45em;"></small>');
		checkTwice=0;
		TimerDelayVar1=setTimeout(function(){doPHOTO2()},fb_timeout_1);
	}else if (publishingToolInv){
		//console.log("QQQQ HERE:"+$(inputsPhoto[totalPostsElaborated]).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src"));
		// 20190428 - Creator Studio scroll may not work as expected, let's save images from it and do not open again!!!
		// console.log($(inputs[0]).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src"));
		if (postsIgnoredInArrowToStopScript>1499){
			if ((runMode==3 || runMode==4) && try_after_limit){
				if (debug){console.log("next page 1");}
				open_next_page();
			}else{
				console.log("Stop, debug: all posts were already checked by images");
				stopScript();
			}
			
		// check if this post wasn't already elaborated.
		}else if (verifyThisPostAlreadyScanned(inputsPhoto[totalPostsElaborated])==false){
			postsIgnoredInArrowToStopScript=0;
			//console.log("QQQQQ we are here to add photo");
			
			// save to google if option is on
			if (ignoreScannedPosts){
				api.storage.local.set({
					creatorStudioPostOpenedForScrollArray: creatorStudioPostOpenedForScrollArray
					}, function() {
				});
			}
			
			// 20200307
			// here we add this post to the new list! 2 things if this is Creator Studio and 3 if ads manager
			// always add 3 ALWAYS!
			//console.log("TRY TO SAVE INFO");
			if (window.location.href.indexOf("/creatorstudio")>0 || (window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || window.location.href.indexOf("/publishing_tools")>0)){
				// add for creator studio or ads manager
				// image link
				//console.log("ADD 1:"+$(inputsPhoto[totalPostsElaborated]).find('img')[0].getAttribute("src"));
				if ($(inputsPhoto[totalPostsElaborated]).find('img._8u9x,img._8u9w,img._8oii').length>0 && $(inputsPhoto[totalPostsElaborated]).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src").length>3){
					//console.log("ADD 1:"+$(inputsPhoto[totalPostsElaborated]).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src"));
					creatorStudioPostOpenedForScrollArray[0].push($(inputsPhoto[totalPostsElaborated]).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src"));
				}else{
					// мб это новая версия давайт просто img запишем
					if (($(inputsPhoto[totalPostsElaborated]).find('img').length>0))
						creatorStudioPostOpenedForScrollArray[0].push($(inputsPhoto[totalPostsElaborated]).find('img')[0].getAttribute("src"));
					else
						creatorStudioPostOpenedForScrollArray[0].push('');
				}
				// description
				//console.log("ADD 2:"+$(inputsPhoto[totalPostsElaborated]).find('.ellipsis,.kiex77na,.l6kht628>div').first().text());
				if ($(inputsPhoto[totalPostsElaborated]).find('.ellipsis,.kiex77na,.l6kht628>div').length>0){
					//console.log("ADD 2:"+$(inputsPhoto[totalPostsElaborated]).find('.ellipsis,.kiex77na,.l6kht628>div').first().text());
					creatorStudioPostOpenedForScrollArray[1].push($(inputsPhoto[totalPostsElaborated]).find('.ellipsis,.kiex77na,.l6kht628>div').first().text());
				}else{
					creatorStudioPostOpenedForScrollArray[1].push('');
				}
				
				// 20200513 - only for Creator STUDIO if there is a name of the poster, save it as well!
				if (window.location.href.indexOf("/creatorstudio")>0){
					if ($(inputsPhoto[totalPostsElaborated]).find('._1mxi ._4ik4._4ik5').length>0){
						//console.log("ADD 4:"+$(inputsPhoto[totalPostsElaborated]).find('._1mxi ._4ik4._4ik5').first().text());
						creatorStudioPostOpenedForScrollArray[3].push($(inputsPhoto[totalPostsElaborated]).find('._1mxi ._4ik4._4ik5').first().text());
					}else{
						creatorStudioPostOpenedForScrollArray[3].push('');
					}
				}
				
				
				// only for ads we add also ID or Reach info
				//console.log("ADD 3:"+$(inputsPhoto[totalPostsElaborated]).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').first().text());
				if ((window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || window.location.href.indexOf("/publishing_tools")>0) && $(inputsPhoto[totalPostsElaborated]).closest('._2e42').length && $(inputsPhoto[totalPostsElaborated]).closest('._2e42').next().length>0 && $(inputsPhoto[totalPostsElaborated]).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').length>0){
					//console.log("ADD 3:"+$(inputsPhoto[totalPostsElaborated]).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').first().text());
					creatorStudioPostOpenedForScrollArray[2].push($(inputsPhoto[totalPostsElaborated]).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').first().text());
				}else{
					creatorStudioPostOpenedForScrollArray[2].push('');
				}
			}
			// here continue to elaborate this post as normal:
			inputsPhoto[totalPostsElaborated].click();
			//console.log('Click on the POST in the list');
			totalPostsElaborated++;
			publishingToolTotPost++;
			if (normal_run_limitNoInvitePosts>=0)
				normal_run_limitNoInvitePosts++;
			else
				normal_run_limitNoInvitePosts=0;
			//if (share_put_likes)
				updatePopup();
			//else
			//	updatePopup('. <span style="color:blue">New feature (November 2017): check shared posts, like  and comment them</span><small style="font-size: 0.45em;"></small>');
			checkTwice=0;
			
			
			
			
			// TEST ==================== TO test how posts are opened we just go to the next post here:
			// TO DO close windows we need to add to make this work!
			//console.log("WE SKIP ELABORATION OF THE POST TO TEST OPENING!!!");
			TimerDelayVar1=setTimeout(function(){doPHOTO2()},fb_timeout_1);
			//TimerDelayVar1=setTimeout(function(){doPHOTO()},fb_timeout_1);
		}else{
			//console.log("WE SKIP THIS POST:"+$(inputsPhoto[totalPostsElaborated]).find('img')[0].getAttribute("src"));
			// DO THIS CODE HERE AND ALSO IN PREV IF
			if (debug && $(inputsPhoto[totalPostsElaborated]).find('img._8u9x,img._8u9w,img._8oii').length>0){
				console.log("We have already this img"+$(inputsPhoto[totalPostsElaborated]).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src"));
			}
			// это креатор студио и эта картинка уже была! идем к следующей!!!
			postsIgnoredInArrowToStopScript++;
			totalPostsElaborated++;
			if (normal_run_limitNoInvitePosts>=0)
				normal_run_limitNoInvitePosts++;
			else
				normal_run_limitNoInvitePosts=0;
			doPHOTO();
		}
	}else{
		//console.log('No likes for current photo, go to next one');
		totalPostsElaborated++;
		publishingToolTotPost++;
		if (normal_run_limitNoInvitePosts>=0)
			normal_run_limitNoInvitePosts++;
		else
			normal_run_limitNoInvitePosts=0;
		doPHOTO();
	}
}else{
	if (MaxPostFound==totalPostsElaborated && ((checkTwice>=1 && !isNotificationTab && window.location.href.indexOf("/content_management")==-1 && window.location.href.indexOf("/latest/posts")==-1 && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length==0) || (checkTwice>13 && (adsNewManagerScrollPartially==0 || adsNewManagerScrollPartially/additionalCoefToScrollLess>8) && (!ignoreScannedPosts || (ignoreScannedPosts && checkTwice>20))))){
		if ((runMode==3 || runMode==4)){ // && try_after_limit - 20190816 removed this verification cause it was not working correctly, see email dave@breakoutchester.com
			if (debug){console.log("next page 2");}
			open_next_page();
		}else{
			console.log("Stop, debug: 1");
			stopScript();
		}
	}else{
		if(MaxPostFound==totalPostsElaborated)
			checkTwice++;
		MaxPostFound=totalPostsElaborated;
		// all visible posts were elaborated, load more
		if (publishingToolInv && !isNotificationTab){
			//console.log("TEST we scroll here 1?");
			// click on next button if it is available
			if (selectedpostsRun==0){
				// for Creator Studio use different method!
				// 20190212
				if (window.location.href.indexOf("/creatorstudio")>0){
					// scroll
					adsNewManagerScrollPartially++;
					additionalCoefToScrollLess=1;
					
					// 20200513 - if we opened a lot of posts, we need to scroll slowly!
					if (getElem('.ReactVirtualized__Grid._1zmk').length>0 && getElem('.ReactVirtualized__Grid._1zmk')[0].scrollHeight>2500 && publishingToolTotPost<25)
						additionalCoefToScrollLess=2;
					else if (getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid').length>0 && getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid')[getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid').length-1].scrollHeight>2500 && publishingToolTotPost<25)
						additionalCoefToScrollLess=2;
					else if (getElem('.ReactVirtualized__Grid._1zmk').length>0 && getElem('.ReactVirtualized__Grid._1zmk')[0].scrollHeight>8000 && publishingToolTotPost<50)
						additionalCoefToScrollLess=3;
					else if (getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid').length>0 && getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid')[getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid').length-1].scrollHeight>8000 && publishingToolTotPost<50)
						additionalCoefToScrollLess=3;
					
					//console.log("adsNewManagerScrollPartially="+adsNewManagerScrollPartially/additionalCoefToScrollLess);
					
					// 3 old scrolls
					if (getElem('.uiScrollableAreaWrap').length>2)
						getElem('.uiScrollableAreaWrap').scrollTop(getElem('.uiScrollableAreaWrap')[2].scrollHeight*((adsNewManagerScrollPartially/additionalCoefToScrollLess)*0.19));
					else if (getElem('.uiScrollableAreaWrap').length>1)
						getElem('.uiScrollableAreaWrap').scrollTop(getElem('.uiScrollableAreaWrap')[1].scrollHeight*((adsNewManagerScrollPartially/additionalCoefToScrollLess)*0.19));
					else if (getElem('.uiScrollableAreaWrap').length>0)
						getElem('.uiScrollableAreaWrap').scrollTop(getElem('.uiScrollableAreaWrap')[0].scrollHeight*((adsNewManagerScrollPartially/additionalCoefToScrollLess)*0.19));
					// NEW
					if (getElem('.ReactVirtualized__Grid._1zmk').length>0)
						getElem('.ReactVirtualized__Grid._1zmk').scrollTop(getElem('.ReactVirtualized__Grid._1zmk')[0].scrollHeight*((adsNewManagerScrollPartially/additionalCoefToScrollLess)*0.19));
					else if (getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid').length>0)
						getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid').scrollTop(getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid')[getElem('.uiScrollableAreaWrap .ReactVirtualized__Grid').length-1].scrollHeight*((adsNewManagerScrollPartially/additionalCoefToScrollLess)*0.19));
					totalPostsElaborated=0;
					//console.log("WE SCROLL");
					publishingResetArray=true;
					publishingTabNumber++;
				}else if (window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0){
					if (adsNewManagerScrollPartially<12 && getElem('._3vo_ .ReactVirtualized__Grid').length>1 && getElem('._3vo_ .ReactVirtualized__Grid')[1].scrollHeight>1000){
						if (adsNewManagerScrollPartially==0 && publishingToolTotPost>50)
							adsNewManagerScrollPartially++;
						if (adsNewManagerScrollPartially==1 && publishingToolTotPost>80)
							adsNewManagerScrollPartially++;
						adsNewManagerScrollPartially++;
						if (getElem('._3vo_ .ReactVirtualized__Grid').length>1)
							getElem('._3vo_ .ReactVirtualized__Grid').scrollTop(getElem('._3vo_ .ReactVirtualized__Grid')[1].scrollHeight*(adsNewManagerScrollPartially*0.2));
					}else{
						if (getElem('._3vo_ .ReactVirtualized__Grid').length>0)
							getElem('._3vo_ .ReactVirtualized__Grid').scrollTop(99999999);
					}
					totalPostsElaborated=0;
					publishingResetArray=true;
					publishingTabNumber++;
				}else{
					publishingToolElem=getElem('._4sol ._4-u3 .rfloat ._51xa ._42ft');//.not('._4sol ._4-u3 .rfloat ._51xa ._42fr');
					if (publishingToolElem.length>0){
						//for(var m = 0; m < publishingToolElem.length; m++)
							//if ($(publishingToolElem[m]).find('.sx_894b25') && $(publishingToolElem[m]).find('.sx_894b25').length>0){ //}
							if (!$(publishingToolElem[publishingToolElem.length-1]).is('[disabled]')){
								publishingToolElem[publishingToolElem.length-1].click();
								totalPostsElaborated=0;
								publishingResetArray=true;
								publishingTabNumber++;
							}else
								setTimeout(function(){tryClickToLoadMorePosts()},900);
					}else
						setTimeout(function(){tryClickToLoadMorePosts()},900);
				}
			}else{
				if ((runMode==3 || runMode==4) && try_after_limit){
					if (debug){console.log("next page 3");}
					open_next_page();
				}else{
					console.log("Stop, debug: 2");
					stopScript();
				}
			}
		}else{
			//console.log("TEST we scroll here 2?");
			if ((window.location.href.indexOf("&notif_t=")>0 || window.location.href.indexOf("?notif_t=")>0) && (getElem('div[role="navigation"] '+scrollingNewFBDesignClassDef).length>0 || getElem('div[role="navigation"] '+scrollingNewFBDesignClass).length>0)){
				// скролим новую нотификейшин страницу слева только
				if (getElem('div[role="navigation"] '+scrollingNewFBDesignClassDef).length>0)
					getScrollElemNewFb('div[role="navigation"] '+scrollingNewFBDesignClassDef).scrollTop(52*99999);
				if (getElem('div[role="navigation"] '+scrollingNewFBDesignClass).length>0)
					getScrollElemNewFb('div[role="navigation"] '+scrollingNewFBDesignClass).scrollTop(52*99999);
			}else if ((window.location.href.indexOf("&notif_t=")>0 || window.location.href.indexOf("?notif_t=")>0 || window.location.href.indexOf("/notifications")>0 || window.location.href.indexOf("/videos/")>0) && (getElem('div[role="navigation"]>.hybvsw6c>.q5bimw55').length>0 || getElem('div[role="navigation"]>THISisWHENtheyCHANGEitALITTLE'))){
				// 20211018 - they changed notifications tab scrolling. Must adapt it!
				console.log("scroll notif new1");
				getScrollElemNewFb('div[role="navigation"]>.hybvsw6c>.q5bimw55').scrollTop(52*99999);
			}else{
				if (selectedpostsRun==0){
					if (debug)
						console.log("Scroll try 1");
					window.scrollTo(0,document.body.scrollHeight);
					setTimeout(function(){tryClickToLoadMorePosts()},900);
				}else{
					if ((runMode==3 || runMode==4) && try_after_limit){
						if (debug){console.log("next page 4");}
						open_next_page();
					}else{
						console.log("Stop, debug: 3");
						stopScript();
					}
				}
			}
		}
		updatePopup();
		timeout=4000;
		TimerDelayVar1=setTimeout(function(){doPHOTO()},timeout);
	}
}
}
}

}
function verifyThisPostAlreadyScanned(elem){
// if we have an image
//console.log("we check the post, we have:"+creatorStudioPostOpenedForScrollArray[0].length);
if (($(elem).find('img._8u9x,img._8u9w,img._8oii').length>0 && $(elem).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src") && $(elem).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src").length>3) || ($(elem).find('img._8u9x,img._8u9w,img._8oii').length==0 && $(elem).find('img').length>0 && $(elem).find('img')[0].getAttribute("src") && $(elem).find('img')[0].getAttribute("src").length>3)){
	// if this is creator studio, we check image and name + (NEW) poster name if available
	if (window.location.href.indexOf("/creatorstudio")>0 || window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0){
		if (creatorStudioPostOpenedForScrollArray.length>0 && creatorStudioPostOpenedForScrollArray[0].length>0){
			//jQuery.each( creatorStudioPostOpenedForScrollArray[0], function( i, val ) {
			for (i = 0; i < creatorStudioPostOpenedForScrollArray[0].length; i++) {
				if (($(elem).find('img._8u9x,img._8u9w,img._8oii').length>0 && creatorStudioPostOpenedForScrollArray[0][i]==$(elem).find('img._8u9x,img._8u9w,img._8oii')[0].getAttribute("src")) || ($(elem).find('img._8u9x,img._8u9w,img._8oii').length==0 && $(elem).find('img').length>0 && creatorStudioPostOpenedForScrollArray[0][i]==$(elem).find('img')[0].getAttribute("src"))){
					//console.log("we have same image!");
					// if image is the same check also the name!
					if ($(elem).find('.ellipsis,.kiex77na,.l6kht628>div').length>0){
						//console.log("we have a name, check it");
						//console.log(creatorStudioPostOpenedForScrollArray[1][i]);
						//console.log($(elem).find('.ellipsis,.kiex77na,.l6kht628>div').first().text());
						// check if the text is the same
						if (creatorStudioPostOpenedForScrollArray[1][i]==$(elem).find('.ellipsis,.kiex77na,.l6kht628>div').first().text()){
							//console.log("we have same name here!");
							if (window.location.href.indexOf("/creatorstudio")>0){
								//20200513 - now we check also who posted this
								if ($(elem).find('._1mxi ._4ik4._4ik5').length>0){
									if (creatorStudioPostOpenedForScrollArray[3][i]==$(elem).find('._1mxi ._4ik4._4ik5').first().text()){
										return true;
									}
								}else
									return true; // if there is no poster, true anyway.
							}else if (window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || (window.location.href.indexOf("/publishing_tools")>0 && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0)){
								// check also the ID
								if ($(elem).closest('._2e42').length && $(elem).closest('._2e42').next().length>0 && $(elem).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').length>0){
									if (creatorStudioPostOpenedForScrollArray[2][i]==$(elem).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').first().text()){
										return true;
									}
								}else
									return true;
							}
						}
					}else{
						// no text here, it's fine in this case for creator studio!
						if (window.location.href.indexOf("/creatorstudio")>0){
							//20200513 - now we check also who posted this
							if ($(elem).find('._1mxi ._4ik4._4ik5').length>0){
								if (creatorStudioPostOpenedForScrollArray[3][i]==$(elem).find('._1mxi ._4ik4._4ik5').first().text()){
									return true;
								}
							}else
								return true; // if there is no poster, true anyway.
						}else if (window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || (window.location.href.indexOf("/publishing_tools")>0 && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0)){
							// check also the ID
							if ($(elem).closest('._2e42').length && $(elem).closest('._2e42').next().length>0 && $(elem).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').length>0){
								if (creatorStudioPostOpenedForScrollArray[2][i]==$(elem).closest('._2e42').next().find('._8oim>span,._8oim ._8oij>span').first().text()){
									return true;
								}
							}else
								return true;
						}
					}
				}
			}
		}
	}
}

//console.log("def, post not found");
// if not we just check the post!
return false;
}

function doPHOTO2(){
if (scriptIsRunning==1){
	
if (debug)
	console.log("doPHOTO2");

inputsPhoto2=getElem('.uiContextualLayerPositioner .uiContextualLayer ._53ij .UFIContainer .UFILikeSentenceText a[data-testid="n_other_people_link"]','.uiContextualLayerPositioner.hidden_elem a[data-testid="n_other_people_link"]');


adsNewManagerScrollPartially=0;

// 20190212 - check page name here for Studio creator
if (window.location.href.indexOf("/creatorstudio")>0){
	if (getElem('._4t2a .userContentWrapper span.fwb a','.hidden_elem span.fwb a').length>0)
		pageNameAdditionalCheck=getElem('._4t2a .userContentWrapper span.fwb a','.hidden_elem span.fwb a').first().text();
}
// 20200127 - check page name here for ADS MANAGER
if (window.location.href.indexOf("/content_management")>0 || window.location.href.indexOf("/latest/posts")>0 || (window.location.href.indexOf("/publishing_tools")>0 && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0)){
	if (getElem('._7fc8').length==1)
		pageNameAdditionalCheck=getElem('._7fc8').text();
}


if (publishingToolInv){
	inputsPhoto2=getElem('._37uu ._3399 ._3t53 ._1g5v,div[role="article"] .gpro0wi8 span.pcp91wgn,._3t09 .fbPhotosSnowliftFeedback .fbPhotosSnowliftUfi ._3t53 ._1g5v','.hidden_elem ._1g5v');
	if (inputsPhoto2.length==0)
		inputsPhoto2=getElem('._37uu ._3399 ._3t53 ._1g5v,.gpro0wi8 span.pcp91wgn,._3t09 .fbPhotosSnowliftFeedback .fbPhotosSnowliftUfi ._3t53 ._1g5v','.hidden_elem ._1g5v');
	// 20190114 - Photos Tab FIX for Invites. Need also to fix shares.
	if (inputsPhoto2.length==0 && getElem('.fbPhotoSnowliftContainer ._6iib ._3dlh','.hidden_elem ._3dlh,._3dli._3dlh').length>0)
		inputsPhoto2=getElem('.fbPhotoSnowliftContainer ._6iib ._3dlh','.hidden_elem ._3dlh,._3dli._3dlh');
}
if (isNotificationTab){
	inputsPhoto2=getElem('.UFILikeSentence ._3t53 ._1g5v,._4t2a ._3t53 ._1g5v','.hidden_elem ._1g5v');
	// 201812
	if (inputsPhoto2.length==0)
		inputsPhoto2=getElem('._66lg ._3dlf ._3dlh._3dli,div[role="article"] .gpro0wi8 span.pcp91wgn','.hidden_elem ._3dlh');
	if (inputsPhoto2.length==0)
		inputsPhoto2=getElem('._66lg ._3dlf ._3dlh._3dli,.gpro0wi8 span.pcp91wgn','.hidden_elem ._3dlh');
}
// 20221017 - fix for watch and videos opened tabs
if (inputsPhoto2.length==0 && getElem('.x1iyjqo2.x78zum5 span.x1ja2u2z').length>0 && getElem('.x1iyjqo2.x78zum5 span.x1ja2u2z').siblings('div[role="button"]').length>0){
	inputsPhoto2=getElem('.x1iyjqo2.x78zum5 span.x1ja2u2z').siblings('div[role="button"]');
}else if (inputsPhoto2.length==0 && getElem('.x1ja2u2z[role="toolbar"] div[role="button"]').length>0)
	inputsPhoto2=getElem('.x1ja2u2z[role="toolbar"] div[role="button"]');

if (inputsPhoto2 && inputsPhoto2[0] && (publishingToolInv || (!publishingToolInv && lastphotoOpen!=inputsPhoto2.length))){
	lastphotoOpen=inputsPhoto2.length;
	inputsPhoto2[inputsPhoto2.length-1].click();
	//console.log('Start invite for photo: ' + totalPostsElaborated);
	TimerDelayVar1=setTimeout(function(){StartInvitePeople()},fb_timeout_1);
}else{
	if (publishingToolInv && !isNotificationTab){
		// 20200812 - fix for stats page in creator studio
		if (getElem('._98ry ._738z ._6np5,.nbrxg16q ul.gvyo0ga7 .s7wjoji2 div[role="button"]').length>0){
			// we need to return to old layout post first and then verify other things.
			// here we CLICK on "See previous layout" button!
			getElem('._98ry ._738z ._6np5,.nbrxg16q ul.gvyo0ga7 .s7wjoji2 div[role="button"]').last()[0].click();
			TimerDelayVar1=setTimeout(function(){newStatsDesignCreatorStudio(0);},5000);
		}else{
			// check do we have "POSTS" tab HERE??? Check just once.
			inputsPhoto2=getElem('._fjd ._5vx2 ._43o4 ._45hc','._fjd ._5vx2 ._43o4 ._5vwy,.hidden_elem ._45hc');
			if (inputsPhoto2 && inputsPhoto2[0] && checkOnceVideoPost){
				//inputsPhoto2[0].click();
				//$(inputsPhoto2[0]).children('a')[0].click();
				$(inputsPhoto2[0]).find('._fjc')[0].click();
				setTimeout(function(){$(inputsPhoto2[0]).find('._fjc')[0].click();},1000);
				checkOnceVideoPost=false;
				TimerDelayVar1=setTimeout(function(){doPHOTO2()},7000);
			}else{
				//20200216 - now before checking posts tab, we need to open video sometimes, let's check it!
				// TODO тут может быть БОЛЬШЕ постов чем 1, подумать в будущем??
				inputsPhoto2=getElem('._u0y ._1gd5 ._4h2x ._5194','.hidden_elem ._u0y ._1gd5 ._4h2x ._5194');
				if (inputsPhoto2 && inputsPhoto2[0] && checkOnceVideoPost){
					inputsPhoto2[0].click();
					//$(inputsPhoto2[0]).children('a')[0].click();
					//$(inputsPhoto2[0]).find('._fjc')[0].click();
					TimerDelayVar1=setTimeout(function(){
						inputsPhoto2=getElem('._fjd ._5vx2 ._43o4 ._45hc','._fjd ._5vx2 ._43o4 ._5vwy,.hidden_elem ._45hc');
						if (inputsPhoto2 && inputsPhoto2[0] && checkOnceVideoPost){
							//inputsPhoto2[0].click();
							//$(inputsPhoto2[0]).children('a')[0].click();
							$(inputsPhoto2[0]).find('._fjc')[0].click();
							setTimeout(function(){$(inputsPhoto2[0]).find('._fjc')[0].click();},1000);
							checkOnceVideoPost=false;
							TimerDelayVar1=setTimeout(function(){doPHOTO2()},7000);
						}else{
							if (debug) {console.log("GO TO NEXT Here 1");}
							ClosePostAndOpenNext(-1);
						}
					},7000);
				}else{
					if (debug) {console.log("GO TO NEXT Here 2");}
					ClosePostAndOpenNext(-1);
				}
			}
		}
	}else if (isNotificationTab){
		if (debug) {console.log("GO TO NEXT Here 3");}
		ClosePostAndOpenNext(-1);
	}else
		doPHOTO();
}

}
}
// 20200812
function newStatsDesignCreatorStudio(tries){
if (scriptIsRunning==1){
	// check do we have "POSTS" tab HERE??? Check just once.
	inputsPhoto2=getElem('._fjd ._5vx2 ._43o4 ._45hc','._fjd ._5vx2 ._43o4 ._5vwy,.hidden_elem ._45hc');
	if (inputsPhoto2 && inputsPhoto2[0] && checkOnceVideoPost){
		//inputsPhoto2[0].click();
		//$(inputsPhoto2[0]).children('a')[0].click();
		$(inputsPhoto2[0]).find('._fjc')[0].click();
		setTimeout(function(){$(inputsPhoto2[0]).find('._fjc')[0].click();},1000);
		checkOnceVideoPost=false;
		TimerDelayVar1=setTimeout(function(){doPHOTO2()},7000);
	}else{
		//20200216 - now before checking posts tab, we need to open video sometimes, let's check it!
		// TODO тут может быть БОЛЬШЕ постов чем 1, подумать в будущем??
		inputsPhoto2=getElem('._u0y ._1gd5 ._4h2x ._5194','.hidden_elem ._u0y ._1gd5 ._4h2x ._5194');
		if (inputsPhoto2 && inputsPhoto2[0] && checkOnceVideoPost){
			inputsPhoto2[0].click();
			//$(inputsPhoto2[0]).children('a')[0].click();
			//$(inputsPhoto2[0]).find('._fjc')[0].click();
			TimerDelayVar1=setTimeout(function(){
				inputsPhoto2=getElem('._fjd ._5vx2 ._43o4 ._45hc','._fjd ._5vx2 ._43o4 ._5vwy,.hidden_elem ._45hc');
				if (inputsPhoto2 && inputsPhoto2[0] && checkOnceVideoPost){
					//inputsPhoto2[0].click();
					//$(inputsPhoto2[0]).children('a')[0].click();
					$(inputsPhoto2[0]).find('._fjc')[0].click();
					setTimeout(function(){$(inputsPhoto2[0]).find('._fjc')[0].click();},1000);
					checkOnceVideoPost=false;
					TimerDelayVar1=setTimeout(function(){doPHOTO2()},7000);
				}else{
					if (debug) {console.log("GO TO NEXT Here 4");}
					ClosePostAndOpenNext(-1);
				}
			},7000);
		}else{
			if (tries>5){
				if (debug) {console.log("GO TO NEXT Here 5");}
				ClosePostAndOpenNext(-1);
			}else{
				TimerDelayVar1=setTimeout(function(){newStatsDesignCreatorStudio(tries+1);},5000);
			}
		}
	}
}
}

function doPHOTO3s(){
totalPostsElaborated=0;
if (publishingToolInv){
if (getElem('.layerCancel').length>1)
	getElem('.layerCancel')[1].click();
if (getElem('.layerCancel').length>0)
	getElem('.layerCancel')[0].click();
}
	
doPHOTO3();
}

function doPHOTO3(){
if (scriptIsRunning==1){
	// only for loop, just check open posts
	if (totalPostsElaborated==0)
		inputsPhoto2=getElem('.uiContextualLayerPositioner .uiContextualLayer ._53ij .UFIContainer .UFILikeSentenceText a[data-testid="n_other_people_link"]','.uiContextualLayerPositioner.hidden_elem a[data-testid="n_other_people_link"]');
	if (inputsPhoto2.length==0 || inputsPhoto2.length==1)
		doPHOTO();
	else{
		if (inputsPhoto2.length>totalPostsElaborated){
			inputsPhoto2[totalPostsElaborated].click();
			totalPostsElaborated++;
			if (normal_run_limitNoInvitePosts>=0)
				normal_run_limitNoInvitePosts++;
			else
				normal_run_limitNoInvitePosts=0;
			updatePopup();
			loop_skip_secondtime=true;
			TimerDelayVar1=setTimeout(function(){StartInvitePeople()},fb_timeout_1);
		}else{
			if (reloadloop)
				prepareforReloadPage();
			else{
				updatePopup('. ' + api.i18n.getMessage("pause_1") + ' ' + (loop_Pause/1000) + ' ' + api.i18n.getMessage("pause_2") + '',1);
				totalPostsElaborated=0;
				skip_if_no_buttons_after_first_loop=true;
				loopTimerDelay=setTimeout(function(){doPHOTO3s()},loop_Pause);
			}
		}
	}
}
}

function prepareforReloadPage(){
skip_if_no_buttons_after_first_loop=true;
if (runMode==4){
	updatePopup('',1);
	//totalPostsElaborated=0;
	loopTimerDelay=setTimeout(function(){
		if (debug){console.log("next page 5");}
		open_next_page();
	},10);
}else{
var today = new Date();
today.setSeconds(today.getSeconds()+(loop_Pause/1000));
updatePopup('. ' + api.i18n.getMessage("pause_1") + ' ' + (loop_Pause/1000) + ' ' + api.i18n.getMessage("pause_2") + ' <span style="color:green"><b>' + api.i18n.getMessage("pause_3") + ' ('+("0"+today.getHours()).slice(-2)+':'+("0"+today.getMinutes()).slice(-2)+':'+("0"+today.getSeconds()).slice(-2)+')</b></span>',1);
totalPostsElaborated=0;
loopTimerDelay=setTimeout(function(){
//backgrReloadPage("realt=1&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented + "&totalInvited=" + mtotalInvited + "&time=" + (parseInt(Math.floor(Date.now()/1000))+parseInt(loop_Pause/1000)) + "&runMode=" + runMode);
multiPageUniqueFunc("",0,runMode,total_shared_posts_liked,total_shared_posts_commented,mtotalInvited,1,true);
setTimeout(function(){backgrReloadPage("")},800);
},loop_Pause);
}

}
function prepareforReloadPage2(){
skip_if_no_buttons_after_first_loop=true;
var today = new Date();
today.setSeconds(today.getSeconds()+(loop_Pause/1000));
updatePopup('. ' + api.i18n.getMessage("pause_1") + ' ' + (loop_Pause/1000) + ' ' + api.i18n.getMessage("pause_2") + ' <span style="color:green"><b>' + api.i18n.getMessage("pause_3") + ' ('+("0"+today.getHours()).slice(-2)+':'+("0"+today.getMinutes()).slice(-2)+':'+("0"+today.getSeconds()).slice(-2)+')</b></span>',1);
totalPostsElaborated=0;
if (runMode==4){
	if (limitreached==1){
		console.log("Stop, debug: 4");
		stopScript();
	}else{
		loopTimerDelay=setTimeout(function(){
		start_mode4();
		},loop_Pause);
	}
}else{
loopTimerDelay=setTimeout(function(){
//backgrReloadPage("realt=1&shared_p_liked=" + total_shared_posts_liked + "&shared_p_comm=" + total_shared_posts_commented + "&totalInvited=" + mtotalInvited + "&time=" + (parseInt(Math.floor(Date.now()/1000))+parseInt(loop_Pause/1000)) + "&runMode=" + runMode);
multiPageUniqueFunc("",0,runMode,total_shared_posts_liked,total_shared_posts_commented,mtotalInvited,1,true);
setTimeout(function(){backgrReloadPage("")},800);
},loop_Pause);
}

}
function backgrReloadPage(_message){
	var url_clear = window.location.href;
	if (url_clear.indexOf('realt=')>0)
		url_clear=url_clear.substring(0, url_clear.indexOf("realt=")-1);
	if (url_clear.indexOf('fbe-number=')>0)
		url_clear=url_clear.substring(0, url_clear.indexOf("fbe-number=")-1);
	
	// temporary fix, for posts and photos tab redirect to Publishing Tools.
	if (url_clear.indexOf('/posts/')>0 && url_clear.indexOf('/pg/')>0)
		if (url_clear.match(new RegExp("/pg/" + "(.*)" + "/posts/")) && url_clear.match(new RegExp("/pg/" + "(.*)" + "/posts/"))[1])
			url_clear="https://www.facebook.com/" + url_clear.match(new RegExp("/pg/" + "(.*)" + "/posts/"))[1] + "/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending";
	if (url_clear.indexOf('/photos/')>0 && url_clear.indexOf('/pg/')>0)
		if (url_clear.match(new RegExp("/pg/" + "(.*)" + "/photos/")) && url_clear.match(new RegExp("/pg/" + "(.*)" + "/photos/"))[1])
			url_clear="https://www.facebook.com/" + url_clear.match(new RegExp("/pg/" + "(.*)" + "/photos/"))[1] + "/publishing_tools/?section=PUBLISHED_POSTS&sort[0]=published_time_descending";
	
	if (url_clear.indexOf('?')>0)
		url_clear=url_clear + '&';
	else
		url_clear=url_clear + '?';
	url_clear=url_clear + _message;
	//alert(url_clear);
	url_clear=url_clear.replace("&current_page=","&rem=");
	window.location.replace(url_clear);
}


// check if there is an open post, close it, first.
function do1(){
if (debug) console.log('do1');

//202102xx - check if there are too many ADD FRIEND buttons INSIDE the scrollable div (or how I check it), add translate for this button to all languages? Almost all?!?! hmhm.
// let's check if there are ADD FRIENDS buttons and notify user about this!
if (getElem(getElemWithAddFriendButtons('div[role="dialog"] span:contains("Add Friend")'),getElemWithAddFriendButtons('div[role="article"] span:contains("Add Friend")')).length>5 && (getElem(scrollingNewFBDesignClassDef).length>0 || getElem(scrollingNewFBDesignClass).length>0)){
	// too many Add Friends buttons!
	scriptIsRunning=0;
	alert('Oh, we have a problem!\r\nI see too many "Add Friend" buttons. We should have "Invite" buttons instead.\r\n\r\nCheck another tab where you have Invite buttons and run the script there. Don\'t find them? Are you using correct profile? Or contact Facebook and ask them to enable Invite feature for your page: https://www.facebook.com/business/help');
}else{

	destroyPopupInfo();
	scriptIsRunning=1;
}

//if (month!=2){
//	scriptIsRunning=0;
//}

if (scriptIsRunning==1){
	

	
// 20190608 - проверяем ТОЛЬКО шаред посты, если они открыты!!!
weAreScanningOnlyShared=false;
var l_biltut=0;
var ignoreSecondRun=false;
if(getElem('._5ki2 ._4-u2._4mrt._5jmm,div[role="dialog"] .buofh1pr>.sjgh65i0','#pagelet_timeline_main_column ._4-u2._4mrt._5jmm,.hidden_elem ._4-u2._4mrt._5jmm').length>0 && runMode!=3 && runMode!=4 && (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments || share_put_likes || (share_put_comments && text_comm_shares.length>1))){
	if (confirm("Shared posts are OPEN. If you want to scan ONLY shared posts now - press OK. If you cancel - we will close shared posts and scan the page as usual.\r\nScript will use next page name (if it is wrong run in another tab or set settings to post comments with default profile): "+getCurrentPageTitle())){
		if (ignoreSecondRun)
			return;
		ignoreSecondRun=true;
		// we are scanning ONLY shared posts!
		l_biltut=1;
		if (document.getElementById('add-all-div-sw') && popup)
			destroyPopup();
		createPopup();
		weAreScanningOnlyShared=true;
		StartLIKEPosts(0);
	}else{
		if (ignoreSecondRun)
			return;
		ignoreSecondRun=true;
		// close opened windows here:
		if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>1)
			getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length-1].click();
		if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>0)
			getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[0].click();

		if (getElem('.layerCancel').length>3)
			getElem('.layerCancel')[3].click();
		if (getElem('.layerCancel').length>2)
			getElem('.layerCancel')[2].click();
		if (getElem('.layerCancel').length>1)
			getElem('.layerCancel')[1].click();
		if (getElem('.layerCancel').length>0)
			getElem('.layerCancel')[0].click();
		
		closeInviteWindowInNewUI();
	}
}

if (l_biltut==0 && (window.location.href.indexOf("/creatorstudio/?tab=home")>0 || window.location.href.indexOf("/creatorstudio?tab=home")>0)){
	l_biltut=1;
	stopScript('ERROR! You are in the HOME tab of Creator Studio, no posts here!<br><b>OPEN Creator Studio -> Content Library -> Posts and run script there.</b>');
}
	

if (l_biltut==0){
	// 20200403
	// проверяем только текущий пост в новой версии фейсбука!
	weAreScanningOnlyInvites=false;
	//console.log("QQ:"+getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false")}));
	//console.log("mm="+getNewInviteButtonsByText().length);
	if (isThisNewFbDesign2020() && getNewInviteButtonsByText().length>0 && runMode!=3 && runMode!=4 && getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false")}).length==0){
		if (confirm("It seems that list of post likers is OPEN. If you want to scan likers ONLY for this post press OK. We suggest you to run the script in Publishing Tools tab, Creator Studio or Content Management to automatically scan ALL your posts!")){
			// we are scanning ONLY invite post likers!
			l_biltut=1;
			if (document.getElementById('add-all-div-sw') && popup)
				destroyPopup();
			createPopup();
			weAreScanningOnlyInvites=true;
			StartInvitePeople();
		}
	}
}	
	
	
	
	
	
	
	
	
if (l_biltut==0){
//проверяем что аддон настроен правильно
if (share_put_likes==false && inviteDuringShareCheck==false && inviteDuringShareCheck2==false && likeSharedComments==false && (text_comm_shares.length<2 || !share_put_comments) && skip_Invite==true){
alert('ATTENTION: check Settings better, you have disabled Invite and Like features!');
destroyPopup();
scriptIsRunning=0;
//20190114 - photos tab added
}else if ((share_put_likes==true || (share_put_comments && text_comm_shares.length>1) || inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments) && skip_Invite==true && runMode!=3 && runMode!=4 && document.location.href.indexOf('publishing_tools') == -1 && document.location.href.indexOf('notifications/') == -1 && document.location.href.indexOf('/photos/') == -1 && document.location.href.indexOf('business.facebook.com/ads') == -1 && document.location.href.indexOf('facebook.com/adsmanager/') == -1 && document.location.href.indexOf('/content_management') == -1 && window.location.href.indexOf("/latest/posts")==-1 && window.location.href.indexOf('/videos/') == -1 && window.location.href.indexOf('/photo/')==-1 && window.location.href.indexOf('/creatorstudio')==-1 && window.location.href.indexOf("/latest/posts")==-1){
alert('ATTENTION: You have enabled ONLY shared posts feature. Run extension in Publishing Tools, Content management, Creator Studio or Business Suite tabs!');
destroyPopup();
scriptIsRunning=0;
//}else if (document.location.href.indexOf('/publishing_tools/?section=VIDEOS')>0 || document.location.href.indexOf('/publishing_tools?section=VIDEOS')>0){
//alert('Videos Library is not supported, use Published Posts option in Publishing Tools Tab.');
//destroyPopup();
//scriptIsRunning=0;
}else{
	
	if ((document.location.href.indexOf('/posts/?')>0 || (getElem('._2yaa._2yap').length>0 && (getElem('._2yaa._2yap').attr('data-key') == "tab_posts" || getElem('._2yaa._2yap').attr('data-key') == "tab_home" || getElem('._2yaa._2yap').attr('title') == "Discussion"))) && runMode!=3 && runMode!=4)
		alert('Attention! We suggest you to run the script in the Business Suite, Publishing tools, Creator Studio, Ads manager tab. If more than 1 post is opened on the same page, script doesn\'t work well.');
	
	
if (loop_PostsList.length>0){
	loop_PostsListArray=loop_PostsList.split(',').map(function(item) {
	  return Number(item.trim());
	});
}


// Check if we have FRIENDS LIST here
if (getElem('.fbProfileBrowser .fbProfileBrowserListContainer .fbProfileBrowserListItem').length>0){
var popup=null;
var els=getElem('.fbProfileBrowserListContainer .uiButton._1sm');
createPopup2();

// Scroll first
var objDiv = document.getElementsByClassName("fbProfileBrowserResult")[0];
objDiv.scrollTop = objDiv.scrollHeight;
setTimeout(function(){startScrollFriendsList(objDiv,els)},2000);

}else if (getElem('.uiList._4kg ._2gdu ._42o8,.uiList._4kg ._2gdu ._64xy ._2gf5','.hidden_elem ._2gf5,.hidden_elem ._42o8').length>0){
	//NEW FRIENDS SYSTEM
	var popup=null;
	setTimeout(function(){inviteFriendsNEW();},100);
}else if (getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false")}).length>0){
	var popup=null;
	setTimeout(function(){inviteFriendsNew2020();},100);
}else{

//check if we are on photo page
if (getElem('#content_container ._2eec ._3x2f .rfloat ._4crj').length>0){
	isPhotoInviting=1;
	if (document.getElementById('add-all-div-sw') && popup)
		destroyPopup();
	createPopup();
	totalPostsElaborated = skip_post_setting;
	if (totalPostsElaborated>1)
		totalPostsElaborated--;
	//console.log('111111111');
	tryToCloseIfSomethingOpen2();
	setTimeout(function(){doPHOTO()},500);
}else if (getElem('._3h1j ._1gda ._3pzj ._4h2m ._4h2x._4lge ._2pir','.hidden_elem ._2pir').length>0){
	// page manager tool is open we do the same thing as for photos (quasi)
	if (debug) console.log("page manager tool");
	publishingToolInv=true;
	isPhotoInviting=1;
	if (skip_post_setting<25)
		totalPostsElaborated = skip_post_setting;
	if (totalPostsElaborated>1)
		totalPostsElaborated--;
	if (document.getElementById('add-all-div-sw') && popup)
		destroyPopup();
	createPopup();
	//console.log('111111111222222:' + $('._3h1j ._1gda ._3pzj ._4h2m ._4h2x').length);
	tryToCloseIfSomethingOpen2();
	setTimeout(function(){doPHOTO()},500);
	
}else if ((window.location.href.indexOf('/creatorstudio') > 0 || window.location.href.indexOf("/latest/posts")>0 || window.location.href.indexOf('/content_management') > 0 || window.location.href.indexOf("/publishing_tools")>0) && (getElem('table tr._2zxd._2zyc,._1ug5','.hidden_elem tr._2zxd._2zyc,.hidden_elem ._1ug5').length>0 || getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').filter(function () {return ($(this).find('.ellipsis,.kiex77na,.l6kht628>div').length>0);}).length>0)){
	// 20190212 - Creator Studio, пробуем открывать посты и там
	if (debug) console.log("crator studio scan");
	publishingToolInv=true;
	isPhotoInviting=1;
	if (skip_post_setting<10)
		totalPostsElaborated = skip_post_setting;
	if (totalPostsElaborated>1)
		totalPostsElaborated--;
	if (document.getElementById('add-all-div-sw') && popup)
		destroyPopup();
	createPopup();
	//console.log('111111111222222:' + $('._3h1j ._1gda ._3pzj ._4h2m ._4h2x').length);
	tryToCloseIfSomethingOpen2();
	setTimeout(function(){doPHOTO()},500);
}else if ((window.location.href.indexOf('/notifications') > 0 && getElem('._5tdr ._1t7p ._2v5c','.hidden_elem ._2v5c').length>0) || (isThisNewFbDesign2020() && (getElem('.l9j0dhe7:visible').not('.y3zKF.sqdOP.yWX7d._8A5w5').filter(function () {return ($(this).attr('role') == "row" && $(this).find('.sx_160564').length==0);}).length>0 && (document.location.href.indexOf('/notifications') || document.location.href.indexOf('&notif_t=') || document.location.href.indexOf('?notif_t='))))){
	// notification tab
	if (debug) console.log("notifications tab");
	isNotificationTab=true;
	publishingToolInv=true;
	isPhotoInviting=1;
	if (skip_post_setting<25)
		totalPostsElaborated = skip_post_setting;
	if (totalPostsElaborated>1)
		totalPostsElaborated--;
	if (document.getElementById('add-all-div-sw') && popup)
		destroyPopup();
	createPopup();
	tryToCloseIfSomethingOpen2();
	setTimeout(function(){doPHOTO()},500);
// 20180511 - if we are on photos or videos page, and there is a list of people - go to the do2
}else if ((window.location.href.indexOf('/videos/') > 0 || window.location.href.indexOf('/photo/') > 0) && getElem('._2x4v','.hidden_elem ._2x4v').length>0){
	setTimeout(function(){do2()},2000);
// 20190219 - для таких вот страниц: https://www.facebook.com/watch/?v=1770323193282397 тыкаем на видео и начинаем инвайтить! ИЗМЕНИЛИ ВИДЕО СТРАНИЧКУ!!!
// 20200223 - снова они изменили и снова нужно тыкать на видео!!!
}else if (window.location.href.indexOf('/watch/') > 0 && getElem('._1c_u ._53j5 ._ox1').length>0){
//	$('video._21y0')[0].click();
	getElem('._1c_u ._53j5 ._ox1')[0].click();
	setTimeout(function(){
		// get new page name
		if (getElem('._437j ._3l-q ._6dic a._371y').length>0)
			pageNameAdditionalCheck=getElem('._437j ._3l-q ._6dic a._371y').text();
		do2();
	},4000);
//20190913 - по новому теперь видео обрабатываем!!!
}else if (window.location.href.indexOf('/watch/') > 0 && getElem('._wyj._20nr ._7gpd a._7gm_').length>0){
	// get new page name
	if (getElem('._wyj._20nr ._7gsh a').length>0)
		pageNameAdditionalCheck=getElem('._wyj._20nr ._7gsh a').text();
	do2();
}else{
	// если это ранмод 3 или 4 просто пытаемся еще раз и еще раз, макс 10 раз??
	if ((runMode==2 || runMode==3 || runMode==4) && tryAgainForFullScan<10 && window.location.href.indexOf('runMode=')>0){
		tryAgainForFullScan++;
		//console.log("try again");
		setTimeout(function(){do1()},1500);
	}else{
		//console.log("try again2");
		// Fans invite	
		if ((getElem('.layerCancel').length>0 || inviteWindowInNewUIOpen()) && !check_post_first){
			if (getElem('.layerCancel').length>1)
				setTimeout(function(){if (getElem('.layerCancel').length>1){getElem('.layerCancel')[1].click();}},70);
			if (getElem('.layerCancel').length>0)
				getElem('.layerCancel')[0].click();
			closeInviteWindowInNewUI();
			setTimeout(function(){do2()},2000);
		}else
			setTimeout(function(){do2()},200);
	}
}
}
}
}
}
}

function tryToCloseIfSomethingOpen2(){
// check if there are opened posts:
// 20200427 - if we just started, do not close the post, we need to get selected posts first!
if (doNotCloseFirstRunSelectPostsVerif){
	doNotCloseFirstRunSelectPostsVerif=false;
}else{
	if (getElem('.layerCancel').length>0){
		if (getElem('.layerCancel').length>4)
			setTimeout(function(){if (getElem('.layerCancel').length>4){getElem('.layerCancel')[4].click();}},20);
		if (getElem('.layerCancel').length>3)
			setTimeout(function(){if (getElem('.layerCancel').length>3){getElem('.layerCancel')[3].click();}},70);
		if (getElem('.layerCancel').length>2)
			setTimeout(function(){if (getElem('.layerCancel').length>2){getElem('.layerCancel')[2].click();}},170);
		if (getElem('.layerCancel').length>1)
			setTimeout(function(){if (getElem('.layerCancel').length>1){getElem('.layerCancel')[1].click();}},270);
		getElem('.layerCancel')[0].click();
	}
	closeInviteWindowInNewUI();
}
}


// FRIENDS ONLY ===================
function startScrollFriendsList(objDiv,els){
if (scriptIsRunning==1){
//console.log($('.fbProfileBrowser .fbProfileBrowserResult .fbProfileBrowserListContainer').height());
if (FriendsListHeight==getElem('.fbProfileBrowser .fbProfileBrowserResult .fbProfileBrowserListContainer').height() && FriendsTry==2){
	els=getElem('.fbProfileBrowserListContainer .uiButton._1sm');
	inviteNextFriend(0,els);
}else if(FriendsListHeight==getElem('.fbProfileBrowser .fbProfileBrowserResult .fbProfileBrowserListContainer').height()){
	FriendsTry++;
	setTimeout(function(){startScrollFriendsList(objDiv,els)},2000);
}else{
	FriendsTry=0;
	FriendsListHeight=getElem('.fbProfileBrowser .fbProfileBrowserResult .fbProfileBrowserListContainer').height();
	objDiv.scrollTop = objDiv.scrollHeight;
	setTimeout(function(){startScrollFriendsList(objDiv,els)},2000);
}
}
}
function inviteNextFriend(e,t){
if (scriptIsRunning==1){
	if(e<t.length){
		if (document.documentElement.innerHTML.indexOf('no more invitations to like this Page can be sent today')>-1){
			destroyPopup();
			alert('(1) ' + api.i18n.getMessage("limit_err1"));
		}else{
			found=0;
			if (getElem('._pig').length>0 && 1==2){
				var els = getElem('._pig');
				for(var m = 0; m < els.length; m++){
				  if(els[m].innerHTML.indexOf('/help/contact/') > -1){
					found=1;
					destroyPopup();
					alert(api.i18n.getMessage("limit_err1"));
				  }
				}
			}
			if (found==0){
				if (total<fb_limit){
						total++;
						t[e].click();
						//console.log('TRY');
				}			
				e++;
				timeout=Math.floor(Math.random() * (1700 - 1600 + 1)) + 1600;
				if (total % 3 === 0)
					timeout=Math.floor(Math.random() * (3000 - 1200 + 1)) + 1600;
				if (total % 40 === 0)
					timeout=Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
				
				TimerDelayVar1=setTimeout(function(){inviteNextFriend(e,t)}, timeout);
				updateCount(t.length);
			}
		}
	}else{
		destroyPopup();
		alert("FRIENDS INVITE: " + total + ' of ' + t.length + ' friends were invited. Try also to invite fans (who liked your posts)!');
	}
}
}
function updateCount(leng){
document.getElementById("invite-all-count-sw").innerText=total+"/"+leng
}
function createPopup2(){var e=document.getElementsByTagName("head")[0];var t=document.getElementsByTagName("body")[0];var n=document.createElement("div");n.setAttribute("id","add-all-div-sw");n.setAttribute("style",'text-align:center;font-family:"lucida grande",tahoma,verdana,arial,sans-serif;padding:20px;width:60%;border:2px solid #ccc;background-color:#fff;position:fixed;margin:0 auto;z-index:999;top: 5px;left:20%;font-size:1.5em;');n.innerHTML='Inviting Everyone in the List (Limit = ' + fb_limit +')...<span id="invite-all-count-sw">0</span> invited so far...';t.appendChild(n);popup=n}







// NEW FUNCTION TO WORK AS FOR EVENTS!!
function inviteFriendsNEW(){
var inviteEvent=getElem('.uiList._4kg ._2gdu ._42o8._42oc');


invitedToEvent = 0;

if (inviteEvent.length>0 && invitedToEvent<490)
	inviteNextForFRIENDSNEW(0,inviteEvent);
else
	scriptIsRunning=0;
}

function inviteNextForFRIENDSNEW(i,inputs){
if (scriptIsRunning==1){
	if(i<inputs.length){
		if (invitedToEvent<490){
			invitedToEvent++;
			inputs[i].click();
			//i++;
			setTimeout(function(){
				inputs=getElem('.uiList._4kg ._2gdu ._42o8._42oc');
				inviteNextForFRIENDSNEW(i,inputs);
			},150);
		}else{
			alert('ALL friends were selected, now you can check the list and click on "Send Invites" button.');
			scriptIsRunning=0;
		}
	}else{
		setTimeout(function(){inviteFRIENDSNEWScrollMore()}, 300);
	}
}
}

function inviteFRIENDSNEWScrollMore(){
if (getElem('._4t2a ._50f4 ._15z1._3kbk').length>0)
	setTimeout(function(){getElem('._4t2a ._50f4 ._15z1._3kbk').scrollTop(getElem('._4t2a ._50f4 ._15z1._3kbk')[0].scrollHeight);},5);
else
	scriptIsRunning=0;

setTimeout(function(){
inputs=getElem('.uiList._4kg ._2gdu ._42o8._42oc');
if (inputs.length>0)
	inviteNextForFRIENDSNEW(0,inputs);
else{
	alert('ALL friends were selected, now you can check the list and click on "Send Invites" button.');
	scriptIsRunning=0;
}
},2000);
}
// FRIENDS ONLY END=============



// NEW FUNCTION TO WORK AS FOR NEW FRIENDS INVITE!!
function inviteFriendsNew2020(){
var inviteEvent=getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false" && (!$(this).attr('tabindex') || $(this).attr('tabindex') != "-1"))});

invitedToEvent = 0;
//console.log("Click 0");

if ((inviteEvent.length>0 || getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false" || $(this).attr('aria-checked') == "true")}).length>0) && invitedToEvent<490)
	inviteNextForFRIENDSNEW2020(0,inviteEvent);
else
	scriptIsRunning=0;
}

function inviteNextForFRIENDSNEW2020(i,inputs){
	//console.log("Inv="+i);
if (scriptIsRunning==1){
	if(i<inputs.length){
		if (invitedToEvent<490){
			invitedToEvent++;
			inputs[i].click();
			i++;
			//console.log("Click 1");
			setTimeout(function(){
				//inputs=getElem('.uiList._4kg ._2gdu ._42o8._42oc');
				inviteNextForFRIENDSNEW2020(i,inputs);
			},150);
		}else{
			alert('ALL friends were selected, now you can check the list and click on "Send Invites" button.');
			scriptIsRunning=0;
		}
	}else{
		//console.log("Click 2");
		setTimeout(function(){inviteFRIENDSNEWScrollMore(0)}, 300);
	}
}
}

var maxScrolledElements=0;
function inviteFRIENDSNEWScrollMore(q){
	//console.log("Scroll more:"+q);
if (getScrollElemNewFb(scrollingNewFBDesignClassDef).length>0)
	setTimeout(function(){getScrollElemNewFb(scrollingNewFBDesignClassDef).scrollTop(9999999);},5);
else if (getScrollElemNewFb(scrollingNewFBDesignClass).length>0)
	setTimeout(function(){getScrollElemNewFb(scrollingNewFBDesignClass).scrollTop(9999999);},5);

setTimeout(function(){
var inputs=getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false" && (!$(this).attr('tabindex') || $(this).attr('tabindex') != "-1"))});

if (inputs.length>1)
	inviteNextForFRIENDSNEW2020(0,inputs);
else if (inputs.length<2 && (q<6 || getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false" || $(this).attr('aria-checked') == "true")}).length>maxScrolledElements)){
	maxScrolledElements=getElem('.oajrlxb2').filter(function () {return ($(this).attr('aria-checked') == "false" || $(this).attr('aria-checked') == "true")}).length;
	//console.log("maxScrolledElements="+maxScrolledElements);
	inviteFRIENDSNEWScrollMore(q+1);
}else{
	alert('ALL friends were selected, now you can check the list and click on "Send Invites" button.');
	scriptIsRunning=0;
}
},1500);
}





function inviteNextForEvent(i,inputs){
if (scriptIsRunning==1){
	if(i<inputs.length){
		if (invitedToEvent<500){
			invitedToEvent++;
			inputs[i].click();
			i++;
			setTimeout(function(){
				inviteEvent=getElem('._6ht6 ._6i6z._3qn7 button._1gcq').filter(function () {
				  return ($(this).attr('aria-checked') == "false");
				});
				if (inviteEvent.length>0)
					inviteNextForEvent(0,inviteEvent);
				else
					setTimeout(function(){inviteEventScrollMore(scrollQ+1)}, 10);
			},100);
		}else
			scriptIsRunning=0;
	}else{
		setTimeout(function(){inviteEventScrollMore(scrollQ+1)}, 10);
	}
}
}

function inviteEventScrollMore(quant){
	scrollQ=quant;
if (getElem('.ReactVirtualized__Grid.ReactVirtualized__List').length>0)
	setTimeout(function(){getElem('.ReactVirtualized__Grid.ReactVirtualized__List').scrollTop(quant*800);},5);
else if (getElem('._3qey .uiScrollableArea .uiScrollableAreaWrap').length>0)
	setTimeout(function(){getElem('._3qey .uiScrollableArea .uiScrollableAreaWrap').scrollTop(getElem('._3qey .uiScrollableArea .uiScrollableAreaWrap')[0].scrollHeight);},5);

setTimeout(function(){inviteEventF()}, 2000);
}
function inviteEventF(){
inviteEvent=getElem('.uiScrollableAreaContent ._1pt_ ._2aks ._51mw ._1pu4');
// 20190326
if (inviteEvent.length==0){
	inviteEvent=getElem('._6ht6 ._6i6z._3qn7 button._1gcq').filter(function () {
		  return ($(this).attr('aria-checked') == "false");
		});
}

if (inviteEvent.length>0 && invitedToEvent<500)
	inviteNextForEvent(0,inviteEvent);
else
	scriptIsRunning=0;
}
// open posts tab if it is not open yet // IT IS OK EVEN IF I RUN IT ON THE HOME PAGE, so DO NOT UPDATE THIS CODE
function do2(){
if (scriptIsRunning==1){
// check if we are on events tab and want to invite everyone for event
inviteEvent=getElem('.uiScrollableAreaContent ._1pt_ ._2aks ._51mw ._1pu4');
// 20190326
if (inviteEvent.length==0){
	inviteEvent=getElem('._6ht6 ._6i6z._3qn7 button._1gcq').filter(function () {
		  return ($(this).attr('aria-checked') == "false");
		});
}
if (inviteEvent.length>0){
	destroyPopup();
	scriptIsRunning=1;
	inviteEventF();
}else{
	var inputs = document.getElementsByClassName('_3f-h');
	if (inputs && inputs.length>0 && 1==2){
		for(locali=0;locali<inputs.length;locali++){
			// check if this is a link to the posts tab
			if (inputs[locali].getAttribute("href") && inputs[locali].getAttribute("href").indexOf('/posts/')>0)
				if (inputs[locali].className.indexOf('_3f-i')==-1){
					alert(api.i18n.getMessage("redirect"));
					inputs[locali].click();
					TimerDelayVar1=setTimeout(function(){do3()},7000);
				}else
					setTimeout(function(){do3()},1000);
			else
				setTimeout(function(){do3()},1000);
		}
	}else
		setTimeout(function(){do3()},1000);
}
}
}



function do3(){
// create popup
//console.log('do3');
if (scriptIsRunning==1){
totalPostsElaborated = skip_post_setting;
if (totalPostsElaborated>1)
	totalPostsElaborated--;
if (document.getElementById('add-all-div-sw') && popup)
	destroyPopup();
createPopup();

// if there is offset - scroll to it
if (skip_post_setting>7 && loop_PostsList.length==0){
//console.log('do3-1');
setTimeout(function(){tryClickToLoadMorePosts()},10);
for(var i=0;i<Math.ceil(skip_post_setting/5);i++){
	setTimeout(function(){tryClickToLoadMorePosts()},1000 + (3500 * i));
}
	
TimerDelayVar1=setTimeout(function(){do4()},4000 + (3500 * Math.ceil(skip_post_setting/5)));
}else if (loop_PostsList.length>0){
	//console.log('do3-2');
	timeout = 1000;
	if (loop_PostsListArray.length>0){
		var largest = Math.max.apply(Math, loop_PostsListArray);
		if (largest>0){
			for(var i=0;i<Math.ceil(largest/5);i++){
				TimerDelayVar1=setTimeout(function(){tryClickToLoadMorePosts()},1000 + (3500 * i));
				//console.log('do3-3');
				timeout=3500*i + 5000;
			}
		}
	}
	//console.log('do3-4:'+timeout);
	TimerDelayVar1=setTimeout(function(){do4()},timeout);
}else{
	//console.log('do3-5');
	// chech if there is an opened post
	if (check_post_first && (getElem('.layerCancel').length>0 || inviteWindowInNewUIOpen()))
		StartInvitePeople();
	else{
		if (inputsComments.length==0 || inputsComments.length<=totalPostsElaborated){
			tryClickToLoadMorePosts();
			setTimeout(function(){do4()},4000);
		}else
			do4();
	}
	}
}
}


var inputsShareButton=getElem('.qqfsdfsfsdwwwwwqwdnoelement');
var pageNameOfThisPost="";

// browse all visible posts
function do4(){
//console.log('do4:' + scriptIsRunning);
if (debug)
	console.log("inputsComments1:"+inputsComments.length);

// 20210406 - we scanned the one post already! So just turn back to the main code!
if (inputsComments.length>0){
	goBackToMainTab(0);
}else{
	
	
if (scriptIsRunning==1){
if (inputsComments.length==0 || inputsComments.length<=totalPostsElaborated)
	inputsComments = getElem('._2x4v','.hidden_elem ._2x4v');
if (debug)
	console.log("inputsComments2:"+inputsComments.length);
// 20181207
if ((inputsComments.length==0 || inputsComments.length<=totalPostsElaborated) && (getElem('._66lg a._3dlf,span.pcp91wgn','._66lg .hidden_elem a._3dlf').length>0 && (document.location.href.indexOf('/posts/')>0 || document.location.href.indexOf('/photos/')>0))){
	inputsComments = getElem('._66lg a._3dlf,span.pcp91wgn','._66lg .hidden_elem a._3dlf');
	// 20210406 - just one post to elaborate!
	inputsComments.length=1;
	
	// сохраняем сразу кнопку для шардед постов если она есть!
	if ($(inputsComments).closest('.bkfpd7mw').length>0 && $(inputsComments).closest('.bkfpd7mw').find('.gtad4xkn>span div[role="button"]').length>0)
		inputsShareButton=$(inputsComments).closest('.bkfpd7mw').find('.gtad4xkn>span div[role="button"]');
		
	// сохраняем имя если есть
	if (document.location.href.indexOf('/posts/') == -1){
		if ($(inputsComments).closest('div[role="article"]').length>0 && $(inputsComments).closest('div[role="article"]').find('h2 a.oajrlxb2[role="link"] span').length>0 && $(inputsComments).closest('div[role="article"]').find('h2 a.oajrlxb2[role="link"] span').text().length>0)
			pageNameOfThisPost=$(inputsComments).closest('div[role="article"]').find('h2 a.oajrlxb2[role="link"] span').text();
		console.log("my page name:"+pageNameOfThisPost);
	}
}
if ((inputsComments.length==0 || inputsComments.length<=totalPostsElaborated) && (getElem('._66lg a._3dlf,div[role="article"] .gpro0wi8 span.pcp91wgn','._66lg .hidden_elem a._3dlf').length>0 && document.location.href.indexOf('/posts/'))){
	inputsComments = getElem('._66lg a._3dlf,div[role="article"] .gpro0wi8 span.pcp91wgn','._66lg .hidden_elem a._3dlf');
}
		
// 20190913 - fix for watch!
if (inputsComments.length==0 && (getElem('._wyj._20nr ._7gpd a._7gm_').length>0 && document.location.href.indexOf('/watch/')))
	inputsComments = getElem('._wyj._20nr ._7gpd a._7gm_');
// 20210418 - fix for watch 2!
if (inputsComments.length==0 && (getElem('.stjgntxs div[role="button"] .ni8dbmo4>span').length>0 && document.location.href.indexOf('/watch/')))
	inputsComments = getElem('.stjgntxs div[role="button"] .ni8dbmo4>span');

// 20200223 - fix for videos!
if (inputsComments.length==0 && (getElem('._4bl7 ._7rb8 ._1n9k>a').length>0 && document.location.href.indexOf('/videos/'))){
	inputsComments = getElem('._4bl7 ._7rb8 ._1n9k>a');
	// we need to click on "ALL tab" for videos, cause only likes tab is opened by default (Facebook bug)
	setTimeout(function(){
		if (getElem('._4t2a ._21ab li._45hc>a','._4t2a ._21ab li._45hc._1hqh ._21af._9zc').length>0)
			getElem('._4t2a ._21ab li._45hc>a','._4t2a ._21ab li._45hc._1hqh ._21af._9zc')[0].click();
	},2000);
}

if (inputsComments.length==0 && getElem('.x1iyjqo2.x78zum5 span.x1ja2u2z').length>0 && getElem('.x1iyjqo2.x78zum5 span.x1ja2u2z').siblings('div[role="button"]').length>0){
	inputsComments=getElem('.x1iyjqo2.x78zum5 span.x1ja2u2z').siblings('div[role="button"]');
}else if (inputsComments.length==0 && getElem('.x1ja2u2z[role="toolbar"] div[role="button"]').length>0)
	inputsComments=getElem('.x1ja2u2z[role="toolbar"] div[role="button"]');

if (debug)
	console.log("inputsComments3:"+inputsComments.length);
if (loop_PostsListArray.length>0){
	//console.log('here1');
	if (inputsComments.length==0){
		if (tryMoreToScroll==3){
			//console.log('here2. runMode=' + runMode);
			if (runMode==3 || runMode==4){
				//console.log('next page gooooo');
				if (debug){console.log("next page 6");}
				open_next_page();
			}else{
				//console.log('here3');
				//20200430 - if there are no posts here, and we are from real time, let's reload it again after the pause?
				if (_runMode==2){
					// 20200430
					console.log("Error: didn't find posts after reload, will try to reload the page again in 1 minute. Wait.");
					updatePopup(". Error: didn't find posts after reload, will try to reload the page again in 1 minute. Wait..");
					TimerDelayVar1=setTimeout(function(){window.location.replace(window.location.href);},60000);
				}else{
					if (window.location.href.indexOf("/creatorstudio")>0){
						if (window.location.href.indexOf("/creatorstudio/?tab=home")>0 || window.location.href.indexOf("/creatorstudio?tab=home")>0)
							goBackToMainTab(0);
						else
							goBackToMainTab(0);
					}else if (isThisNewFbDesign2020() || newFBinviteDesign)
						goBackToMainTab(0);
					else
						alert(api.i18n.getMessage("error1"));
					destroyPopup();
					scriptIsRunning=0;
				}
			}
			//console.log('here4');
		}else{
			tryMoreToScroll++;
			if (debug)
				console.log("Scroll try 2");
			window.scrollTo(0,document.body.scrollHeight);
			TimerDelayVar1=setTimeout(function(){do4()},5000);
		}
	}else{
		//loop
		if (totalPostsElaborated<inputsComments.length){
			totalPostsElaborated++;
			if (normal_run_limitNoInvitePosts>=0)
				normal_run_limitNoInvitePosts++;
			else
				normal_run_limitNoInvitePosts=0;
			if (loop_PostsListArray.indexOf(totalPostsElaborated)>-1){
				if (inputsComments[totalPostsElaborated-1]){
					inputsComments[totalPostsElaborated-1].click();
					updatePopup();
					//console.log('exists');
					TimerDelayVar1=setTimeout(function(){StartInvitePeople()},fb_timeout_1);
				}else{
					if (debug)
						console.log("Scroll try 3");
					window.scrollTo(0,document.body.scrollHeight);
					TimerDelayVar1=setTimeout(function(){do4()},fb_timeout_4);
				}
			}else
				do4();
		}else{
			if (reloadloop)
				prepareforReloadPage();
			else{
				updatePopup('. ' + api.i18n.getMessage("pause_1") + ' ' + (loop_Pause/1000) + ' ' + api.i18n.getMessage("pause_2") + '',1);
				skip_if_no_buttons_after_first_loop=true;
				totalPostsElaborated=0;
				loopTimerDelay=setTimeout(function(){do4()},loop_Pause);
			}
		}
	}
}else{
	//console.log('here5');
	//OLD
if (inputsComments.length==0){
	if (tryMoreToScroll==3){
		if (runMode==3 || runMode==4){
			if (debug){console.log("next page 7");}
			open_next_page();
		}else{
			if (window.location.href.indexOf("/creatorstudio")>0){
				if (window.location.href.indexOf("/creatorstudio/?tab=home")>0 || window.location.href.indexOf("/creatorstudio?tab=home")>0)
					goBackToMainTab(0);
				else
					goBackToMainTab(0);
			}else if (isThisNewFbDesign2020() || newFBinviteDesign)
				goBackToMainTab(0);
			else
				alert(api.i18n.getMessage("error1"));
			destroyPopup();
			scriptIsRunning=0;
		}
	}else{
		tryMoreToScroll++;
		if (debug)
			console.log("Scroll try 4");
		window.scrollTo(0,document.body.scrollHeight);
		TimerDelayVar1=setTimeout(function(){do4()},5000);
	}
//20190913 - fix for watch go to next post!
}else if (window.location.href.indexOf("/watch/")>0 && totalPostsElaborated>=1){
		if (runMode==3 || runMode==4){
			if (debug){console.log("next page 8");}
			open_next_page();
		}else{
			console.log("Stop, debug: watch");
			stopScript();
		}
}else if (inputsComments.length>0 && inputsComments.length>totalPostsElaborated){
		inputsComments[totalPostsElaborated].click();
		totalPostsElaborated++;
		if (normal_run_limitNoInvitePosts>=0)
			normal_run_limitNoInvitePosts++;
		else
			normal_run_limitNoInvitePosts=0;
		//if (share_put_likes)
			updatePopup();
		//else
		//	updatePopup('. <span style="color:blue">New feature (August 5): check shared posts and like them (go to options)</span><small style="font-size: 0.45em;"></small>');
		checkTwice=0;
		TimerDelayVar1=setTimeout(function(){StartInvitePeople()},fb_timeout_1);
}else{
	if (MaxPostFound==totalPostsElaborated && checkTwice==1){
		if ((runMode==3 || runMode==4) && try_after_limit){
			if (debug){console.log("next page 9");}
			open_next_page();
		}else{
			console.log("Stop, debug: 5");
			stopScript();
		}
	}else{
		if (skip_post_setting>0 && skip_post_setting>inputsComments.length){
			//если настроен попуск постов скролим и скролим пока не доскролим
			if (lastlengthPosts==inputsComments.length && checkTwice>9)
				if ((runMode==3 || runMode==4) && try_after_limit){
					if (debug){console.log("next page 10");}
					open_next_page();
				}else{
					console.log("Stop, debug: 6");
					stopScript();
				}
			else{
				if (lastlengthPosts==inputsComments.length)
					checkTwice=checkTwice+2;
				else
					checkTwice=0;
				//console.log('We need to scroll more. lastlengthPosts=' + lastlengthPosts + ". inputsComments.length=" + inputsComments.length);
				lastlengthPosts=inputsComments.length;
				if (debug)
					console.log("Scroll try 5");
				window.scrollTo(0,document.body.scrollHeight);
				TimerDelayVar1=setTimeout(function(){do4()},fb_timeout_4);
			}
			
		}else{
			if(MaxPostFound==totalPostsElaborated)
				checkTwice=1;
			MaxPostFound=totalPostsElaborated;
			// all visible posts were elaborated, load more
				if (debug)
					console.log("Scroll try 6");
			// 20190913 do not scroll for watch
			if (window.location.href.indexOf("/watch/")==-1){
				window.scrollTo(0,document.body.scrollHeight);
				setTimeout(function(){tryClickToLoadMorePosts()},900);
				timeout=fb_timeout_4;
				if (totalPostsElaborated>20)
					timeout=fb_timeout_5;
				if (totalPostsElaborated>40)
					timeout=fb_timeout_6;
				setTimeout(function(){do4()},timeout);
			}else
				do4();
		}
	}
}
}
}
}
}

function tryClickToLoadMorePosts(){
//console.log('tryClickToLoadMorePosts');
//20190913 - do not scroll for Watch
if (window.location.href.indexOf("/watch/")==-1){
	if (document.getElementsByClassName("uiMorePagerPrimary") && document.getElementsByClassName("uiMorePagerPrimary")[0]){
		document.getElementsByClassName("uiMorePagerPrimary")[0].click();
	}
	if (getElem('.layerCancel').length>0)
		getElem('.layerCancel')[0].click();
	closeInviteWindowInNewUI();
	if (debug)
		console.log("Scroll try 7");
	
	
	if (document.location.href.indexOf('/posts/')>0 && (runMode==3 || runMode==4)){
	}else{
		setTimeout(function(){window.scrollTo(0,document.body.scrollHeight);},100);
	}
}
}

function ClosePostAndOpenNext(useTab,backFromCreatStatsPage){
	

//20190608 - now we can invite from SHARED POSTS!
if(debug)
	console.log("ClosePostAndOpenNext");
if (weAreInvitingFromShared>0){
	// close only one frame!
	if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>0)
		getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[0].click();
	closeInviteWindowInNewUI();
	
	// 20190713
	if (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments){
		clickedForMore=0;
		canSKIPButton=0;
		hadInvitedButton=0;
		hadClickedMoreButton=0;
		loopmaxtry=0;
		uiMorePagerPrimary=0;
		likeButtonsElaborated=0;
	}
	if (weAreInvitingFromShared==1)
		setTimeout(function(){checkInvitesOnShares2(sharedI,sharedInputs);},1500);
	else if (weAreInvitingFromShared==2)
		setTimeout(function(){elaborateCommentsInsideSharedPosts(sharedI,sharedInputs,sharedI2+1,sharedInputs2);},1500);
	else
		setTimeout(function(){checkInvitesOnShares2(sharedI,sharedInputs);},1500);
	
	weAreInvitingFromShared=0;
}else if (weAreScanningOnlyShared){
	// stop the script here!
	console.log("only shared scanned");
	stopScript('<span style="color:red">Extension stopped. We were scanning only opened shared posts.</span><br>');
}else if (weAreScanningOnlyInvites){
	// stop the script here!
	stopScript('<span style="color:red">Extension stopped. We were scanning only list of likers shown on the screen.</span><br>');
}else{
	// 20180715 - TODO
	if (useTab>-1 && bigPostTabs.length>0 && bigPostTabs.length>useTab+1 && bigPostTabs[useTab+1].length>0)
		StartInvitePeopleOLD(useTab+1)
	else{
	fixedStartOfI=0;
	fixedMaxTries=0;
	
	
	
	// 20210808 - we do not scan shared posts separately temporary!!!
	sharedPostIsCheckingNow=1;
	
	
	//console.log('close post and open next');
	if (scriptIsRunning==1){
	// Before closing the post - check if we need to check SHARED posts!
	// 20200407 if we in mode 3 or 4, we need to check shared posts even if this is just one post opened!
	if ((((share_put_likes && share_likes_limit>(total_shared_posts_liked+c_c2) && sharedPostIsCheckingNow==0) || (share_put_comments && text_comm_shares.length>1 && (total_shared_posts_commented+c_c3)<share_comments_limit && sharedPostIsCheckingNow==0) || ((inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments) && (mtotalInvited+c_c1)<fb_limit && sharedPostIsCheckingNow==0))) || 								(((runMode==3 || runMode==4) && (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments || share_put_likes || (share_put_comments && text_comm_shares.length>1)) &&  (getElem('._6iij ._355t._6iik ._3rwx,._437j ._3l-q a._3rwx').length>0 || (getElem('._6iij ._355t._6iik ._3rwx,._437j ._3l-q a._3rwx').length==0 && getElem('._355t._4vn2 ._3rwx').length>0) || inputsShareButton.length>0)  ) && ((share_put_likes && share_likes_limit>(total_shared_posts_liked+c_c2) && sharedPostIsCheckingNow==0) || (share_put_comments && text_comm_shares.length>1 && (total_shared_posts_commented+c_c3)<share_comments_limit && sharedPostIsCheckingNow==0) || ((inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments) && (mtotalInvited+c_c1)<fb_limit && sharedPostIsCheckingNow==0)))				){
		//console.log("CLOASING:"+getElem('._2pi9 .layerCancel, ._21ab .layerCancel'));
		if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>1)
			getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length-1].click();
		if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>0)
			getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[0].click();
		closeInviteWindowInNewUI();
		
		loadsWithNoWorkOnShares=0;
		
		
		
		if (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments){
			clickedForMore=0;
			canSKIPButton=0;
			hadInvitedButton=0;
			hadClickedMoreButton=0;
			loopmaxtry=0;
			uiMorePagerPrimary=0;
			likeButtonsElaborated=0;
		}
			
			
		//console.log("RRR=1");	
		TimerDelayVar1=setTimeout(function(){doSHAREDposts()},4000);
	}else{
		//console.log("RRR=2");
		//20201029 - moved this part here.
		//20200812 - if we have a new creator studio STATS page, then we need first to close it and then rerun this closePost function
		if (getElem('._98ry ._738z ._6np5,#vde_close_tray_button').length>0 && typeof backFromCreatStatsPage === 'undefined'){
			if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>0)
				getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[0].click();
			setTimeout(function(){
				if (getElem('.layerCancel').length>0)
					getElem('.layerCancel').last()[0].click();
			},500);
			setTimeout(function(){
				// go back to the list
				if (getElem('#vde_close_tray_button span').length>0){
					getElem('#vde_close_tray_button span')[0].click();
				}else if (getElem('._95vc ._3-8_ .rwb8dzxj .if5qj5rh').length>0)
					getElem('._95vc ._3-8_ .rwb8dzxj .if5qj5rh')[0].click();
				else
					console.log("We didn't find a button to close this stats window. Maybe Facebook changed its design");
				
				setTimeout(function(){ClosePostAndOpenNext(useTab, true);},2500);
			},1500);
		}else{
			//console.log("RRR=3");
			//scanManySharedOnPage=-1;
			sharedPostIsCheckingNow=0;

			// Close current post and go to the next one
			setTimeout(function(){
			// 20190212
			if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>1)
				getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length-1].click();
			if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>0)
				getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[0].click();
			closeInviteWindowInNewUI();

			if (getElem('.layerCancel').length>0)
				getElem('.layerCancel')[0].click();
			},650);

			//20190212 - close for Creator Studio
			if (document.location.href.indexOf('/creatorstudio') > 0)
				clickCloseButton();
			
			if (document.location.href.indexOf("/content_management") > 0 || document.location.href.indexOf("/latest/posts") > 0 || (window.location.href.indexOf("/publishing_tools")>0 && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0)){
			 if (getElem('._8pxk button._271k._271l._1o4e').length>0)
				 getElem('._8pxk button._271k._271l._1o4e')[0].click();
			 
				// пробуем пересоздать переменную тут!
				setTimeout(function(){
					//20200501 - we do not do this for selected posts
					if (selectedpostsRun==0)
						inputsPhoto=getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').filter(function () {return ($(this).find('.ellipsis,.kiex77na,.l6kht628>div').length>0 && ($(this).find('i').length==0 || ($(this).find('i').length>0 && (!$(this).find('i').text() || ($(this).find('i').text() && $(this).find('i').text().toLowerCase().indexOf('instagram')==-1)))));});
					//console.log("QQQ переменная новая:"+inputsPhoto.length);
				},1500);
			}

			if (publishingToolInv && getElem('.layerCancel').length>1)
				if (isNotificationTab)
					setTimeout(function(){clickCloseButton();},70);
				else
					setTimeout(function(){if (getElem('.layerCancel').length>1){getElem('.layerCancel')[1].click();}},70);
			if (publishingToolInv && getElem('.layerCancel').length>2)
				if (isNotificationTab)
					setTimeout(function(){clickCloseButton();},570);
				else
					setTimeout(function(){if (getElem('.layerCancel').length>2){getElem('.layerCancel')[2].click();}},140);
				
			if (photosTabRunAll && getElem('._n9 ._n3>a._xlt._418x').length>0)
				getElem('._n9 ._n3>a._xlt._418x')[getElem('._n9 ._n3>a._xlt._418x').length-1].click();

			// for multipage check limit
			if (runMode==3 && (totalPostsElaborated>=normal_run_limitposts || publishingToolTotPost>=normal_run_limitposts || normal_run_limitNoInvitePosts>normal_run_limitNoInvGoNextPage || (window.location.href.indexOf('/creatorstudio')>0 && (totalPostsElaborated>=50 || publishingToolTotPost>=50)))){
				if (debug){console.log("next page 11");}
				open_next_page();
			}else if ((runMode==3 || runMode==4) && weAreElaboratingAlbums==0 && (window.location.href.indexOf('/photo/')>0 || window.location.href.indexOf('/photos/')>0 || window.location.href.indexOf('/videos/')>0 || window.location.href.indexOf('/posts/')>0 || window.location.href.indexOf('/video/')>0 || window.location.href.indexOf('/post/')>0) && window.location.href.indexOf('latest/posts')==-1){
				// 20200407 if we elaborate just single post, in 3 or 4 mode, we don't need to go to the next, just REDIRECT to next page!
				if (debug){console.log("next page 12");}
				open_next_page();
			}else{
				//console.log("RRR=4");
				clickedForMore=0;
				canSKIPButton=0;
				hadInvitedButton=0;
				hadClickedMoreButton=0;
				loopmaxtry=0;
				uiMorePagerPrimary=0;
				likeButtonsElaborated=0;
				// если проверяем фото то просто идем к след фото
				if (isPhotoInviting==1)
					if (loop_skip_secondtime){
						//console.log("RRR=5");
						TimerDelayVar1=setTimeout(function(){doPHOTO3()},3300);
					}else{
						//console.log("RRR=6");
						TimerDelayVar1=setTimeout(function(){doPHOTO()},3300);
					}
				else{
					//console.log("RRR=7");
					TimerDelayVar1=setTimeout(function(){do4()},3300);
				}
			}
		}
	}
	}
	}

}
}

function clickCloseButton(){
for (locali=0;locali<getElem('._4t2a ._4-i0 ._51-u .layerCancel').length;locali++)
	getElem('._4t2a ._4-i0 ._51-u .layerCancel')[locali].click();
if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>1)
	getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length-1].click();

if (getElem('._4t2a ._4-i0 ._51-u ._42ft,._4t2a ._pig ._8dwn ._8dvy','.layerCancel._42ft','.layerCancel._42ft').length){
	// 20200417 - we need to close scheduled post and confirm the dicard it
	getElem('._4t2a ._4-i0 ._51-u ._42ft,._4t2a ._pig ._8dwn ._8dvy','.layerCancel._42ft','.layerCancel._42ft')[0].click();
	setTimeout(function(){
		if (getElem('._4t2a .layerConfirm').length>0)
			getElem('._4t2a .layerConfirm')[0].click();
	},500);
}
setTimeout(function(){
if (getElem('.layerCancel').length>0)
	getElem('.layerCancel')[0].click();
},30);
}


function doSHAREDposts(){
//console.log('open shared list');
if (scriptIsRunning==1){
uiMorePagerPrimary=0;
likeButtonsElaborated=0;
updatePopup();
if (debug)
	console.log("doSHAREDposts 1");

//20181102 - fix for adsmanager
if (window.location.href.indexOf('/adsmanager/')>0 || window.location.href.indexOf('/content_management')>0 || document.location.href.indexOf("/latest/posts") > 0 || (window.location.href.indexOf("/publishing_tools")>0 && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0)){
	if (getElem('._4t2a .userContentWrapper span.fwb.fcg a').length==1 && getElem('._4t2a .userContentWrapper span.fwb.fcg a').text().length>0)
		pageNameAdditionalCheck=getElem('._4t2a .userContentWrapper span.fwb.fcg a').text();
}


// если есть шаред посты - открываем их, и пытаемся лайкать! НО БЛОКИРУЕМ ЛУУП, когда попытается пойти к след. посту
sharedPostIsCheckingNow=1;
sharedPostsHeight=0;
sharedMaxScroll=0;
// now we delete comments, so we cannot know where we failed, we have to load them again and again??
//itemElaborated=fixedStartOfI;
itemElaborated=0;


//inputsPhoto2=getElem('._37uu ._3399 ._524d ._36_q a._2x0m,.gtad4xkn .oi732d6d,.gtad4xkn div[role="button"] span','.hidden_elem a._2x0m').last();
inputsPhoto2=$(inputsComments).closest('.bkfpd7mw').find('.gtad4xkn>span div[role="button"]').last();

//if ((isNotificationTab && $('.UFIList .UFIShareRow .UFIShareLink').not('.hidden_elem .UFIShareLink').length>0) || inputsPhoto2.length==0)
//	inputsPhoto2=$('.UFIList .UFIShareRow .UFIShareLink').not('.hidden_elem .UFIShareLink');
//20181124 - Notification tab fixed shared post element
if (isNotificationTab){
	inputsPhoto2.length=0;
	if (getElem('.UFIList .UFIShareRow .UFIShareLink','.hidden_elem .UFIShareLink').length>0)
		inputsPhoto2=getElem('.UFIList .UFIShareRow .UFIShareLink','.hidden_elem .UFIShareLink');
	if (inputsPhoto2.length==0 && getElem('.userContentWrapper ._4vn1 ._3rwx._42ft','.hidden_elem ._3rwx._42ft').length>0)
		inputsPhoto2=getElem('.userContentWrapper ._4vn1 ._3rwx._42ft','.hidden_elem ._3rwx._42ft');
}
//20190309 - shared posts on events page
if (document.location.href.indexOf('/events/') > 0 && inputsPhoto2 && inputsPhoto2[scanManySharedOnPage+1]){
	lastphotoOpen=inputsPhoto2.length;
	inputsPhoto2[scanManySharedOnPage+1].click();
	TimerDelayVar1=setTimeout(function(){StartLIKEPosts(0)},fb_timeout_1);
	scanManySharedOnPage++;
}else if (inputsPhoto2.length>0 && document.location.href.indexOf('/events/')==-1){
	lastphotoOpen=inputsPhoto2.length;
	if (inputsPhoto2.length>1){
		inputsPhoto2[inputsPhoto2.length-1].click();
	}else{
		inputsPhoto2[0].click();
	}
	//console.log('Start invite for photo: ' + totalPostsElaborated);
	TimerDelayVar1=setTimeout(function(){StartLIKEPosts(0)},fb_timeout_1);
}else{
	//20181031 - fix for single sharing post
	var _clicked=false;
	if (inputsPhoto2.length==0 && (window.location.href.indexOf('/videos/') > 0 || window.location.href.indexOf('/photo/') > 0) && getElem('._437j ._3l-q ._36_q a,.gtad4xkn .oi732d6d,._437j ._3l-q ._355t a').length>0){
		getElem('._437j ._3l-q ._36_q a,.gtad4xkn .oi732d6d,._437j ._3l-q ._355t a').each(function(index){
			// check that link contains shares word!
			if($(this)[0].getAttribute('href') && $(this)[0].getAttribute('href').indexOf('shares/')>-1){
				$(this)[0].click();
				_clicked=true;
				TimerDelayVar1=setTimeout(function(){StartLIKEPosts(0)},fb_timeout_1);
			}
		});
	}
	// 20190114 - shared posts fix
	if (inputsPhoto2.length==0 && window.location.href.indexOf('/photos/') > 0 && getElem('._6iij ._355t._6iik ._3rwx').length>0){
		getElem('._6iij ._355t._6iik ._3rwx')[0].click();
		_clicked=true;
		TimerDelayVar1=setTimeout(function(){StartLIKEPosts(0)},fb_timeout_1);
	}
	// 20200407 - shared posts fix for posts, reported by wkit88@outlook.com
	if (inputsPhoto2.length==0 && (runMode==3 || runMode==4)){
		if (getElem('._6iij ._355t._6iik ._3rwx,._437j ._3l-q a._3rwx').length>0){
			getElem('._6iij ._355t._6iik ._3rwx,._437j ._3l-q a._3rwx')[0].click();
			_clicked=true;
			TimerDelayVar1=setTimeout(function(){StartLIKEPosts(0)},fb_timeout_1);
		}else if (getElem('._355t._4vn2 ._3rwx').length>0){
			getElem('._355t._4vn2 ._3rwx')[0].click();
			_clicked=true;
			TimerDelayVar1=setTimeout(function(){StartLIKEPosts(0)},fb_timeout_1);
		}
	}
	if (!_clicked){
		if (debug)
			if (debug) {console.log("GO TO NEXT Here 6");}
		ClosePostAndOpenNext(-1);
	}
}


}
}

function StartLIKEPosts(_tries){
if (scriptIsRunning==1){

// check all posts!
inputsPhoto2=getElem('._5ki2 ._4-u2._4mrt._5jmm,div[role="dialog"] .buofh1pr>.sjgh65i0','#pagelet_timeline_main_column ._4-u2._4mrt._5jmm,.hidden_elem ._4-u2._4mrt._5jmm');
if (inputsPhoto2.length>0 && itemElaborated!=inputsPhoto2.length){
	//alert(inputsPhoto2.length);
	//console.log("SCAN IT");
	itemElaborate(itemElaborated,inputsPhoto2);
}else{
	// 20201227 - try to scroll more in business suite!
	if (_tries<3){
		_tries++;
		if (_tries==1 || _tries==3){
			if (getElem(scrollingNewFBDesignClassDef).length>0)
				getScrollElemNewFb(scrollingNewFBDesignClassDef).scrollTop(getScrollElemNewFb(scrollingNewFBDesignClassDef).height()*2*_tries);
			if (getElem(scrollingNewFBDesignClass).length>0)
				getScrollElemNewFb(scrollingNewFBDesignClass).scrollTop(getScrollElemNewFb(scrollingNewFBDesignClass).height()*2*_tries);
		}else{
			if (getElem(scrollingNewFBDesignClassDef).length>0)
				getScrollElemNewFb(scrollingNewFBDesignClassDef).scrollTop(99999);
			if (getElem(scrollingNewFBDesignClass).length>0)
				getScrollElemNewFb(scrollingNewFBDesignClass).scrollTop(99999);
		}
		TimerDelayVar1=setTimeout(function(){StartLIKEPosts(_tries)},3500);
	}else{
		if (debug) {console.log("GO TO NEXT Here 7");}
		ClosePostAndOpenNext(-1);
	}
}
}
}

function itemElaborate(i,inputs, notTryChangePoster,skipClickShowAttachment){
	
	weAreInvitingFromShared=0;

if (scriptIsRunning==1){
// check if we need to check the captcha


// 20210209 - click on "Show Attachment" button in shares ---- DISABLED FOR SINGLE POST SCAN cause they open sometimes posts on the same tab.
if ($(inputs[i]).find('.mfxi4zlt.scb9dxdr.dflh9lhu div[role="button"]').length>0 && (typeof skipClickShowAttachment === 'undefined' || !skipClickShowAttachment) && 1==2){
	$(inputs[i]).find('.mfxi4zlt.scb9dxdr.dflh9lhu div[role="button"]')[0].click();
	TimerDelayVar1=setTimeout(function(){itemElaborate(i,inputs,notTryChangePoster,true);},3500);
}else{


if (debug)
	console.log("stop_on_captcha_shown:"+stop_on_captcha_shown);
//20200428 - added a verification if popup is not shown in shared posts
if ((!stop_on_captcha_shown || (stop_on_captcha_shown && noFbLimitTriggered())) && !checkLimitationPopup2()){
	temp_block_help=false;
	if (typeof notTryChangePoster === 'undefined')
		tryToChangePoster=false;
	
	
	// let's delete 3 previous shared posts to save ram.
	if (i>2 && 1==1){
		//console.log("we are removing element, now we check:"+i);
		if ($(inputs[i-3])){
			itemRemovedSharedScroll=true;
			$(inputs[i-3]).remove();
		}
	}
	
	
	//if ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv').length>0)
	//	console.log($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text);
	//else
	//	console.log("NO NAME?");
	if(i<inputs.length){
		sharedPostsStuckCheck=0;
		//это наш пост, скип его
		if ($(inputs[i]).find('._5vsi._192z ._5ybo._5yhh').length && $(inputs[i]).find('._5vsi._192z ._5ybo._5yhh').length>0 && 1==2){
			console.log('Do not like this, its own post.');
			i++;
			itemElaborated=i;
			TimerDelayVar1=setTimeout(function(){itemElaborate(i,inputs);},localtimeout);
		}else{
			localtimeout=10;
			// проверка есть ли выбор кем постить, иначе скип, только для ревью и пост ту пейдж не скипаем, так как страница наша
			//if ($(inputs[i]).find('._37uu ._3m9g,button.bp9cbjyn').length>0){
				// do everything here.
			//	mainCall(i,inputs);
			//}else{
				// we miss the option to change the page but let's check if we can post!
			//console.log("VVVVVVVVVVV = check here");
			//console.log($(inputs[i]).html());
			commentLink = $(inputs[i]).find('._37uu .comment_link,._18vi ._666h');
			
			//20201227 - search by button name for Business Suite
			if (commentLink.length==0 && $(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]')){
				commentLink=$(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]');
			}
			
			if (commentLink.length>0){
				temp_block_help=true;
				commentLink[0].click();
				//console.log("VVVVVVVVVVV = check here 2");
				setTimeout(function(){checkIfWeCanCommentByPage(i,inputs);},600);
			}else{
				//console.log("VVVVVVVVVVV = check here 3");
				temp_block_help=true;
				//console.log('ERROR: Comment button not found 1:'+$(inputs[i]).html());
				// 20201105 - pause before second check!
				setTimeout(function(){secondCheckOnCommentButton2(i,inputs);},5000);
			}
			//}
			if (!temp_block_help){
				i++;
				itemElaborated=i;
				//console.log("VVVVVVVVVVV = check here 4");
				TimerDelayVar1=setTimeout(function(){itemElaborate(i,inputs);},localtimeout);
			}
		}
	}else{
		if (debug)
			console.log("sharedPostsStuckCheck:"+sharedPostsStuckCheck);
		if (sharedPostsStuckCheck<5 && ((total_shared_posts_liked+c_c2)<share_likes_limit || (share_put_comments && text_comm_shares.length>1 && (total_shared_posts_commented+c_c3)<share_comments_limit))){
			sharedPostsStuckCheck++;
			itemsLoadMore(0,4);
		}else{
			if (debug) {console.log("GO TO NEXT Here 8");}
			setTimeout(function(){ClosePostAndOpenNext(-1)},500);
		}
	}
}else
	stopScript('<span style="color:red">Extension stopped. Facebook popup message was detected.</span><br>');
}
}
}
function secondCheckOnCommentButton2(i,inputs){
temp_block_help=false;

commentLink = $(inputs[i]).find('._37uu .comment_link,._18vi ._666h');
//20201227 - search by button name for Business Suite
if (commentLink.length==0 && $(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]')){
	commentLink=$(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]');
}
if (commentLink.length>0){
	temp_block_help=true;
	commentLink[0].click();
	setTimeout(function(){checkIfWeCanCommentByPage(i,inputs);},600);
}else{
	console.log('ERROR: Comment button not found 1 (SECOND CHECK)');
	// let's try to like the post only!
	if (share_put_likes && (total_shared_posts_liked+c_c2)<share_likes_limit && ($(inputs[i]).find('._37uu ._3m9g,button.bp9cbjyn').length>0 || do_not_check_who_comments2!='postPage') && $(inputs[i]).find('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi .e71nayrh._18vj .bdca9zbp,._1dnh a[aria-label="'+getTextForCurrentLanguage('likeButton')+'"],._18vi a._6a-y,.ozuftl9m div[aria-label="'+getTextForCurrentLanguage('likeButton')+'"]').not('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILinkBright, ._55ij .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink, ._4-u2.aero .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi a._3_16').length>0){
		temp_block_help=true;
		//console.log("TEEEST1");
		tryToLikeOnlyNoCommentAvailable(i,inputs);
	}
}
//}
if (!temp_block_help){
	i++;
	itemElaborated=i;
	TimerDelayVar1=setTimeout(function(){itemElaborate(i,inputs);},localtimeout);
}
}
function checkInvitesOnShares(i,inputs){
if (scriptIsRunning==1){
	//20190608 - NEW, now we can INVITE from SHARES!!!!
	if (debug){
		console.log("======================== CHECK HERE");
		console.log("======================== CHECK HERE:"+getCurrentPageTitle());
		console.log(getCurrentPageTitle().startsWith($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text));
		console.log("======================== CHECK HERE:"+$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text);
		//console.log("From list:"+arrayInStringFound(shares_reply_ignore_array,$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text));
		//console.log(shares_reply_ignore_array[0]);
		//console.log($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text);
		//console.log(shares_reply_ignore_array[0].length);
		//console.log($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text.length);
		console.log(inviteDuringShareCheck);
		console.log(inviteDuringShareCheck && $(inputs[i]).find('.pcp91wgn,._66lh a').length>0 && ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv').length==0 || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text==getCurrentPageTitle() || getCurrentPageTitle().startsWith($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text) || (   (shares_reply_ignore_array.length>0 && arrayInStringFound(shares_reply_ignore_array,$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text))   ) )));
	}
	if (inviteDuringShareCheck && $(inputs[i]).find('.pcp91wgn,._66lh a').length>0 && ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv').length==0 || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text==getCurrentPageTitle() || getCurrentPageTitle().startsWith($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text) || (   (shares_reply_ignore_array.length>0 && arrayInStringFound(shares_reply_ignore_array,$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text))   ) ))){
		if (debug)
			console.log("Check likes here!");
		$(inputs[i]).find('.pcp91wgn,._66lh a')[0].click();
		weAreInvitingFromShared=1;
		sharedI=i;
		sharedInputs=inputs;
		TimerDelayVar1=setTimeout(function(){StartInvitePeople();},5000);
	}else{
		if (debug)
			console.log("no invites, go to next shared post");
		checkInvitesOnShares2(i,inputs);
	}
}
}
function checkInvitesOnShares2(i,inputs){
// 20200419 - new feature we need to check invites here!!!!
if (scriptIsRunning==1){
	// 20200419 we try to invite likers here, if disabled or no likes, we go to ClosePostAndOpenNext as before so move to the next post
	if (inviteDuringShareCheck2 || likeSharedComments){
		// verify if we DON'T HAVE a comment here from our page OR from list of pages (in that case go to next shared post!
		if ($(inputs[i]).find('.UFIContainer a[href*="'+getCurrentPage()+'"]').length==0 && $(inputs[i]).find('.UFIContainer ._3b-9._j6a a.UFICommentActorName:contains("'+getCurrentPageTitle()+'"),a._6qw4:contains("'+getCurrentPageTitle()+'")').length==0 && $(inputs[i]).find('.UFIContainer ._3b-9._j6a a.UFICommentActorName:contains("'+getCurrentPageTitle2(i, inputs)+'"),a._6qw4:contains("'+getCurrentPageTitle2(i, inputs)+'")').length==0 && (window.location.href.indexOf("facebook.com/ads/")==-1 || ((window.location.href.indexOf("facebook.com/ads/")>0 || window.location.href.indexOf("facebook.com/adsmanager/")>0 || window.location.href.indexOf("/content_management")>0 || document.location.href.indexOf("/latest/posts") > 0) && $(inputs[i]).find('.uiHelpLink').length==0)) && 									$(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').length>0 && (($(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt") && $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt").length>1 && ($(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle() || getCurrentPageTitle()=="skip" || $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle2(i, inputs)))) && $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt").length>1 && $(inputs[i]).find('.UFIRow.UFIComment .UFICommentAuthorWithPresence:has(img[alt="'+$(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")+'"])').length==0 && !arrayInStringFound(do_not_check_shared_my_name_s_Array,$(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt"))										|| $(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').length>0 && (($(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text() && $(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text().length>1 && ($(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text()==getCurrentPageTitle() || getCurrentPageTitle()=="skip" || $(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text()==getCurrentPageTitle2(i, inputs)))) && $(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text().length>1 && $(inputs[i]).find('a[role="link"] .d2edcug0').length>0 && $(inputs[i]).find('a[role="link"] .d2edcug0').text() && ($(inputs[i]).find('a[role="link"] .d2edcug0').text().indexOf(getCurrentPageTitle())>=0 || $(inputs[i]).find('a[role="link"] .d2edcug0').text().indexOf(getCurrentPageTitle2(i, inputs))>=0) && !arrayInStringFound(do_not_check_shared_my_name_s_Array,$(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text())		){
			// we don't have our comment here proceed!
			if (debug)
				console.log("no our comment here 1");
			
			// 20200625 - if likeSharedComments is ON then we need to verify ALL COMMENTS ANYWAY!
			if (likeSharedComments && $(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li').length>0){
				// if we can expand, DO this
				if ($(inputs[i]).find('.UFIContainer ._3b-9 .UFIPagerRow._4oep .UFIPagerLink').length>0) {
					if (debug)
						console.log('click on show more comments');
					$(inputs[i]).find('.UFIContainer ._3b-9 .UFIPagerRow._4oep .UFIPagerLink')[0].click();
				//}else{
					
					//elaborateCommentsInsideSharedPosts(i,inputs,0,$(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li').not('.UFIReplyList .UFIRow.UFIComment'));
				}	
				// 20200625 - expand second level (replies)
				if ($(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink').length>1)
					$(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink')[1].click();
				if ($(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink').length>0)
					$(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink')[0].click();
				
				setTimeout(function(){elaborateCommentsInsideSharedPosts(i,inputs,0,$(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li'));},1000);
			}else
				futureAdditionalOptionForSharesPostHere(i,inputs);
		}else{
			// we have our comment here, we need to check it if we locate it, OR, check all of them if now!
			
			//20200429 - .not('.UFIReplyList .UFIRow.UFIComment') добавил это но можно и убрать если будут проблемы. Исключил просто проверку внутри второго уровня
			if (debug)
				console.log("WE HAVE OUR COMMENT HERE! Let's scan it if we find it!");
			// elaborate each comment inside shared post!
			if ($(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li').length>0){ //.not('.UFIReplyList .UFIRow.UFIComment')
				if (debug)
					console.log("We have comments here:"+$(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li').length); //.not('.UFIReplyList .UFIRow.UFIComment')
				
				// if we can expand, DO this
				if ($(inputs[i]).find('.UFIContainer ._3b-9 .UFIPagerRow._4oep .UFIPagerLink').length>0) {
					if (debug)
						console.log('click on show more comments');
					$(inputs[i]).find('.UFIContainer ._3b-9 .UFIPagerRow._4oep .UFIPagerLink')[0].click();
					//setTimeout(function(){elaborateCommentsInsideSharedPosts(i,inputs,0,$(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li').not('.UFIReplyList .UFIRow.UFIComment'));;},1000);
				//}else{
					//elaborateCommentsInsideSharedPosts(i,inputs,0,$(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li').not('.UFIReplyList .UFIRow.UFIComment'));
				}
				
				// 20200625 - expand second level (replies)
				if ($(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink').length>1)
					$(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink')[1].click();
				if ($(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink').length>0)
					$(inputs[i]).find('.UFIContainer ._3b-9 .UFIReplyList .UFIRow .UFICommentLink')[0].click();
			
				setTimeout(function(){elaborateCommentsInsideSharedPosts(i,inputs,0,$(inputs[i]).find('.commentable_item .UFIRow.UFIComment,.commentable_item ul._7791>li,.cwj9ozl2>ul>li'));},1000); //.not('.UFIReplyList .UFIRow.UFIComment')
				
			}else{
				// 20200421 - when I run this on shares of mark zuck post, it always pass here, WHY?!
				//console.log("we didn't find comments after the second check, first check was ok. There is some error");
				setTimeout(function(){futureAdditionalOptionForSharesPostHere(i,inputs);},500);
			}
		}
	}else{
		// option disabled, just go to the next share post!
		//console.log("option disabled, nothing to do here");
		
		futureAdditionalOptionForSharesPostHere(i,inputs);
	}
}
}
function elaborateCommentsInsideSharedPosts(i,inputs,k,sharedCommElem){
if (scriptIsRunning==1){
	//console.log("we elaborate comment inside share:"+k);
	// here we elaborate each shared comment one by one
	if (k<sharedCommElem.length){
		if (debug){
			console.log("QQQQQQQQQQQQQ 2:"+getCurrentPageTitle());
			console.log("title2="+getCurrentPageTitle2(i, inputs));
			console.log(arrayInStringFound(do_not_check_shared_my_name_s_Array,$(sharedCommElem[k]).find('a[role="link"] .d2edcug0').text()));
		}
		// verify if this is OUR comment
		if (($(sharedCommElem[k]).find('a[href*="'+getCurrentPage()+'"]').length>0 || $(sharedCommElem[k]).find('a.UFICommentAuthorWithPresence:contains("'+getCurrentPageTitle()+'"),a._6qw4:contains("'+getCurrentPageTitle()+'")').length>0 || $(sharedCommElem[k]).find('a.UFICommentActorName:contains("'+getCurrentPageTitle()+'")').length>0 || $(sharedCommElem[k]).find('a.UFICommentAuthorWithPresence:contains("'+getCurrentPageTitle2(k, sharedCommElem)+'"),a._6qw4:contains("'+getCurrentPageTitle2(k, sharedCommElem)+'")').length>0 || $(sharedCommElem[k]).find('a.UFICommentActorName:contains("'+getCurrentPageTitle2(k, sharedCommElem)+'"),a._6qw4:contains("'+getCurrentPageTitle2(k, sharedCommElem)+'")').length>0 || $(sharedCommElem[k]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle() || $(sharedCommElem[k]).find('.UFIReplyActorPhotoWrapper img,.UFICommentAuthorWithPresence img,.a img').attr("alt")==getCurrentPageTitle2(k, sharedCommElem) || arrayInStringFound(do_not_check_shared_my_name_s_Array,$(sharedCommElem[k]).find('.UFIReplyActorPhotoWrapper img,.UFICommentAuthorWithPresence img,.a img').attr("alt"))) 				||  					($(sharedCommElem[k]).find('a[role="link"] .d2edcug0').length>0 && $(sharedCommElem[k]).find('a[role="link"] .d2edcug0').text() && $(sharedCommElem[k]).find('a[role="link"] .d2edcug0').text().indexOf(getCurrentPageTitle())>=0 || arrayInStringFound(do_not_check_shared_my_name_s_Array,$(sharedCommElem[k]).find('a[role="link"] .d2edcug0').text()))					){
			//console.log("QQQQQQQQQQQQQ 3");
			// this is our comment! check if we have likes here
			if (inviteDuringShareCheck2){
				if (debug)
					console.log("this is our comment");
				if ($(sharedCommElem[k]).find('.UFICommentReactionsBling,div[role="button"] .b3onmgus img,._1lh3 a._1lh9').length>0){
					if (debug)
						console.log("we have likes here, scan them!");
					$(sharedCommElem[k]).find('.UFICommentReactionsBling,div[role="button"] .b3onmgus img,._1lh3 a._1lh9')[0].click();
					weAreInvitingFromShared=2; // means we scan comments inside shared post!
					sharedI=i;
					sharedInputs=inputs;
					sharedI2=k;
					sharedInputs2=sharedCommElem;
					TimerDelayVar1=setTimeout(function(){StartInvitePeople();},5000);
				}else{
					k++;
					elaborateCommentsInsideSharedPosts(i,inputs,k,sharedCommElem);
				}
			}else{
				k++;
				elaborateCommentsInsideSharedPosts(i,inputs,k,sharedCommElem);
			}
		}else{
			//console.log("QQQQQQQQQQQQQ 4");
			// 20200625 - this is NOT our comment, let's like it!
			if (debug)
				console.log("this is not our comment - LIKE IT");
			localtimeout=20;
			if (likeSharedComments && $(sharedCommElem[k]).find('._khz .UFILikeLink,div[role="button"] .bdca9zbp,._6coj a._6a-y,a[aria-label="'+getTextForCurrentLanguage('likeButton')+'"]').not('._khz .UFILinkBright,a._3_16').length>0){
				// try to like it if possible
				$(sharedCommElem[k]).find('._khz .UFILikeLink,div[role="button"] .bdca9zbp,._6coj a._6a-y,a[aria-label="'+getTextForCurrentLanguage('likeButton')+'"]').not('._khz .UFILinkBright,a._3_16')[0].click();
				total_shared_posts_liked++;
				loadsWithNoWorkOnShares=0;
				updatePopup();
				localtimeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
			}
			k++;
			TimerDelayVar1=setTimeout(function(){elaborateCommentsInsideSharedPosts(i,inputs,k,sharedCommElem);},localtimeout);
		}
	}else{
		// elaborated all of them, go to next shared
		futureAdditionalOptionForSharesPostHere(i,inputs);
	}
}
}
function futureAdditionalOptionForSharesPostHere(i,inputs){
// 20200419 if I add any new feature, make it here like I did with checkInvitesOnShares2 function.
// go to the next one
if (debug)
	console.log("go to the next shared post now!");
imgSharedCommentPoster="";
i++;
itemElaborated=i;
setTimeout(function(){itemElaborate(i,inputs);},10);
}
function noFbLimitTriggered(){
if (scriptIsRunning==1){
if ((getElem('._4t2a,.uiLayer').is(':visible') && ((getElem('._4t2a,.uiLayer').find('._pig').length>0 && getElem('._4t2a,.uiLayer').find('._pig').length>0 && getElem('._4t2a ._pig .userContentWrapper').length==0) || getElem('._4t2a,.uiLayer').find('.confirmation_message').length>0 || getElem('button#captcha_dialog_submit_button').length>0) && getElem('._4t2a,.uiLayer').find('._r3v').length==0 && (getElem('._4t2a ._50f4').length==0 || getElem('._4t2a ._50f4').text().indexOf('Your message has been sent')==-1)) || checkNewLimitPopupInClassicDesign() || getElem('._4-i0 ._52c9').filter(function () {return ($(this).text().indexOf('Use This Feature Right')>-1)}).length>0){
	if ((runMode==3 || runMode==4) && try_after_limit){
		if (debug){console.log("next page 13");}
		open_next_page();
		return false;
	}else{
		stopScript('<span style="color:red">Extension stopped. Facebook popup message was detected.</span><br>');
		return false;
	}
}else
	return true;
}else
	return false;
}
function checkIfWeCanCommentByPage(i,inputs){
	if ($(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-,._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain','a img._3me-').length>0){
		if (doICommentAsPage(i,inputs)){
			// this is PAGE COMMENT! We can do that!
			if (debug)
				console.log('COMMENT BY PAGE - do it!');
			temp_block_help=false;
			
			// 20201105 - quick click to get focus
			if ($(inputs[i]).find('._37uu ._3m9g ._40yk a,button.bp9cbjyn,._1dnh a[type="button"]').length==1){
				// открыть
				$(inputs[i]).find('._37uu ._3m9g ._40yk a,button.bp9cbjyn,._1dnh a[type="button"]')[0].click();
				
				// закрыть
				setTimeout(function(){
					if ($(inputs[i]).find('._37uu ._3m9g ._40yk a,button.bp9cbjyn,._1dnh a[type="button"]').length==1)
						$(inputs[i]).find('._37uu ._3m9g ._40yk a,button.bp9cbjyn,._1dnh a[type="button"]')[0].click();
				},500);
				
				setTimeout(function(){
					mainCall(i,inputs);
				},800);
			}else
				mainCall(i,inputs);
			// go to the next if it is not blocked.
			//20190918 - moved to maincall
			//if (!temp_block_help){
				//console.log("---------- 2 run here too!");
				//setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout); // 20190913 не понимаю что это было и почему оно тут было!!! - все ок! это должно быть!!!
			//}
		}else{
			if (!tryToChangePoster){
				if (debug)
					console.log('we try to change poster');
				tryToChangePosterF(i,inputs);
			}else{
				if (debug)
					console.log('Seems we are posting by other person, skip it!');
				// 20190413 - NEW, now we can set to post anyway!
				if (do_not_check_who_comments2=='postPageOrCurrent' || do_not_check_who_comments2=='postCurrentProfile'){
					// this is PAGE COMMENT! We can do that!
					if (debug)
						console.log('COMMENT ANY WAY - do it!');
					temp_block_help=false;
					mainCall(i,inputs);
					//20190918 - moved to maincall
					// go to the next if it is not blocked.
					//if (!temp_block_help){
						//console.log("---------- 3 run here too!");
						//setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout); // 20190913 не понимаю что это было и почему оно тут было!!! - все ок! это должно быть!!!
					//}
				}else{
					//i++;
					//itemElaborated=i;
					TimerDelayVar1=setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
				}
			}
		}
	}else{
		if (debug)
			console.log("We cannot check comments, skip them");
		//i++;
		//itemElaborated=i;
		TimerDelayVar1=setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
	}
}
function doICommentAsPage(i,elem){
if (debug){
console.log('--------------------------------');
console.log($(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt"));
console.log("tit="+getCurrentPageTitle());
console.log("check by image of Poster:"+imgSharedCommentPoster);
console.log(getCurrentPageTitle()=="skip");
console.log($(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle2(i, elem));
console.log(getCurrentPageTitle2(i, elem));
console.log('0000000');
}
if (do_not_check_who_comments2=='postCurrentProfile' || ($(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt") && $(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt").length>1 && ($(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle() || getCurrentPageTitle()=="skip" || $(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle2(i, elem)))){
	if (debug)
		console.log('WE CAN COMMENT, lets check if we are in business page');
	if (do_not_check_who_comments2!='postCurrentProfile' && pageNameAdditionalCheck!="" && $(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt").length>1 && ($(elem[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")!=pageNameAdditionalCheck))
		return false;
	else
		return true;
}else if ($(elem[i]).find('button img').length>0 && $(elem[i]).find('button img').attr('src') && $(elem[i]).find('button img').attr('src').length>0 && $(elem[i]).find('div[data-visualcompletion="ignore-dynamic"] image').length>0 && $(elem[i]).find('div[data-visualcompletion="ignore-dynamic"] image').attr('xlink:href') && $(elem[i]).find('div[data-visualcompletion="ignore-dynamic"] image').attr('xlink:href').length>0 && $(elem[i]).find('button img').attr('src').substring(0, $(elem[i]).find('button img').attr('src').indexOf('.jpg')+4).substring($(elem[i]).find('button img').attr('src').substring(0, $(elem[i]).find('button img').attr('src').indexOf('.jpg')+4).lastIndexOf("/") + 1)==$(elem[i]).find('div[data-visualcompletion="ignore-dynamic"] image').attr('xlink:href').substring(0, $(elem[i]).find('div[data-visualcompletion="ignore-dynamic"] image').attr('xlink:href').indexOf('.jpg')+4).substring($(elem[i]).find('div[data-visualcompletion="ignore-dynamic"] image').attr('xlink:href').substring(0, $(elem[i]).find('div[data-visualcompletion="ignore-dynamic"] image').attr('xlink:href').indexOf('.jpg')+4).lastIndexOf("/") + 1)){
	// we compare image of the menu and image of the poster if they are both available
	if (debug)
		console.log("We can comment because the image of the poster is the same 2!");
	return true;
}else{
	// business suite check
	if (do_not_check_who_comments2=='postCurrentProfile' || ($(elem[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').length>0 && $(elem[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text() && $(elem[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text().indexOf(getCurrentPageTitle())>=0 || getCurrentPageTitle()=="skip" || $(elem[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text().indexOf(getCurrentPageTitle2(i, elem))>=0)){
		
	if (pageNameAdditionalCheck!="" && $(elem[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text().length>1 && ($(elem[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text().indexOf(pageNameAdditionalCheck)>=0))
		return false;
	else
		return true;
	
	}else{
		return false;
	}
}
}
function tryToChangePosterF(i,inputs){
	//console.log("HHHHHHHHHHHHHHHH 41");
	// here we try to change a poster just once for each post
	tryToChangePoster=true;
	if ($(inputs[i]).find('._37uu ._3m9g ._40yk a,button.bp9cbjyn,._1dnh a[type="button"]').length==1){
		//console.log("HHHHHHHHHHHHHHHH 42");
		$(inputs[i]).find('._37uu ._3m9g ._40yk a,button.bp9cbjyn,._1dnh a[type="button"]')[0].click();
		TimerDelayVar1=setTimeout(function(){tryToChangePosterF2(i,inputs);},3000);
	}else
		setTimeout(function(){itemElaborate(i,inputs,true);},2000);
}
function tryToChangePosterF2(i,inputs){
	imgSharedCommentPoster="";
	//console.log('TRYINGGGGGGGGGGGGGGGGGGG CHANGE!');
	//console.log("HHHHHHHHHHHHHHHH 43");
	posterFoundToChange=false;
	posterFoundToChange3=getElem('.uiContextualLayerPositioner ._21wq ._2sl4,.uiContextualLayer div[role="menuitemradio"],div[role="menu"] div[role="menuitemradio"]','.uiContextualLayerPositioner.hidden_elem ._21wq ._2sl4');
	if (posterFoundToChange3.length>0){
		//console.log("HHHHHHHHHHHHHHHH 44");
		posterFoundToChange3.each(function( index ) {
			if ((pageNameFixedByUser!="" && pageNameFixedByUser==$( this ).text()) || getCurrentPageTitle()==$( this ).text() || getCurrentPageTitle2(i, inputs)==$( this ).text() || (pageNameAdditionalCheck!="" && pageNameAdditionalCheck==$( this ).text())){
				//console.log("HHHHHHHHHHHHHHHH 442");
				if (debug){
					console.log('found the right one, click on it!');
					console.log( index + ": " + $( this ).text() );
				}
					
				if ($( this ).find("img").length>0 && $( this ).find("img").attr('src') && $( this ).find("img").attr('src').length>0){
					imgSharedCommentPoster=$( this ).find("img").attr('src');
					// remove everything after .img
					imgSharedCommentPoster = imgSharedCommentPoster.substring(0, imgSharedCommentPoster.indexOf('.jpg')+4);
					// find the last / and remove everything before
					imgSharedCommentPoster = imgSharedCommentPoster.substring(imgSharedCommentPoster.lastIndexOf("/") + 1);
					if (debug)
						console.log("Save image2:"+imgSharedCommentPoster);
				}
				
				posterFoundToChange=true;
				if (posterFoundToChange3[index])
					posterFoundToChange3[index].click();
				return false;
			}
		});
	}
	if (!posterFoundToChange){
		//console.log("HHHHHHHHHHHHHHHH 45");
		// we were not able to change the poster, let's scan now each business tab
		posterFoundToChange2=getElem('.uiContextualLayerPositioner ._21wq ._5ghu ._5ghv','.uiContextualLayerPositioner.hidden_elem ._21wq ._5ghu ._5ghv');
		if (posterFoundToChange2.length>0){
			//console.log("We found some business pages and now we will search better");
			posterToBusinessPageChange(0,posterFoundToChange2,i,inputs,getCurrentPageTitle(),getCurrentPageTitle2(i, inputs));
		}else{
			// close this frame
			if (posterFoundToChange3.length>0)
				posterFoundToChange3[0].click();
			setTimeout(function(){itemElaborate(i,inputs,true);},2000);
		}
	}else{
		// close this frame
		//console.log("HHHHHHHHHHHHHHHH 49");
		//if (posterFoundToChange3.length>0)
		//	posterFoundToChange3[0].click();
		setTimeout(function(){itemElaborate(i,inputs,true);},2000);
	}
}
function posterToBusinessPageChange(_num,p_el,i,inputs,_name1,_name2){
	imgSharedCommentPoster="";
	p_el[_num].click();
	// через 200 мс проверяем
	setTimeout(function(){	
		posterFoundToChange=false;
		if (getElem('.uiContextualLayerPositioner ._21wq ._2sl4,.uiContextualLayer div[role="menuitemradio"],div[role="menu"] div[role="menuitemradio"]','.uiContextualLayerPositioner.hidden_elem ._21wq ._2sl4').length>0){
			getElem('.uiContextualLayerPositioner ._21wq ._2sl4,.uiContextualLayer div[role="menuitemradio"],div[role="menu"] div[role="menuitemradio"]','.uiContextualLayerPositioner.hidden_elem ._21wq ._2sl4').each(function( index ) {
				if ((pageNameFixedByUser!="" && pageNameFixedByUser==$( this ).text()) || _name1==$( this ).text() || _name2==$( this ).text()){
					if (debug){
						console.log('found the right one, click on it!');
						console.log( index + ": " + $( this ).text() );
					}
					
					if ($( this ).find("img").length>0 && $( this ).find("img").attr('src') && $( this ).find("img").attr('src').length>0){
						imgSharedCommentPoster=$( this ).find("img").attr('src');
						// remove everything after .img
						imgSharedCommentPoster = imgSharedCommentPoster.substring(0, imgSharedCommentPoster.indexOf('.jpg')+4);
						// find the last / and remove everything before
						imgSharedCommentPoster = imgSharedCommentPoster.substring(imgSharedCommentPoster.lastIndexOf("/") + 1);
						if (debug)
							console.log("Save image2:"+imgSharedCommentPoster);
					}
					
					posterFoundToChange=true;
					getElem('.uiContextualLayerPositioner ._21wq ._2sl4,.uiContextualLayer div[role="menuitemradio"],div[role="menu"] div[role="menuitemradio"]','.uiContextualLayerPositioner.hidden_elem ._21wq ._2sl4')[index].click();
					return false;
				}
			});
		}
		if (!posterFoundToChange && p_el.length>_num+1){
			//console.log('go back and after some sec scan again');
			if (getElem('.uiContextualLayerPositioner ._21wq ._8g0 ._2gxl ._2gxn>i','.uiContextualLayerPositioner.hidden_elem ._21wq ._8g0 ._2gxl ._2gxn>i').length>0)
				getElem('.uiContextualLayerPositioner ._21wq ._8g0 ._2gxl ._2gxn>i','.uiContextualLayerPositioner.hidden_elem ._21wq ._8g0 ._2gxl ._2gxn>i')[0].click();
			setTimeout(function(){posterToBusinessPageChange(_num+1,p_el,i,inputs,_name1,_name2);},500);
		}else
			setTimeout(function(){itemElaborate(i,inputs,true);},2000);
	},500);
}
function getIdFromThisLink(url){
var returnVal="";
if (url && url.length>0){
	// get ID from this URL
	// check if this url has ID - href="https://www.facebook.com/profile.php?id=100002233160512&fref=ufi&rc=p"
	if (url.indexOf('?id=')>0){
		returnVal=url.substring(url.indexOf('?id=')+4);
		if (returnVal.indexOf('&')>0)
			returnVal=returnVal.substring(0,returnVal.indexOf('&'));
	// href="https://www.facebook.com/incinqueterre/?rc=p"
	}else if (url.indexOf('facebook.com/')>0){
		returnVal=url.substring(url.indexOf('facebook.com/')+13);
		if (returnVal.indexOf('/')>0)
			returnVal=returnVal.substring(0,returnVal.indexOf('/'));
		if (returnVal.indexOf('?')>0)
			returnVal=returnVal.substring(0,returnVal.indexOf('?'));
	}
	return returnVal;
}else
	return returnVal;
}
function tryToLikeOnlyNoCommentAvailable(i,inputs){
//20190608 - now we check it here!!
if (doICommentAsPage(i,inputs) || tryToChangePoster){
	// now like it
	//setTimeout(function(){
		if (scriptIsRunning==1){
		localtimeout=10;
		if (share_put_likes && (total_shared_posts_liked+c_c2)<share_likes_limit && $(inputs[i]).find('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi .e71nayrh._18vj .bdca9zbp,._1dnh a[aria-label="'+getTextForCurrentLanguage('likeButton')+'"],._18vi a._6a-y,.ozuftl9m div[aria-label="'+getTextForCurrentLanguage('likeButton')+'"]').not('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILinkBright, ._55ij .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink, ._4-u2.aero .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi a._3_16').length>0){
			
			// 20190913 fix, do not like if this is MY share!
			if (($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv').length==0 || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text==getCurrentPageTitle() || (   (shares_reply_ignore_array.length>0 && arrayInStringFound(shares_reply_ignore_array,$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text))   ) ))){
				// 20190918 - fix for shares invites! we call it later here!
				//setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
			}else{
			
				$(inputs[i]).find('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi .e71nayrh._18vj .bdca9zbp,._1dnh a[aria-label="'+getTextForCurrentLanguage('likeButton')+'"],._18vi a._6a-y,.ozuftl9m div[aria-label="'+getTextForCurrentLanguage('likeButton')+'"]').not('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILinkBright, ._55ij .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink, ._4-u2.aero .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi a._3_16')[0].click();
				if (debug)
					console.log('liked');
				total_shared_posts_liked++;
				loadsWithNoWorkOnShares=0;
				
				if ((total_shared_posts_liked+total_shared_posts_commented) % 40 === 0 && additional_script_pause){
					timeout=30000;
				}
				
				updatePopup(addText);
				updatePopup();
				localtimeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
			}
		}
		
		// 20190608 - now we check also INVITES!
		setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
		// go to the next one
		//i++;
		//itemElaborated=i;
		//setTimeout(function(){itemElaborate(i,inputs);},localtimeout);
		}
	//},5000);
}else{
	if (!tryToChangePoster){
		if (debug)
			console.log('we try to change poster for likes');
		tryToChangePosterF(i,inputs);
	}
}
}
function mainCall(i,inputs){
// будем делать через это??
temp_block_help=false;
// likes
//console.log("VVVVVVVVVVV = LIKES 1");
if (share_put_likes && (total_shared_posts_liked+c_c2)<share_likes_limit && $(inputs[i]).find('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi .e71nayrh._18vj .bdca9zbp,._1dnh a[aria-label="'+getTextForCurrentLanguage('likeButton')+'"],._18vi a._6a-y,.ozuftl9m div[aria-label="'+getTextForCurrentLanguage('likeButton')+'"]').not('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILinkBright, ._55ij .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink, ._4-u2.aero .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi a._3_16').length>0){
	//console.log("VVVVVVVVVVV = LIKES 2");
	// 20190913 fix, do not like if this is MY share!
	localtimeout=10;
	if (($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv').length==0 || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text==getCurrentPageTitle() || (   (shares_reply_ignore_array.length>0 && arrayInStringFound(shares_reply_ignore_array,$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text))   ) ))){
		//console.log("---------- 1 check invites here");
		//20190918 - remove from here, count at the end everything!!!
		//temp_block_help=true;
		//console.log("VVVVVVVVVVV = LIKES 3");
		//console.log("--------3  checkInvitesOnShares");
		//setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
	}else{
		//console.log("VVVVVVVVVVV = LIKES 4");
		// like current post
		// ыы
		//console.log('try click on ' +i);
		$(inputs[i]).find('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi .e71nayrh._18vj .bdca9zbp,._1dnh a[aria-label="'+getTextForCurrentLanguage('likeButton')+'"],._18vi a._6a-y,.ozuftl9m div[aria-label="'+getTextForCurrentLanguage('likeButton')+'"]').not('.commentable_item ._37uu ._42nr ._1mto ._khz .UFILinkBright, ._55ij .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink, ._4-u2.aero .commentable_item ._37uu ._42nr ._1mto ._khz .UFILikeLink,._18vi a._3_16')[0].click();
		//console.log('liked');
		total_shared_posts_liked++;
		loadsWithNoWorkOnShares=0;
				if ((total_shared_posts_liked+total_shared_posts_commented) % 40 === 0 && additional_script_pause){
					timeout=30000;
				}
		updatePopup();
		localtimeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
	}
}
//console.log("VVVVVVVVVVV = LIKES 5");
// comments
if (share_put_comments && text_comm_shares.length>1 && (total_shared_posts_commented+c_c3)<share_comments_limit){
	
	
	// delay 1.1 sec before clicking on COMMENTS button
	TimerDelayVar1=setTimeout(function(){
		
		var commentLink = $(inputs[i]).find('._37uu .comment_link,._18vi ._666h');
		
		//20201227 - search by button name for Business Suite
		if (commentLink.length==0 && $(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]')){
			commentLink=$(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]');
		}
		
		if (commentLink.length>0){
			if (debug)
				console.log("we click on comment button:"+commentLink.length);
			commentLink[0].click();
		}else{
			console.log('ERROR: Comment button not found 2');
			
			// 20201105 - test, additional pause if comment button not found
			temp_block_help=true; // to not run the next function
			TimerDelayVar2=setTimeout(function(){commentButtonSecondCheck(i,inputs);},5000);
		}
		

		// run the script after delay
		if (commentLink.length>0){
			temp_block_help=true;
			TimerDelayVar2=setTimeout(function(){commentToThisElement1(i,inputs);},localtimeout+800);
		}else if (!temp_block_help){
			TimerDelayVar2=setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
		}
	},localtimeout);
	
	
}else if (!temp_block_help){
	TimerDelayVar1=setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
}
}

function commentButtonSecondCheck(i,inputs){
temp_block_help=false;
// second check:
var commentLink = $(inputs[i]).find('._37uu .comment_link,._18vi ._666h');

//20201227 - search by button name for Business Suite
if (commentLink.length==0 && $(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]')){
	commentLink=$(inputs[i]).find('div[aria-label="'+getTextForCurrentLanguage('leaveAComment')+'"]');
}

if (commentLink.length>0){
	if (debug)
		console.log("we click on comment button on SECOND CHECK:"+commentLink.length);
	commentLink[0].click();
}else{
	console.log('ERROR: Comment button not found 2 (SECOND CHECK)');
}


// run the script after delay
if (commentLink.length>0){
	temp_block_help=true;
	TimerDelayVar2=setTimeout(function(){commentToThisElement1(i,inputs);},localtimeout+800);
}else if (!temp_block_help){
	TimerDelayVar2=setTimeout(function(){checkInvitesOnShares(i,inputs);},localtimeout);
}
}



function commentToThisElement1(i,inputs){
if (scriptIsRunning==1){
// check if there is 'show more comments' and click on it to load more comments
var showMoreBtn = $(inputs[i]).find('.UFIContainer ._3b-9 .UFIPagerRow._4oep .UFIPagerLink');
if (showMoreBtn.length>0) {
	if (debug)
		console.log('click on show more comments');
	showMoreBtn.click();
	setTimeout(function(){commentToThisElement2(i,inputs);},1000);
}else{
	commentToThisElement2(i,inputs);
}
}
}

var verifyLinkOfCurPageR="";
function verifyLinkOfCurPage(elem){
	if ($(elem)[0].getAttribute("href") && $(elem)[0].getAttribute("href").length>0){
		verifyLinkOfCurPageR=$(elem)[0].getAttribute("href");
		if (verifyLinkOfCurPageR.indexOf('?')>0)
			verifyLinkOfCurPageR=verifyLinkOfCurPageR.substring(0, verifyLinkOfCurPageR.indexOf('?'));
		if (window.location.href.indexOf(verifyLinkOfCurPageR)!=-1)
			return true;
	}
	return false;
}
	
function getCurrentPageTitle(){
	var returnValue="";
	//if (debug)
		//console.log("pageNameAdditionalCheck="+pageNameAdditionalCheck);
	// проверяем если это арабский или еврейский и скип тогда
	if (document.documentElement.lang=="ar" || document.documentElement.lang=="he")
		returnValue="skip";
	else if (pageNameOfThisPost && pageNameOfThisPost.length>0)
		returnValue=pageNameOfThisPost;
	else{
		// со страниц posts, photos пробуем взять с главного
		if ((window.location.href.indexOf("/posts/")>0 || window.location.href.indexOf("/photos/")>0) && getElem('a.profileLink,.fcg .fwb a').filter(function () {return (verifyLinkOfCurPage($(this))==true)}).length>0){
			returnValue=getElem('a.profileLink,.fcg .fwb a').filter(function () {return (verifyLinkOfCurPage($(this))==true)}).first().text();
		}
		// 20200501 - for home tab we get the name of the facebook:
		if (getElem('.fb_content ._64-f>span').length==1)
			returnValue=getElem('.fb_content ._64-f>span').text();
		// 20200501 - also if we open shared posts in creator studio, we need to get the correct name of the page:
		if (window.location.href.indexOf("/creatorstudio")>0 && getElem('._5ki2 ._4-u2._4mrt._5jmm,div[role="dialog"] .buofh1pr>.sjgh65i0','#pagelet_timeline_main_column ._4-u2._4mrt._5jmm,.hidden_elem ._4-u2._4mrt._5jmm').length>0 && getElem('a.profileLink,.fcg .fwb a').length>0)
			returnValue=getElem('a.profileLink,.fcg .fwb a').first().text();
		
		
		// проверяем если мы на странице в бизнес менеджере то пытаемся получить название страницы иным способом
		if ((window.location.href.indexOf("/creatorstudio")>0 || window.location.href.indexOf("/watch/")>0 || window.location.href.indexOf("/videos/")>0) && pageNameAdditionalCheck!="")
			returnValue=pageNameAdditionalCheck;
		else if (window.location.href.indexOf("/videos/")>0 && getElem('._437j ._6dic a._371y').length>0) // 20190419 - fix for such pages: https://www.facebook.com/incinqueterre/videos/2464891573650133/?v=2464891573650133
			returnValue=getElem('._437j ._6dic a._371y').first().text();
		else if ((window.location.href.indexOf("facebook.com/ads/")>0 || window.location.href.indexOf("facebook.com/adsmanager/")>0 || window.location.href.indexOf("/content_management")>0 || document.location.href.indexOf("/latest/posts") > 0)){
			if (getElem('._34_k ._44f_').length==1)
				returnValue=getElem('._34_k ._44f_').text();
			else if (getElem('._5u5j .fcg .fwb a','._1nvm ._5u5j .fcg .fwb a').length>0)
				returnValue=getElem('._5u5j .fcg .fwb a','._1nvm ._5u5j .fcg .fwb a').text();
			//else if (getElem('.pytsy3co .lq84ybu9 .mfclru0v._2fyi img').length>0 && getElem('.pytsy3co .lq84ybu9 .mfclru0v._2fyi img').attr('alt')) // 20201227 - wrong, can take personal profile!
			//	returnValue=getElem('.pytsy3co .lq84ybu9 .mfclru0v._2fyi img').attr('alt');
			else if (getElem('.mrwmy8nb .tds9wb2m div[role="combobox"] .rwb8dzxj .yukb02kx,#mediaManagerPagesSelector .qku1pbnj').length>0)
				returnValue=getElem('.mrwmy8nb .tds9wb2m div[role="combobox"] .rwb8dzxj .yukb02kx,#mediaManagerPagesSelector .qku1pbnj').last().text();
			else if (getElem('div[data-pagelet="BizKitLocalScopeSelector"] .yukb02kx .rwb8dzxj .a53abz89>.qku1pbnj').length>0 && document.location.href.indexOf("/latest/posts") > 0)
				returnValue=getElem('div[data-pagelet="BizKitLocalScopeSelector"] .yukb02kx .rwb8dzxj .a53abz89>.qku1pbnj').first().text();
			else if (getElem('div[role="article"] .buofh1pr .nc684nl6').length>0){
				returnValue=getElem('div[role="article"] .buofh1pr .nc684nl6').first().text();
			}else
				returnValue="skip";
		}else if (window.location.href.indexOf("/photos/")>0 && getElem('.fbPhotoContributorName ._hli').length>0){ //20190114 fix
			returnValue=getElem('.fbPhotoContributorName ._hli').text();
		}else if (getElem('.fbPhotoContributorName a._hli').length>0){
			returnValue=getElem('.fbPhotoContributorName a._hli').text();
		}else if (returnValue==""){
			if (document.getElementsByTagName("title")[0].innerHTML.substring(0,1)=="("){
				returnValue=document.getElementsByTagName("title")[0].innerHTML.substring(document.getElementsByTagName("title")[0].innerHTML.indexOf(' ')+1);
			}else
				returnValue=document.getElementsByTagName("title")[0].innerHTML;
			returnValue=returnValue.replace(' | Facebook','');
		}
		if (document.location.href.indexOf('/events/') > 0 && getElem('._5gnb ._b9- a').length>0){
			returnValue=getElem('._5gnb ._b9- a').text();
		}
		//20190212
		if (pageNameAdditionalCheck!="" && returnValue=="")
			returnValue=pageNameAdditionalCheck;
	}
	returnValue=returnValue.replace("‬","");
	returnValue=returnValue.replace("‫","");
	
	returnValue=returnValue.replace(' | Facebook','');
	
	returnValue=returnValue.replace(' - Posts','');
	
	if (returnValue.indexOf('&')>-1){
		var parser = new DOMParser;
		var dom = parser.parseFromString(returnValue,'text/html');
		returnValue = dom.body.textContent;
	}
		
	//if (debug)
	if (!oneReportOnly){
		oneReportOnly=true;
		console.log('Page Name='+returnValue);
	}
	return returnValue;
}
function getCurrentPageTitle2(i,inputs){
	if ($(inputs[i]).find('.fcg>a.profileLink,h3 .nc684nl6 a').length>0)
		return $(inputs[i]).find('.fcg>a.profileLink,h3 .nc684nl6 a')[0].text;
	else
		return '-';
}
function getCurrentPage(){
	var curpage=window.location.href.replace("/pg/","/");
	var returnValue="";
	if (curpage.indexOf("facebook.com/")>-1)
		if (curpage.indexOf("/",curpage.indexOf("facebook.com/")+13)>0)
			returnValue=curpage.substring(curpage.indexOf("facebook.com/")+13,curpage.indexOf("/",curpage.indexOf("facebook.com/")+13));
		if (returnValue.length>0){
			if (curpage.indexOf("/business.",curpage)>0)
				returnValue="https://business.facebook.com/"+returnValue+"/";
			else
				returnValue="https://www.facebook.com/"+returnValue+"/";
		}
	else
		returnValue="";
	return returnValue;
}
function arrayInStringFound(arr,str){
if (typeof str !== "undefined"){
	if (arr.some(function(v) { return str.toLowerCase().indexOf(v.toString().toLowerCase()) >= 0; })) {
		return true;
	}else
		return false;
}else{
	// if we didn't find name, let's say FALSE
	return false;
}
}
function getSharedPostAuthorName(elem){
	var returnValue="";
	// check if we have author name
	if ($(elem).find('._5u5j .fcg .fwb a.profileLink').not('._5u5j .fcg .fwb>a._wpv').length>0)
		returnValue=$(elem).find('._5u5j .fcg .fwb a.profileLink').not('._5u5j .fcg .fwb>a._wpv')[0].text;
	else if ($(elem).find('._5u5j .fcg .fwb>a').not('._5u5j .fcg .fwb>a._wpv').length>0)
		returnValue=$(elem).find('._5u5j .fcg .fwb>a').not('._5u5j .fcg .fwb>a._wpv')[0].text;
//console.log("author:"+returnValue);
return returnValue;
}
function checkWeAlreadyCommentNewFb(i,inputs){
	if ($(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').length>0 && $(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text() && $(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text().length>1 && ($(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text()==getCurrentPageTitle() || getCurrentPageTitle()=="skip" || $(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text()==getCurrentPageTitle2(i, inputs)) && !arrayInStringFound(do_not_check_shared_my_name_s_Array,$(inputs[i]).find('._1p1t ._1p1v,div[data-visualcompletion="ignore"] .l9j0dhe7 .m9osqain').text()))
		return true;
	
	if ($(inputs[i]).find('a[role="link"] .d2edcug0').length>0 && $(inputs[i]).find('a[role="link"] .d2edcug0').text() && ($(inputs[i]).find('a[role="link"] .d2edcug0').text().indexOf(getCurrentPageTitle())>=0 || $(inputs[i]).find('a[role="link"] .d2edcug0').text().indexOf(getCurrentPageTitle2(i, inputs))>=0))
		return true;
	
	return false;
}
function weDoNotSpamWithTheSameAccount(i,inputs){
//20210131 - fix bug from getiptvromania@gmail.com
if (postMoreUnderSameAccount)
	return true;
else{
	if ($(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').length>0 && $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt") && $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt").length>1){
		// есть юзер, мы знаем его имя! Проверяем теперь нет ли его комментов больше
		if ($(inputs[i]).find('li a._6qw4:contains("'+$(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")+'")').length==0){
			//console.log("WE DONT have THIS COMMENT");
			return true;
		}else{
			//console.log("WE HAVE THIS COMMENT already");
			return false;
		}
	}else if ($(inputs[i]).find('image').not('a image').length>0 && $(inputs[i]).find('image').not('a image').attr("xlink:href") && $(inputs[i]).find('image').not('a image').attr("xlink:href").length>0){
		// HERE we can check also Business Suite!!! HOW? THere is an IMAGE not a and then check the same image which HAS a!
		// we have our image, now search inside other images if we have one with the same attribute value
		var __return=true;
		if ($(inputs[i]).find('.cwj9ozl2 a image').length>0 && $(inputs[i]).find('.cwj9ozl2 a image').attr("xlink:href") && $(inputs[i]).find('.cwj9ozl2 a image').attr("xlink:href").length>0){
			// for each element get attribute and compare it
			$(inputs[i]).find('.cwj9ozl2 a image').each(function( index ) {
				if ($( this ) && $( this ).attr("xlink:href") && $( this ).attr("xlink:href").length>0 && $( this ).attr("xlink:href")==$(inputs[i]).find('image').not('a image').attr("xlink:href")){
					//console.log("WE HAVE IT!");
					__return=false;
				}
			});
		}
		return __return;
	}else
		return true;
}
}
function commentToThisElement2(i,inputs){
//console.log("QQQQQQ 1:"+checkWeAlreadyCommentNewFb(i,inputs));
if (scriptIsRunning==1){
	//проверяем есть ли уже коммент с нашим линком - getCurrentPage()
	//console.log('MY TEST'+$(inputs[i]).find('.UFIRow.UFIComment .UFICommentAuthorWithPresence:has(img[alt="'+$(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")+'"])').length);
	if ($(inputs[i]).find('.UFIContainer a[href*="'+getCurrentPage()+'"]').length==0 && weDoNotSpamWithTheSameAccount(i,inputs) && $(inputs[i]).find('.UFIContainer ._3b-9._j6a a.UFICommentActorName:contains("'+getCurrentPageTitle()+'"),a._6qw4:contains("'+getCurrentPageTitle()+'")').length==0 && $(inputs[i]).find('.UFIContainer ._3b-9._j6a a.UFICommentActorName:contains("'+getCurrentPageTitle2(i, inputs)+'"),a._6qw4:contains("'+getCurrentPageTitle2(i, inputs)+'")').length==0 && (window.location.href.indexOf("facebook.com/ads/")==-1 || ((window.location.href.indexOf("facebook.com/ads/")>0 || window.location.href.indexOf("facebook.com/adsmanager/")>0 || window.location.href.indexOf("/content_management")>0 || document.location.href.indexOf("/latest/posts") > 0) && $(inputs[i]).find('.uiHelpLink').length==0)) &&									 (!checkWeAlreadyCommentNewFb(i,inputs) || ($(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').length>0  && 			(do_not_check_who_comments2=='postCurrentProfile' || do_not_check_who_comments2=='postPageOrCurrent' || ($(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt") && $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt").length>1 && ($(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle() || getCurrentPageTitle()=="skip" || $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")==getCurrentPageTitle2(i, inputs)))) && $(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt").length>1 && $(inputs[i]).find('.UFIRow.UFIComment .UFICommentAuthorWithPresence:has(img[alt="'+$(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")+'"])').length==0 && !arrayInStringFound(do_not_check_shared_my_name_s_Array,$(inputs[i]).find('.UFIAddComment .UFIMentionsInputWrap .UFIReplyActorPhotoWrapper img,._3w53 img._3me-').not('a img._3me-').attr("alt")))) && !checkWeAlreadyCommentNewFb(i,inputs)){
		//console.log("QQQQQQ 2");
		if (debug){
			console.log("our comment not found, check if we cannot comment why:");
			if (!($(inputs[i]).find('.UFIAddCommentInput ._1mf,div[role="textbox"] ._1mf,.l9j0dhe7 div[role="textbox"] .hcukyx3x').length>0 && (shares_reply_ignore_array.length==0 || getSharedPostAuthorName($(inputs[i])).length==0 || (shares_reply_ignore_array.length>0 && !arrayInStringFound(shares_reply_ignore_array,getSharedPostAuthorName($(inputs[i]))))) && (getSharedPostAuthorName($(inputs[i])).length==0 || $(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text!=getCurrentPageTitle())              &&           (shares_list_delete_days==0 || (!$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] && getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href'))=="") || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] && obj["msgListSentID"].hasOwnProperty(getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href')))==false))))){
				console.log($(inputs[i]).find('.UFIAddCommentInput ._1mf,div[role="textbox"] ._1mf,.l9j0dhe7 div[role="textbox"] .hcukyx3x').length);
				console.log(shares_reply_ignore_array.length);
				console.log($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text);
				console.log(getCurrentPageTitle());
				console.log($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0]);
				console.log(obj["msgListSentID"].hasOwnProperty(getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href'))));
				console.log('======================!!');
			}
		}
		// коммента еще не было, можно постить! НО ПРОВЕРЯЕМ ЧТО В СПИСКЕ НИКОГО НЕТ! + проверка что мы ему еще не комментили!!!!!!! msgListSentID
		if ($(inputs[i]).find('.UFIAddCommentInput ._1mf,div[role="textbox"] ._1mf,.l9j0dhe7 div[role="textbox"] .hcukyx3x').length>0 && (shares_reply_ignore_array.length==0 || getSharedPostAuthorName($(inputs[i])).length==0 || (shares_reply_ignore_array.length>0 && !arrayInStringFound(shares_reply_ignore_array,getSharedPostAuthorName($(inputs[i]))))) && (getSharedPostAuthorName($(inputs[i])).length==0 || $(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text!=getCurrentPageTitle())              &&           (shares_list_delete_days==0 || (!$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] && getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href'))=="") || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] && obj["msgListSentID"].hasOwnProperty(getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href')))==false)))){
			//console.log("QQQQQQ 3");
			$(inputs[i]).find('.UFIAddCommentInput ._1mf,div[role="textbox"] ._1mf,.l9j0dhe7 div[role="textbox"] .hcukyx3x')[0].click();
			//if ($(inputs[i]).find('.UFIAddCommentInput ._1mf,div[role="textbox"] ._1mf>span').lengh>0)
			//	$(inputs[i]).find('.UFIAddCommentInput ._1mf,div[role="textbox"] ._1mf>span')[0].click();
		
			// TEST
			//$(inputs[i]).find('._1p1t').remove();
			
		
			setTimeout(function(){
				// 20200926 - test, click on the text field to activate it
				//if ($(inputs[i]).next() && $(inputs[i]).next().find('div[role="textbox"] ._1mf span').length>0){
					//console.log("CLICK ontext field");
				//	$(inputs[i]).next().find('div[role="textbox"] ._1mf span')[0].click();
				//	_tempVarT=1200;
				//}
			},200);
			setTimeout(function(){
				//console.log("QQQQQQ 4");
				// отправляем текст
				temp_text = getCommSharesRandomText();
					
				// вставляем имя человека если нужно
				if (temp_text.search("%name")>=0 && $(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv').length>0)
					temp_text = addUserNameToComment(temp_text,$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text,$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv').attr('data-hovercard'));
				else if (temp_text.search("%name")>=0 && $(inputs[i]).find('._5u5j .fcg .fwb a').length==1)
					temp_text = addUserNameToComment(temp_text,$(inputs[i]).find('._5u5j .fcg .fwb a')[0].text,$(inputs[i]).find('._5u5j .fcg .fwb a').attr('data-hovercard'));
				else if (temp_text.search("%name")>=0)
					temp_text = addUserNameToComment(temp_text,"","");
				
				if (temp_text.length>0){
					
					var verifyDouble=true;
					if ($(inputs[i]).find('.UFIAddCommentInput ._1mf span,div[role="textbox"] ._1mf span').length==0 && $(inputs[i]).find('.l9j0dhe7 div[role="textbox"] .hcukyx3x').length>0)
						verifyDouble=false;
					
					try {
						$(inputs[i]).find('.UFIAddCommentInput ._1mf span,div[role="textbox"] ._1mf span,.l9j0dhe7 div[role="textbox"] .hcukyx3x span').last().sendkeys(temp_text);
					}
					catch(err) {
						console.log("Error during posting a comment:"+err);
					}
					
					//console.log(temp_text);
					if (debug)
						console.log('ПЕРЕД ОТПРАВКОЙ СКОЛЬКО СПАНОВ:' + $(inputs[i]).find('.UFIAddCommentInput ._1mf span,div[role="textbox"] ._1mf span,.l9j0dhe7 div[role="textbox"] .hcukyx3x').length);
					if (debug)
						console.log('submit');
					//записываем фразу в наш див, который был создан выше.
					// ту ду ЗАПИСЬ В ДИВ ТУТ
					elementUpdCommentText.innerHTML=temp_text;
					
					//очищаем двойную фразу
					if (verifyDouble){
						setTimeout(function(){
							temp_current_com_text=$(inputs[i]).find('.UFIAddCommentInput ._1mf span,div[role="textbox"] ._1mf span,.l9j0dhe7 div[role="textbox"] .hcukyx3x').first().html();
							if (typeof temp_current_com_text !== 'undefined'){
								temp_current_com_text=temp_current_com_text.substring(temp_current_com_text.indexOf("<span"));
								$(inputs[i]).find('.UFIAddCommentInput ._1mf span,div[role="textbox"] ._1mf span,.l9j0dhe7 div[role="textbox"] .hcukyx3x').first().replaceWith(temp_current_com_text);

								// добавляем аттрибут
								$(inputs[i]).find('.UFIAddCommentInput ._1mf span,div[role="textbox"] ._1mf span,.l9j0dhe7 div[role="textbox"] .hcukyx3x').last().attr('data-comment-sender', 'true');
							}
						},200);
					}else{
						// добавляем аттрибут
						$(inputs[i]).find('.UFIAddCommentInput ._1mf span,div[role="textbox"] ._1mf span,.l9j0dhe7 div[role="textbox"] .hcukyx3x span').last().attr('data-comment-sender', 'true');
					}
					
					TimerDelayVar1=setTimeout(function(){
						if (scriptIsRunning==1){
							// THERE IS A PROBLEM WITH COMMENT
							if (getElem('[data-comment-sender="true"]').length==0){
								refreshSharedPosts(i,inputs);
							}else{
								
								//everything is ok, let's comment
								if (debug)
									console.log("ЫЫТЕСТ TEST write comment here");
								
								script1 = document.createElement('script');
								script1.setAttribute('src', api.runtime.getURL('postTextNow.js'));
								(document.head||document.documentElement).appendChild(script1);
								script1.parentNode.removeChild(script1);
								
								// after 2.5 sec check if the comment is ok!
								TimerDelayVar1=setTimeout(function(){checkCommentWasSent(i,inputs,true);},2500);
							}
						}
					},1300);
				}else{
					//go to next post
					//i++;
					//itemElaborated=i;
					setTimeout(function(){checkInvitesOnShares(i,inputs);},500);
				}
			},600);
		}else{
			// 20200629 - add a message that we don't comment due to antispam
			if ($(inputs[i]).find('.UFIAddCommentInput ._1mf,div[role="textbox"] ._1mf,.l9j0dhe7 div[role="textbox"] .hcukyx3x').length>0 && (shares_reply_ignore_array.length==0 || getSharedPostAuthorName($(inputs[i])).length==0 || (shares_reply_ignore_array.length>0 && !arrayInStringFound(shares_reply_ignore_array,getSharedPostAuthorName($(inputs[i]))))) && (getSharedPostAuthorName($(inputs[i])).length==0 || $(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].text!=getCurrentPageTitle())              &&           (shares_list_delete_days==0 || (!$(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] && getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href'))=="") || ($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] && obj["msgListSentID"].hasOwnProperty(getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href')))==true)))){
				antiSpamCommentSkipped++;
				updatePopup();
			}
			//go to next post
			//i++;
			//itemElaborated=i;
			setTimeout(function(){checkInvitesOnShares(i,inputs);},500);
		}
	}else{
		//go to next post
		if (debug)
			console.log("comment found OR we are commenting as different person, go to next element");
		//i++;
		//itemElaborated=i;
		setTimeout(function(){checkInvitesOnShares(i,inputs);},10);
	}
}
}
function checkCommentWasSent(i,inputs,checkTwice){
if (scriptIsRunning==1){
	// now we check if comment was posted:
	// 20180531 - FOR SOME REASON THERE IS A PROBLEM WITH CHECKING THE COMMENT SO WE DISABLE THIS PART!!
	//if (document.querySelectorAll('[data-comment-sender="true"]').length>0){
	//	// comment was not posted.
	//	if (checkTwice)
	//		setTimeout(function(){checkCommentWasSent(i,inputs,false);},4500);
	//	else
	//		refreshSharedPosts(i,inputs);
	//}else{
		// only if comment was posted
		if (debug)
			console.log("Comment was posted correctly.");
		total_shared_posts_commented++;
		loadsWithNoWorkOnShares=0;
		updatePopup();
		fixedStartOfI=0;
		fixedMaxTries=0;
		
		// save user to the list
		if (shares_list_delete_days>0 && $(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0] && getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href'))!=""){
			// save
			obj["msgListSentID"][getIdFromThisLink($(inputs[i]).find('._5u5j .fcg .fwb a.profileLink,._5u5j .fcg .fwb>a,h3 .nc684nl6 a').not('._5u5j .fcg .fwb>a._wpv')[0].getAttribute('href'))] = parseInt(Math.floor(Date.now() / 1000));
			api.storage.local.set(obj);
		}

		//go to next post
		//i++;
		//itemElaborated=i;
		TimerDelayVar1=setTimeout(function(){checkInvitesOnShares(i,inputs);},getTimeoutComments());
	//}
}
}
function refreshSharedPosts(i,inputs){
// we need to change the div with a correct div and then to post it
if (debug)
	console.log('not found, I fix it');
//console.log('Let it start again from the beginning!!');

console.log("There was an error, we were not able to send the comment, so we try again and reload all comments for this post.");
// TESTTTTTT!
// IF we cannot post, change the order again, so it is refreshed
// and then start again starting from the same i!
// Do not try more than 5 times in a row without posting a good comment (when the comment is posted we reset this)
// if after 5 tries it is not fixed - we stop the script and show the real problem!
//console.log('STOP SCRIPT HERE, add text!!!');
if (fixedMaxTries==5){
	// we were not able to post a comment, go to the next post
	console.log("ERROR! We were not able to post a comment, let's go to the next post.");
	setTimeout(function(){ClosePostAndOpenNext(-1)},500);
}else{
	// try to fix this
	setTimeout(function(){
		if (getElem('.uiToggle._4962._4xi2._5orm>a').length>0)
			getElem('.uiToggle._4962._4xi2._5orm>a')[0].click();
	},10);
	setTimeout(function(){
		if (getElem('.uiToggle._4962._4xi2._5orm>a').length>0)
			getElem('.uiToggle._4962._4xi2._5orm>a')[0].click();
	},1000);
	TimerDelayVar1=setTimeout(function(){
		if (scriptIsRunning==1){
			//$(iElem[iNr]).find('.UFICommentActions a.UFIReplyLink')[0].click();
			
			// close only shared posts window
			itemElement4=getElem('._ohf>a.layerCancel');
			if (itemElement4.length>0){
				itemElement4[itemElement4.length-1].click();
				fixedStartOfI=i;
				fixedMaxTries++;
				setTimeout(function(){doSHAREDposts()},1500);
			}else{
				// we were not able to close this shares, so just continue as it was before.
				//go to next post
				i++;
				itemElaborated=i;
				setTimeout(function(){itemElaborate(i,inputs);},500);
			}
		}
	},2000);
}
}
// 20190114 переменная для скроллинга! Потому что иногда оно само подгружается и поэтому шаред посты некоторые не срабатывают - ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ
function itemsLoadMore(tryL,maxL){
if (scriptIsRunning==1){
	//console.log('load more, docHeight:' + docHeight + ". sharedMaxScroll=" + sharedMaxScroll + ". sharedPostsHeight=" + sharedPostsHeight);
    //docHeight=$(document).height();
	// если фаст скан на 3 то мы хотим 9 скроллов, если 0 то 3.
	if (fast_scan && ((fast_scan_loads==0 && loadsWithNoWorkOnShares>fast_scan_loads+3) || (fast_scan_loads!=0 && loadsWithNoWorkOnShares>fast_scan_loads*3))){
		if (debug)
			console.log("Fast scan, we stop scanning those shared posts");
		//console.log("GO TO NEXT Here 3");
		setTimeout(function(){ClosePostAndOpenNext(-1)},100);
	}else if (tryL==0){
		docHeight=getElem('._5ki2 ._4-u2._4mrt._5jmm,div[role="dialog"] .sjgh65i0','#pagelet_timeline_main_column ._4-u2._4mrt._5jmm').length; // сколько сейчас постов показывается на странице.
		sharedPostsHeight=docHeight;
		// let's scroll it
		scrollThisE();
		// check loaded after 2 seconds.
		setTimeout(function(){itemsLoadMore(tryL+1,maxL);},2000);
	}else{
		docHeight=getElem('._5ki2 ._4-u2._4mrt._5jmm,div[role="dialog"] .sjgh65i0','#pagelet_timeline_main_column ._4-u2._4mrt._5jmm').length;
		// ничего не вышло
		if ((sharedMaxScroll>=2000 || tryL>=4) && !itemRemovedSharedScroll){
			//console.log('After 4 tries we have='+docHeight+'. And sharedPostsHeight='+sharedPostsHeight);
			if (debug) {console.log("GO TO NEXT Here 9");}
			setTimeout(function(){ClosePostAndOpenNext(-1)},100);
		}else if (docHeight!=sharedPostsHeight || itemRemovedSharedScroll){
			sharedMaxScroll++;
			// we elaborate posts starting from 3 (2 because there is 0 too)!
			itemElaborated=2;
			itemRemovedSharedScroll=false;
			// 20200407 - what happens here??? It was not scanning to the end
			//loadsWithNoWorkOnShares++;
			loadsWithNoWorkOnShares=0;
			setTimeout(function(){StartLIKEPosts(0);},100);
		}else if (docHeight==sharedPostsHeight && !itemRemovedSharedScroll){
			sharedMaxScroll++;
			// we elaborate posts starting from 3 (2 because there is 0 too)!
			itemElaborated=2;
			loadsWithNoWorkOnShares++;
			setTimeout(function(){StartLIKEPosts(0);},100);
		}else{
			scrollThisE();
			if (sharedMaxScroll>50)
				setTimeout(function(){itemsLoadMore(tryL+1,8);},3000);
			else if (sharedMaxScroll>40)
				setTimeout(function(){itemsLoadMore(tryL+1,7);},3000);
			else if (sharedMaxScroll>30)
				setTimeout(function(){itemsLoadMore(tryL+1,7);},2000);
			else if (sharedMaxScroll>20)
				setTimeout(function(){itemsLoadMore(tryL+1,6);},2000);
			else
				setTimeout(function(){itemsLoadMore(tryL+1,4);},2000);
		}
	}
}
}
function scrollThisE(){
window.scrollTo(0,$(document).height());
// and try to click the button if it exsists
if (getElem('._4-i2 #pagelet_scrolling_pager .uiMorePager a,._59s7 ._4-i2 .uiMorePager a').length>0)
	getElem('._4-i2 #pagelet_scrolling_pager .uiMorePager a,._59s7 ._4-i2 .uiMorePager a')[0].click();
}
function getTimeoutComments(){
if ((total_shared_posts_liked+total_shared_posts_commented) % 40 === 0 && additional_script_pause){
	return 30000;
}else{
	return Math.floor(Math.random() * (pc_2 - pc_1 + 1)) + pc_1;
}
}
function getCommSharesRandomText(){
	if (temp_random_array.length>0){

		_textR=temp_random_array[Math.floor(Math.random() * temp_random_array.length)]
		while((_matches = _regEx.exec(_textR)) !== null) {
		  _options = _matches[1].split("|");
		  _random = Math.floor(Math.random() * _options.length);
		  _textR = _textR.replace(_matches[0], _options[_random]);
		}
		
		return _textR;
	}else
		return "";
}
function addUserNameToComment(phrase,userName,attr){
	if (phrase.slice(-1)=="%")
		phrase=phrase+" ";
	if (attr && attr!=='undefined' && attr.length>0 && attr.indexOf('page.php')>0){
		phrase=phrase.replace(/\%name3\%/g, userName);
		phrase=phrase.replace(/\%name2\%/g, userName);
		phrase=phrase.replace(/\%name1\%/g, userName);
		phrase=phrase.replace("%name%", userName);
	}else{
		if (userName!== 'undefined' && userName.length>1){
			if (phrase.search("%name3%")>=0){
				if (userName.indexOf(' ')>=0)
					phrase=phrase.replace(/\%name3\%/g, userName.split(" ").pop());
				else
					phrase=phrase.replace(/\%name3\%/g, userName);
			}
			if (phrase.search("%name2%")>=0){
				if (userName.indexOf(' ')>=0)
					phrase=phrase.replace(/\%name2\%/g, userName.split(" ")[0]);
				else
					phrase=phrase.replace(/\%name2\%/g, userName);
			}
			if (phrase.search("%name1%")>=0)
				phrase=phrase.replace(/\%name1\%/g, userName);
			if (phrase.search("%name%")>=0)
				phrase=phrase.replace("%name%", userName);
		}else{
			phrase=phrase.replace("%name%", "");
			phrase=phrase.replace(/\%name1\%/g, "");
			phrase=phrase.replace(/\%name2\%/g, "");
			phrase=phrase.replace(/\%name3\%/g, "");
		}
	}
	return phrase;
}


//20180715 - new Invite
function StartInvitePeople(){
	checkTwice=0; //20200427 - добавил это, так как иногда останавливается скролл, мб поможет
if (scriptIsRunning==1){
if (skip_Invite==true && weAreInvitingFromShared==0){
console.log('Invite feature is disabled in Options. Go to next one.');
setTimeout(function(){ClosePostAndOpenNext(-1)},20);
}else{
	
	// TODO 20180715
	// Here we check if the post was loaded. and try to load it more
	// Then we check if we have to scan by tabs or in the OLD manner all together.
	if (scan_reactions_tabs || openedPostHasTooManyLikes()){
		// TODO
		// WE HAVE A BIG POST, we have to elaborate all tabs separately here!
		// ПЕРЕДАВАТЬ КАК-ТО инфо о том, открывать след пост или же открывать СЛЕД таб тут!!!!
		// for each tab check if we do not ignore it and add it to the array
		// clear the array of tabs.
		
		// NEW FACEBOOK design: TODO, we need to check by links that I added into fbEmotionsBtnArray array, let's see if they changed since 20200408
		
		bigPostTabs.length=0;
		if (getElem('._4t2a ._21ab li._45hc ._21af._9zc','._4t2a ._21ab li._45hc._1hqh ._21af._9zc,.hidden_elem ._21af._9zc').length>0){
			getElem('._4t2a ._21ab li._45hc ._21af._9zc','._4t2a ._21ab li._45hc._1hqh ._21af._9zc,.hidden_elem ._21af._9zc').each(function( index ) {
				if ((checkInArrayIconOldFB(this,fbEmotionsBtnArray['oldEmoClass']['like']) || ($(this).parent() && $(this).parent().attr('aria-label') && $(this).parent().attr('aria-label').toLowerCase().indexOf(fbEmotionsBtnArray['oldEmoText']['like'].toLowerCase())>0)) && !skip_like_emotion)
					bigPostTabs.push($( this ));
				else if ((checkInArrayIconOldFB(this,fbEmotionsBtnArray['oldEmoClass']['angry']) || ($(this).parent() && $(this).parent().attr('aria-label') && $(this).parent().attr('aria-label').toLowerCase().indexOf(fbEmotionsBtnArray['oldEmoText']['angry'].toLowerCase())>0)) && !skip_angry_emotion)
					bigPostTabs.push($( this ));
				else if ((checkInArrayIconOldFB(this,fbEmotionsBtnArray['oldEmoClass']['haha']) || ($(this).parent() && $(this).parent().attr('aria-label') && $(this).parent().attr('aria-label').toLowerCase().indexOf(fbEmotionsBtnArray['oldEmoText']['haha'].toLowerCase())>0)) && !skip_haha_emotion)
					bigPostTabs.push($( this ));
				else if ((checkInArrayIconOldFB(this,fbEmotionsBtnArray['oldEmoClass']['sad']) || ($(this).parent() && $(this).parent().attr('aria-label') && $(this).parent().attr('aria-label').toLowerCase().indexOf(fbEmotionsBtnArray['oldEmoText']['sad'].toLowerCase())>0)) && !skip_sad_emotion)
					bigPostTabs.push($( this ));
				else if ((checkInArrayIconOldFB(this,fbEmotionsBtnArray['oldEmoClass']['love']) || ($(this).parent() && $(this).parent().attr('aria-label') && $(this).parent().attr('aria-label').toLowerCase().indexOf(fbEmotionsBtnArray['oldEmoText']['love'].toLowerCase())>0)) && !skip_love_emotion)
					bigPostTabs.push($( this ));
				else if ((checkInArrayIconOldFB(this,fbEmotionsBtnArray['oldEmoClass']['care']) || ($(this).parent() && $(this).parent().attr('aria-label') && $(this).parent().attr('aria-label').toLowerCase().indexOf(fbEmotionsBtnArray['oldEmoText']['care'].toLowerCase())>0)) && !skip_love_emotion)
					bigPostTabs.push($( this ));
				else if ((checkInArrayIconOldFB(this,fbEmotionsBtnArray['oldEmoClass']['wow']) || ($(this).parent() && $(this).parent().attr('aria-label') && $(this).parent().attr('aria-label').toLowerCase().indexOf(fbEmotionsBtnArray['oldEmoText']['wow'].toLowerCase())>0)) && !skip_wow_emotion)
					bigPostTabs.push($( this ));
			});
		}
		//console.log("first check:"+bigPostTabs.length);
		if (bigPostTabs.length==0 && getNewUIMainScrollOnly('div[aria-label="Reactions"] div[aria-hidden="false"],div[aria-label="Reazioni"] div[aria-hidden="false"]').filter(function () {return ($(this).attr('aria-selected') && $(this).attr('aria-selected')=="false");}).length>0){
			getNewUIMainScrollOnly('div[aria-label="Reactions"] div[aria-hidden="false"],div[aria-label="Reazioni"] div[aria-hidden="false"]').filter(function () {return ($(this).attr('aria-selected') && $(this).attr('aria-selected')=="false");}).each(function( index ) {
				if ($( this ).find('img').length>0 && $( this ).find('img').attr('src') && checkInArrayIconNewFB($( this ).find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['like']) && !skip_like_emotion)
					bigPostTabs.push($( this ));
				else if ($( this ).find('img').length>0 && $( this ).find('img').attr('src') && checkInArrayIconNewFB($( this ).find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['angry']) && !skip_angry_emotion)
					bigPostTabs.push($( this ));
				else if ($( this ).find('img').length>0 && $( this ).find('img').attr('src') && checkInArrayIconNewFB($( this ).find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['haha']) && !skip_haha_emotion)
					bigPostTabs.push($( this ));
				else if ($( this ).find('img').length>0 && $( this ).find('img').attr('src') && checkInArrayIconNewFB($( this ).find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['sad']) && !skip_sad_emotion)
					bigPostTabs.push($( this ));
				else if ($( this ).find('img').length>0 && $( this ).find('img').attr('src') && checkInArrayIconNewFB($( this ).find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['love']) && !skip_love_emotion)
					bigPostTabs.push($( this ));
				else if ($( this ).find('img').length>0 && $( this ).find('img').attr('src') && checkInArrayIconNewFB($( this ).find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['care']) && !skip_love_emotion)
					bigPostTabs.push($( this ));
				else if ($( this ).find('img').length>0 && $( this ).find('img').attr('src') && checkInArrayIconNewFB($( this ).find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['wow']) && !skip_wow_emotion)
					bigPostTabs.push($( this ));
			});
		}
		// if we have more than 1 tab - use it!
		//console.log(bigPostTabs.length);
		if (bigPostTabs.length>0){
			StartInvitePeopleOLD(0);
		}else
			StartInvitePeopleOLD(-1);
	}else{
		// go to the old one
		StartInvitePeopleOLD(-1);
	}
}
}
}
var returnFF2=false;
function checkInArrayIconNewFB(att,arr){
	returnFF2=false;
	arr.forEach(function(item) {
		if (att.indexOf(item)>-1){
			returnFF2=true;
		}
	});
	return returnFF2;
	//$( this ).find('img').attr('src').indexOf(fbEmotionsBtnArray['newEmoLink']['like'][0])>-1
}
function checkInArrayIconOldFB(el,arr){
	//($( this ).find(fbEmotionsBtnArray['oldEmoClass']['angry']).length>0
	returnFF2=false;
	arr.forEach(function(item) {
		if ($(el).find(item).length>0){
			returnFF2=true;
		}
	});
	return returnFF2;
}
function allOldEmoClassesAreNotPresent(){
	// замена этому: getElem(fbEmotionsBtnArray['oldEmoClass']['like']).length==0 && getElem(fbEmotionsBtnArray['oldEmoClass']['love']).length==0 && getElem(fbEmotionsBtnArray['oldEmoClass']['haha']).length==0 && getElem(fbEmotionsBtnArray['oldEmoClass']['wow']).length==0 && getElem(fbEmotionsBtnArray['oldEmoClass']['sad']).length==0 && getElem(fbEmotionsBtnArray['oldEmoClass']['care']).length==0 && getElem(fbEmotionsBtnArray['oldEmoClass']['angry']).length==0
	returnFF2=true;
	fbEmotionsBtnArray['oldEmoClass'].forEach(function(arr) {
		arr.forEach(function(item) {
			if (getElem(item).length>0)
				returnFF2=false;
		});
	});
}
function openedPostHasTooManyLikes(){
	// here we check if we have an opened post, how many likes we have in all tabs and if we have any '0K 1K 2K 3K 4K - all them are in the ARRAY bigPostArray
if (!scan_reactions_tabs_more1)
	return false;
else{
	// check that any part of the array is found in the text
	if (getElem('._4t2a ._43o4 ._1hqh ._3m1v>span>span').length>0 && getElem('._4t2a ._43o4 ._1hqh ._3m1v>span>span').text().length>0){
		if (checkArrayInString(getElem('._4t2a ._43o4 ._1hqh ._3m1v>span>span').text()))
			return true;
	}
	if (getElem('._4t2a ._43o4 ._45hc ._3m1v>span>span').length>1 && $(getElem('._4t2a ._43o4 ._45hc ._3m1v>span>span')[1]).text().length>0){
		if (checkArrayInString($(getElem('._4t2a ._43o4 ._45hc ._3m1v>span>span')[1]).text()))
			return true;
	}
	if (getElem('._4t2a ._43o4 ._45hc ._3m1v>span>span').length>2 && $(getElem('._4t2a ._43o4 ._45hc ._3m1v>span>span')[2]).text().length>0){
		if (checkArrayInString($(getElem('._4t2a ._43o4 ._45hc ._3m1v>span>span')[2]).text()))
			return true;
	}
	
	
	//20200910 - new UI big posts
	var returnLoop=false;
	getNewUIMainScrollOnly('div[aria-label="Reactions"] div[aria-hidden="false"],div[aria-label="Reazioni"] div[aria-hidden="false"]').filter(function () {return ($(this).attr('aria-selected') && $(this).attr('aria-selected')=="false");}).each(function( index ) {
		if (!returnLoop && $( this ).find('span[dir="auto"]').length>0 && checkArrayInString($( this ).find('span[dir="auto"]').text()))
			returnLoop=true;
	});
	if (returnLoop)
		return returnLoop;
	
	// 20200408 - if we changed FILTER of emotions and Facebook changed names (we cannot find them), scan by tabs!!!!!!
	if (skip_like_emotion || skip_angry_emotion || skip_haha_emotion || skip_sad_emotion || skip_love_emotion || skip_wow_emotion){
		// we changed at least something here
		
		// OLD facebook: IF we cannot find any of next classes then it's broken again:
		if (!isThisNewFbDesign2020() && allOldEmoClassesAreNotPresent())
			return true;
	}
	return false;
}
}
function checkArrayInString(mystring) {
  for (var i = 0; i < bigPostArray.length; i++) {
    if (mystring.indexOf(bigPostArray[i]) > -1) {
      return true;
    }
  }
  return false;
}
function StartInvitePeopleOLD(useTab){
if (scriptIsRunning==1){
// clear some vars
totalLikedCheck=-1;
if (useTab<=0)
	clickedForMore=0;
loadsWithNoInvite=0;
loadsWithNoWorkOnShares=0

// if we have to open a tab, open it first!
if (useTab>-1){
	if (bigPostTabs.length>useTab && $(bigPostTabs[useTab]).length>0)
		$(bigPostTabs[useTab])[0].click();
	// after timeout
	
	// 20180815 - clean all variables:
	canSKIPButton=0;
	hadInvitedButton=0;
	hadClickedMoreButton=0;
	
	likeButtonsElaborated=0;
	
	
	setTimeout(function(){InvitePeople(useTab)},1000);
}else
	InvitePeople(useTab);

}
}


function InvitePeople2(useTab){
// if there is a "See more" button click it too
clickedForMore=0;
// улучшить рам для лупа, не клацать больше кнопок:
if (fast_scan && loadsWithNoInvite>fast_scan_loads && !weAreScanningOnlyInvites){
		if (weAreScanningOnlyInvites){
			weAreScanningOnlyInvites=false;
			stopScript();
		}else{
			if (debug) {console.log("GO TO NEXT Here 10");}
			setTimeout(function(){ClosePostAndOpenNext(useTab)},20);
		}
}else if (loop_PostsListArray.length>0 && notloadtoomuch && skip_if_no_buttons_after_first_loop && canSKIPButton>5 && hadInvitedButton==0){
	if (debug) {console.log("GO TO NEXT Here 11");}
	setTimeout(function(){ClosePostAndOpenNext(useTab)},20);
}else{
	if ((getElem('.uiScrollableAreaContent .uiMorePagerPrimary','.uiScrollableAreaContent .hidden_elem .uiMorePagerPrimary').length>0 && getElem('.uiScrollableAreaContent .uiMorePagerPrimary','.uiScrollableAreaContent .hidden_elem .uiMorePagerPrimary').length>0 && (uiMorePagerPrimary<fb_limit_show_more_btn || fb_limit_show_more_btn==0)) || newFBinviteDesign){
		inputsInvMore2 = getElem('._4t2a .uiScrollableArea .uiMorePager a.uiMorePagerPrimary','.hidden_elem a.uiMorePagerPrimary');
		
		// 20190911 - more timeout
		_tempTimeoutLoc3=10000;
		if (uiMorePagerPrimary>180)
			_tempTimeoutLoc3=40000;
		else if (uiMorePagerPrimary>120)
			_tempTimeoutLoc3=35000;
		else if (uiMorePagerPrimary>80)
			_tempTimeoutLoc3=20000;
		else if (uiMorePagerPrimary>60)
			_tempTimeoutLoc3=17000;
		else if (uiMorePagerPrimary>30)
			_tempTimeoutLoc3=13000;
		
		if (newFBinviteDesign)
			_tempTimeoutLoc3=_tempTimeoutLoc3/2;
		
		// 20190812 - test if we click on show more too fast!
		_tempTimeoutLoc2=Math.floor(Date.now())-_tempTimeoutLoc1;
		if (_tempTimeoutLoc2>=_tempTimeoutLoc3)
			_tempTimeoutLoc2=100; // just 0.1 sec pause
		else
			_tempTimeoutLoc2=_tempTimeoutLoc3-_tempTimeoutLoc2;

		_tempTimeoutLoc2=randTwoNumbers(_tempTimeoutLoc2*0.9,_tempTimeoutLoc2*1.1);
		if (_tempTimeoutLoc2<0)
			_tempTimeoutLoc2=100;
		
		// 20191001 - increase for our coffiecent if there are too many clicks:
		// TODO поменять на 100 или 50 если будет много блоков!!!
		_tempTimeoutLoc2=_tempTimeoutLoc2+((totalShowModeClickedForRun/300)*1000);
		if (debug)
			console.log("timeout:"+_tempTimeoutLoc2+". Increased by:"+((totalShowModeClickedForRun/300)*1000));
		
		if (_tempTimeoutLoc2>60000){
			_tempTimeoutLoc2=60000;
			_tempTimeoutLoc2=randTwoNumbers(_tempTimeoutLoc2*0.9,_tempTimeoutLoc2*1.1);
		}
		
		//_tempTimeoutLoc2=_tempTimeoutLoc2+2000;

		_tempTimeoutLoc2=Math.round(_tempTimeoutLoc2+fb_limit_show_more_btn_add_sec*1000);
		
		if (loopmaxtry>1 && _tempTimeoutLoc2>2000)
			_tempTimeoutLoc2=100;
		
		// TEMP
		//console.log("REMOVE");
		//_tempTimeoutLoc2=10;
		
		TimerDelayVar1=setTimeout(function(){
		
			for(locali=0;locali<inputsInvMore2.length;locali++){
				if (clickedForMore==0)
					hadClickedMoreButton++;
				clickedForMore=1;
				uiMorePagerPrimary++;
				updatePopup();
				//console.log('More buttons load click:' + uiMorePagerPrimary + ". hadClickedMoreButton:" + hadClickedMoreButton);
				inputsInvMore2[locali].click();
				
				// 20191001 - new, test if it is not limited!
				totalShowModeClickedForRun++;
				_tempTimeoutLoc1=Math.floor(Date.now());
			}
			//20200401 - new design
			if (newFBinviteDesign && (getElem(scrollingNewFBDesignClassDef).length>0 || getElem(scrollingNewFBDesignClass).length>0)){
				uiMorePagerPrimary++;
				updatePopup();
				//console.log('3More buttons load click:' + uiMorePagerPrimary + '. Skip first buttons: ' + canSKIPButton);
				clickedForMore=1;
				_tempTimeoutLoc1=Math.floor(Date.now());
				if (getElem(scrollingNewFBDesignClassDef).length>0)
					getScrollElemNewFb(scrollingNewFBDesignClassDef).scrollTop(52*99999);
				if (getElem(scrollingNewFBDesignClass).length>0)
					getScrollElemNewFb(scrollingNewFBDesignClass).scrollTop(52*99999);
			}
			//if (clickedForMore==1 && $('.uiScrollableArea .uiScrollableAreaWrap').length>0)
				//setTimeout(function(){$('.uiScrollableArea .uiScrollableAreaWrap').scrollTop(4000*(uiMorePagerPrimary+1));},1000);
			TimerDelayVar1=setTimeout(function(){
				// 20191001 - verify if we have a limitation, if yes, close it, and pause the script for 20-22 minutes!
				if (checkLimitationPopup2()){
					// 20191122 - WE NEED TO INCREASE PAUSES if user didn't do that before!!
					if (fb_limit_show_more_btn_add_sec<15)
						fb_limit_show_more_btn_add_sec=15;
					if (!additional_script_pause)
						additional_script_pause=true;
					api.storage.sync.set({
						//ignoreInviteString: ignoreInviteString
						fb_limit_show_more_btn_add_sec: fb_limit_show_more_btn_add_sec,
						additional_script_pause: additional_script_pause
						}, function() {
							if (p1_1<10000 && p1_2<10000){
								p1_1=13000;
								p1_2=15000;
								api.storage.sync.set({
									//ignoreInviteString: ignoreInviteString
									p1_1: 13,
									p1_2: 15
									}, function() {
								});
							}
					});
					
					
					if (scrollingLimitsInARow==3){
						stopScript("Error: Facebook popup message shown. <b>Click 'let us know' and report to Facebook</b>, wait 24h and try again. This is a normal limitation, it happens even if you click manually.<br>",true);
					}else{
						// close the popup
						if (getElem('._4t2a .uiOverlayFooter .layerCancel,.uiLayer .uiOverlayFooter .layerCancel').length>0){
							getElem('._4t2a .uiOverlayFooter .layerCancel,.uiLayer .uiOverlayFooter .layerCancel')[0].click();
						}
						// pause the script
						var localtimeoutDelay=22*60;
						localtimeoutDelay=addRandomToTheTimer(localtimeoutDelay);
						if (localtimeoutDelay<=0)
							localtimeoutDelay=30;
						var today = new Date();
						today.setSeconds(today.getSeconds()+(localtimeoutDelay));
						localtimeoutDelay=localtimeoutDelay*1000;
						
						if (scrollingLimitsInARow==2)
							localtimeoutDelay=localtimeoutDelay*2;
						
						// reset count of all clicks
						totalShowModeClickedForRun=0;
						
						// TEST:
						//localtimeoutDelay=5000;
						
						// update popup
						updatePopup('.<br><span style="color:red">Scrolling is temporary limited.</span> We pause the script for ~'+(scrollingLimitsInARow==2 ? '44' : '22')+' minutes. Will resume at '+("0"+today.getHours()).slice(-2)+':'+("0"+today.getMinutes()).slice(-2)+':'+("0"+today.getSeconds()).slice(-2),1);
						
						scrollingLimitsInARow++;
						
						if (scrollingLimitsInARow==2 || totalPostsElaborated>1){
							// close current likes list
							TimerDelayVar1=setTimeout(function(){
								if (getElem('._2pi9 .layerCancel, ._21ab .layerCancel').length>0)
									getElem('._2pi9 .layerCancel, ._21ab .layerCancel')[0].click();
								closeInviteWindowInNewUI();
							},randTwoNumbers(2000,5000));
							loopTimerDelay=setTimeout(function(){
								if (debug) {console.log("GO TO NEXT Here 12");}
								ClosePostAndOpenNext(useTab);
							},localtimeoutDelay);
						}else{
							loopTimerDelay=setTimeout(function(){
								InvitePeople(useTab);
							},localtimeoutDelay);
						}

					}
				}else{
					scrollingLimitsInARow=0;
					InvitePeople(useTab);
				}
			},Math.floor(Math.random() * (fb_timeout_2+700 - fb_timeout_2 + 1)) + fb_timeout_2);
		}, _tempTimeoutLoc2);
	﻿}else{
		uiMorePagerPrimary=0;
		likeButtonsElaborated=0;
		if (debug) {console.log("GO TO NEXT Here 13");}
		setTimeout(function(){ClosePostAndOpenNext(useTab)},20);
	}
}
updatePopup();
}

//INVITE PEOPLE FROM CURRENT POST
function InvitePeople(useTab){
if (scriptIsRunning==1){
//console.log('InvitePeople. hadInvitedButton=' + hadInvitedButton + '. canSKIPButton = ' + canSKIPButton);
if (hadInvitedButton>0)
	hadInvitedButton=hadInvitedButton*2 + 2
canSKIPButton=canSKIPButton-hadInvitedButton;
if (canSKIPButton<3)
	canSKIPButton=0;

// Check if post was loaded, if after 5 checks it was not loaded - exit
inputsInvites = getElem('.uiScrollableAreaWrap ._5i_p .uiList._4kg','.hidden_elem .uiList._4kg').find('._5i_q ._6a._6b button._51sy,._5i_q ._6a._6b a._51sy').not('._5i_q ._6a._6b a._59pe,._5i_q ._6a._6b button._51sy.hidden_elem,.uiPopover>a._51sy');
// 20191213 - fix for watch and NEW Facebook design.
if (inputsInvites.length==0 && getNewInviteButtonsByText().length>0 && getElem(getElemWithAddFriendButtons('div[role="dialog"] span:contains("Add Friend")'),getElemWithAddFriendButtons('div[role="article"] span:contains("Add Friend")')).length<=7 && isThisNewFbDesign2020()){
	newFBinviteDesign=true;
	inputsInvites = getNewInviteButtonsByText();
	scanByNameNewUI=true;
}

if (inputsInvites.length>0){
	//console.log('Button list length: ' + inputsInvites.length + '. Last check: ' + totalLikedCheck + '. Click for more: ' + clickedForMore + '. loopmaxtry:' + loopmaxtry + '. canSKIPButton:' + canSKIPButton);
	tryToLoad=0;
	if (runMode==3 || runMode==4 || ((runMode==1 || runMode==2) && (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments || share_put_likes || (share_put_comments && text_comm_shares.length>1)))){
		// check if there are at least 5 add friend buttons in this page, if yes - go to the next page.
		inputsInvites2 = getElem('#reaction_profile_browser .FriendRequestAdd._51sy, #reaction_profile_browser1 .FriendRequestAdd._51sy, #reaction_profile_browser2 .FriendRequestAdd._51sy, #reaction_profile_browser3 .FriendRequestAdd._51sy, #reaction_profile_browser4 .FriendRequestAdd._51sy, #reaction_profile_browser5 .FriendRequestAdd._51sy, #reaction_profile_browser6 .FriendRequestAdd._51sy, #reaction_profile_browser7 .FriendRequestAdd._51sy, #reaction_profile_browser8 .FriendRequestAdd._51sy, #reaction_profile_browser9 .FriendRequestAdd._51sy','.hidden_elem #reaction_profile_browser .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser1 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser2 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser3 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser4 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser5 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser6 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser7 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser8 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser9 .FriendRequestAdd._51sy');
		if (inputsInvites2.length>4 && inputsInvites2.length>inputsInvites.length/3){
			// 20200120 - leonid.lobanok@gmail.com тут бы прокомментировать чтобы не уходило на др страницу
			if (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments || share_put_likes || (share_put_comments && text_comm_shares.length>1) || weAreInvitingFromShared>0 || weAreScanningOnlyShared){
				localuse=1;
				if (debug) {console.log("GO TO NEXT Here 14");}
				ClosePostAndOpenNext(useTab);
			}else{
				if (debug){console.log("next page 14");}
				open_next_page();
			}
		}
	}
	if (localuse==0){
		if (totalLikedCheck==inputsInvites.length && (clickedForMore==0 || (newFBinviteDesign && loopmaxtry>1))){
		if (weAreScanningOnlyInvites){
			weAreScanningOnlyInvites=false;
			stopScript();
		}else{
			if (debug) {console.log("GO TO NEXT Here 15");}
			ClosePostAndOpenNext(useTab)
		}

		}else if (totalLikedCheck==inputsInvites.length){
			loopmaxtry++;
			if (loopmaxtry==5 || (hadClickedMoreButton>200 && !newFBinviteDesign)){
				if (weAreScanningOnlyInvites){
					weAreScanningOnlyInvites=false;
					stopScript();
				}else{
					if (debug) {console.log("GO TO NEXT Here 16");}
					ClosePostAndOpenNext(useTab);
				}
			}else
				setTimeout(function(){InvitePeople2(useTab)}, 1500);
		}else{
			loopmaxtry=0;
			totalLikedCheck=inputsInvites.length;
			//console.log('InviteNext call, start at:' + canSKIPButton);
			loadsWithNoInvite++;
			setTimeout(function(){inviteNext(canSKIPButton,inputsInvites,useTab)},20);
		}
	}
	localuse=0;
}else{
	// check if there are at least 5 add friend buttons in this page, if yes - go to the next page.
	inputsInvites2 = getElem('#reaction_profile_browser .FriendRequestAdd._51sy, #reaction_profile_browser1 .FriendRequestAdd._51sy, #reaction_profile_browser2 .FriendRequestAdd._51sy, #reaction_profile_browser3 .FriendRequestAdd._51sy, #reaction_profile_browser4 .FriendRequestAdd._51sy, #reaction_profile_browser5 .FriendRequestAdd._51sy, #reaction_profile_browser6 .FriendRequestAdd._51sy, #reaction_profile_browser7 .FriendRequestAdd._51sy, #reaction_profile_browser8 .FriendRequestAdd._51sy, #reaction_profile_browser9 .FriendRequestAdd._51sy','.hidden_elem #reaction_profile_browser .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser1 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser2 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser3 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser4 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser5 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser6 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser7 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser8 .FriendRequestAdd._51sy, .hidden_elem #reaction_profile_browser9 .FriendRequestAdd._51sy');
	if ((inputsInvites2.length>4 || (getElem(getElemWithAddFriendButtons('div[role="dialog"] span:contains("Add Friend")'),getElemWithAddFriendButtons('div[role="article"] span:contains("Add Friend")')).length>7 && (getElem(scrollingNewFBDesignClassDef).length>0 || getElem(scrollingNewFBDesignClass).length>0))) && (runMode==3 || runMode==4 || ((runMode==1 || runMode==2) && (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments || share_put_likes || (share_put_comments && text_comm_shares.length>1))))){
		if (inviteDuringShareCheck || inviteDuringShareCheck2 || likeSharedComments || share_put_likes || (share_put_comments && text_comm_shares.length>1) || weAreInvitingFromShared>0 || weAreScanningOnlyShared){
			if (debug) {console.log("GO TO NEXT Here 17");}
			ClosePostAndOpenNext(useTab);
		}else{
			if (debug){console.log("next page 15");}
			open_next_page();
		}
	}else{
		if (tryToLoad<3){
			tryToLoad++;
			TimerDelayVar1=setTimeout(function(){InvitePeople(useTab)},fb_timeout_2);
		}else{
			//stopScript();
			if (debug) {console.log("GO TO NEXT Here 18");}
			ClosePostAndOpenNext(useTab);
		}
	}
}
hadInvitedButton=0;

}
}
function getElemWithAddFriendButtons(_txt){
_txtreturn1="";
if (fbInviteBtnArray[getCurrentFbLang()] && fbInviteBtnArray[getCurrentFbLang()]['addFriend'] && fbInviteBtnArray[getCurrentFbLang()]['addFriend'][0]){
	_txtreturn1=_txt.replace('Add Friend',fbInviteBtnArray[getCurrentFbLang()]['addFriend'][0]);
	if (fbInviteBtnArray[getCurrentFbLang()]['addFriend'][1])
		_txtreturn1=_txtreturn1+','+_txt.replace('Add Friend',fbInviteBtnArray[getCurrentFbLang()]['addFriend'][1]);
}else
	_txtreturn1=_txt;
return _txtreturn1;
}

function addRandomToTheTimer(value){
	return Math.floor(Math.random() * ((value+value*0.01) - (value-value*0.01) + 1)) + (value-value*0.01);
}
function inviteNext(i,inputs,useTab){
	if (scanByNameNewUI)
		inviteNextNewUI(i,inputs,useTab);
	else
		inviteNext3(i,inputs,useTab);
}
function inviteNext3(e,inputs,useTab){
	//mtotalInvited++;
	//console.log("TEST click:"+mtotalInvited);
if (scriptIsRunning==1){
	// NEW 20180207
	if (inputs.length>10){
		if (fmob)
			window.scrollTo(0,61*e+90);
		else if (Math.floor(Math.random()*(100-0+1)+0)>80){
			//20200401 scroll to current elem?
			if (newFBinviteDesign && getElem(scrollingNewFBDesignClass).length>0){
				uiMorePagerPrimary++;
				getScrollElemNewFb(scrollingNewFBDesignClass).scrollTop(52*e-250);
			}else if (newFBinviteDesign && getElem(scrollingNewFBDesignClassDef).length>0){
				uiMorePagerPrimary++;
				getScrollElemNewFb(scrollingNewFBDesignClassDef).scrollTop(52*e-250);
			}
			updatePopup();
			
			getElem('.uiScrollableArea .uiScrollableAreaWrap','.hidden_elem .uiScrollableAreaWrap,._3wpv .uiScrollableAreaWrap').scrollTop(65*e);
		}
	}
	clickedForMore=0;
	if(e<inputs.length){
		if (e>canSKIPButton)
			canSKIPButton=e;
		if ((mtotalInvited+c_c1)>=fb_limit || psInvTot>299){
			if ((runMode==3 || runMode==4) && try_after_limit && weAreInvitingFromShared==0 && !weAreScanningOnlyShared){
				if (debug){console.log("next page 16");}
				open_next_page();
			}else{
				console.log("Stop, debug: 7");
				stopScript();
			}
		// 20190719 we can set to invite x for each page
		}else if ((runMode==3 || runMode==4) && fb_lim_this_page_counter>=fb_limit_multi){
			if (fb_limit_multi==0)
				alert("Check settings -> Daily limit -> Limit for single page. Cause you set it to 0, so we cannot invite no one for this page.");
			if (debug){console.log("next page 17");}
			open_next_page();
		}else if (pauseAfterLimit && pauseAfterLimit2!=0 && pauseAfterLimit3!=0 && mtotalInvited%pauseAfterLimit3 == 0 && mtotalInvited!=pauseLastNumber){
			pauseLastNumber=mtotalInvited;
			// 20190930 take a pause if this option is ON. Let's take a pause and go to the next post soon.
			// reset the number, it's 0 now, and mtotalInvited2 has it!
			uiMorePagerPrimary=0;
			likeButtonsElaborated=0;
			
			// create pause
			var localtimeoutDelay=pauseAfterLimit2*60;
			localtimeoutDelay=addRandomToTheTimer(localtimeoutDelay);
			if (localtimeoutDelay<=0)
				localtimeoutDelay=30;
			var today = new Date();
			today.setSeconds(today.getSeconds()+(localtimeoutDelay));
			localtimeoutDelay=localtimeoutDelay*1000;
			
			// update popup
			updatePopup('.<br>We take a pause (you set in settings) every '+pauseAfterLimit3+' invites for ' + (pauseAfterLimit2) + ' minutes (+- 1%). Continue at '+("0"+today.getHours()).slice(-2)+':'+("0"+today.getMinutes()).slice(-2)+':'+("0"+today.getSeconds()).slice(-2),1);
			
			if (pauseAfterLimit2>30){
				if (debug) {console.log("GO TO NEXT Here 19");}
				TimerDelayVar1=setTimeout(function(){ClosePostAndOpenNext(useTab);},localtimeoutDelay); // если больше 30 минут то мы идем к новому посту
			}else
				TimerDelayVar1=setTimeout(function(){inviteNext3(e,inputs,useTab);},localtimeoutDelay); // продолжаем сканировать!
		}else{
			//console.log("--2:"+like_other_pages);
			//console.log((inputs[e].disabled));
			if (    (!newFBinviteDesign || (newFBinviteDesign && $(inputs[e]).text().length>0 && fbInviteBtnArray[usedFbLang]['inv'].includes($(inputs[e]).text()) && !fbInviteBtnArray[usedFbLang]['inv2'].includes($(inputs[e]).text()) && !fbInviteBtnArray[usedFbLang]['oth'].includes($(inputs[e]).text()) ))        &&    (((inputs[e].className.indexOf('PageLikeButton')==-1 || (like_other_pages && inputs[e].className.indexOf('PageLikedButton')==-1)) && inputs[e].className.indexOf('FriendRequestFriends')==-1 && inputs[e].className.indexOf('FriendRequestAdd')==-1 && inputs[e].className.indexOf('_59pe')==-1 && (inputs[e].disabled == undefined || (like_other_pages && !inputs[e].disabled && inputs[e].className.indexOf('PageLikedButton')==-1)) && inputs[e].className.indexOf('layerCancel')==-1 && inputs[e].className.indexOf('_2347')==-1) || (fmob && inputs[e].className.indexOf('_2347')==-1))){
				// TEST: check the text of DO NOT INVITE
				if (document.documentElement.innerHTML.indexOf('no more invitations to like this Page can be sent today')>-1){
					limitreached=1;
					if ((runMode==3 || runMode==4) && try_after_limit && weAreInvitingFromShared==0 && !weAreScanningOnlyShared){
						if (debug){console.log("next page 18");}
						open_next_page();
					}else
						stopScript(api.i18n.getMessage("facebook_limit_block") + '<br>');
				}else if (getElem('._pig').length>0){
					found=0;
					elsHelpCont = getElem('._pig');
					for(locali = 0; locali < elsHelpCont.length; locali++){
					  if(elsHelpCont[locali].innerHTML.indexOf('/help/contact/') > -1){
						found=2;
						limitreached=1;
						if ((runMode==3 || runMode==4) && try_after_limit && weAreInvitingFromShared==0 && !weAreScanningOnlyShared){
							if (debug){console.log("next page 19");}
							open_next_page();
						}else
							stopScript(api.i18n.getMessage("facebook_limit_block") + '<br>');
					  }
					}
					if (inputs[e].getAttribute("ajaxify") && inputs[e].getAttribute("ajaxify").indexOf('/follow/follow_profile')>-1){
						found=1;
					}
					// Check for angry emotion
					if (found==0 && skip_angry_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['angry'])){
							found=1;
							//console.log('ANGRY reaction found, ignor it!');
						}
					}
					if (found==0 && skip_haha_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['haha'])){
							found=1;
							//console.log('HAHA reaction found, ignor it!');
						}
					}
					if (found==0 && skip_sad_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['sad'])){
							found=1;
							//console.log('SAD reaction found, ignor it!');
						}
					}
					// new
					if (found==0 && skip_like_emotion){
						// check if the reaction is LIKE
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['like'])){
							found=1;
							//console.log('LIKE reaction found, ignor it!');
						}
					}
					if (found==0 && skip_love_emotion){
						// check if the reaction is LOVE
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['love'])){
							found=1;
							//console.log('LOVE reaction found, ignor it!');
						}
					}
					if (found==0 && skip_wow_emotion){
						// check if the reaction is WOW
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['wow'])){
							found=1;
							//console.log('WOW reaction found, ignor it!');
						}
					}
					// check other filters - accept_ashii_names_only
					if (found==0 && accept_ashii_names_only){
						// check if name contains ashii chars
						if ($(inputs[e]).closest('._5i_q').length>0 && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a') && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').length>0 && !ascii.test( $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').text() )){
							found=1;
							console.log('User ignored due to ascii chars settings!');
						}
					}
					// check other filters - namesFilter
					if (found==0 && namesFilter.length>0){
						// check if name is in ignore list
						if ($(inputs[e]).closest('._5i_q').length>0 && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a') && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').length>0 && arrayInStringFound(namesFilter,$(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').text())){
							found=1;
							console.log('User ignored due to settings (names list)!');
						}
					}
					// check other filters - skip_no_profile_image
					if (found==0 && skip_no_profile_image){
						// check if user doesn't have profile image
						// male: https://scontent.fblq3-1.fna.fbcdn.net/v/t1.30497-1/cp0/c12.0.40.40a/p40x40/84241059_189132118950875_4138507100605120512_n.jpg?_nc_cat=1&_nc_sid=dbb9e7&_nc_ohc=SRoV1a8-7WkAX_4-gtD&_nc_ht=scontent.fblq3-1.fna&oh=bdf1afb41ac6752d9d0b60ff54cd636c&oe=5EE9E69E
						// female: https://scontent.fblq3-1.fna.fbcdn.net/v/t1.30497-1/cp0/c12.0.40.40a/p40x40/84688533_170842440872810_7559275468982059008_n.jpg?_nc_cat=1&_nc_sid=dbb9e7&_nc_ohc=GQgyjO1APLAAX_Zj4I_&_nc_ht=scontent.fblq3-1.fna&oh=f6c602b04fc4a7ede475342b3f22b595&oe=5EE8C14E
						if ($(inputs[e]).closest('._5i_q').length>0 && $(inputs[e]).closest('._5i_q').find('._2ar2 img.img') && $(inputs[e]).closest('._5i_q').find('._2ar2 img.img').length>0 && $(inputs[e]).closest('._5i_q').find('._2ar2 img.img').attr('src').length>0 && ($(inputs[e]).closest('._5i_q').find('._2ar2 img.img').attr('src').indexOf('605120512_n.jpg')>-1 || $(inputs[e]).closest('._5i_q').find('._2ar2 img.img').attr('src').indexOf('2059008_n.jpg')>-1)){
							found=1;
							console.log('User ignored because he doesn\'t have profile image 1!');
						}
					}
					if (found==0){
						mtotalInvited++;
						
						fb_lim_this_page_counter++;
						// ыы
						inputs[e].click();
						//console.log('TRY invite');
						normal_run_limitNoInvitePosts=-1;
						
						// 20190419 - new, test if it is not limited!
						clearTimeout(_timeCheckLimit);
						_timeCheckLimit=setTimeout(function(){checkLimitationPopup()},2000);
						
						hadInvitedButton++;
						loadsWithNoInvite=0;
						e++;
						addText='';
						timeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
						if (mtotalInvited % 2 === 0)
							timeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
						if (mtotalInvited % 40 === 0 && (mtotalInvited+c_c1)!=fb_limit && additional_script_pause){
							timeout=30000;
							addText='\r' + api.i18n.getMessage("paused");
						}
						updatePopup(addText);
						TimerDelayVar1=loopTimerDelay=setTimeout(function(){inviteNext3(e,inputs,useTab)},timeout);
					}else if (found==1){
						e++;
						setTimeout(function(){inviteNext3(e,inputs,useTab)},randTwoNumbers(20,150));
					}
				}else if (inputs[e].getAttribute("ajaxify") && inputs[e].getAttribute("ajaxify").indexOf('/follow/follow_profile')>-1){
					//console.log('follow found');
					e++;
					setTimeout(function(){inviteNext3(e,inputs,useTab)},randTwoNumbers(20,150));
				}else{
					found=0;
					// Check for angry emotion
					if (found==0 && skip_angry_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['angry'])){
							found=1;
							//console.log('ANGRY reaction found, ignor it!');
						}
					}
					if (found==0 && skip_haha_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['haha'])){
							found=1;
							//console.log('HAHA reaction found, ignor it!');
						}
					}
					if (found==0 && skip_sad_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['sad'])){
							found=1;
							//console.log('SAD reaction found, ignor it!');
						}
					}
					// new
					if (found==0 && skip_like_emotion){
						// check if the reaction is LIKE
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['like'])){
							found=1;
							//console.log('LIKE reaction found, ignor it!');
						}
					}
					if (found==0 && skip_love_emotion){
						// check if the reaction is LOVE
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['love'])){
							found=1;
							//console.log('LOVE reaction found, ignor it!');
						}
					}
					if (found==0 && skip_wow_emotion){
						// check if the reaction is WOW
						if ($(inputs[e]).closest('._5i_q').length>0 && checkInArrayIconOldFB($(inputs[e]).closest('._5i_q'),fbEmotionsBtnArray['oldEmoClass']['wow'])){
							found=1;
							//console.log('WOW reaction found, ignor it!');
						}
					}
					// check other filters - accept_ashii_names_only
					if (found==0 && accept_ashii_names_only){
						// check if name contains ashii chars
						if ($(inputs[e]).closest('._5i_q').length>0 && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a') && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').length>0 && !ascii.test( $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').text() )){
							found=1;
							console.log('User ignored due to ascii chars settings!');
						}
					}
					// check other filters - namesFilter
					if (found==0 && namesFilter.length>0){
						// check if name is in ignore list
						if ($(inputs[e]).closest('._5i_q').length>0 && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a') && $(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').length>0 && arrayInStringFound(namesFilter,$(inputs[e]).closest('._5i_q').find('._42ef ._5j0e a').text())){
							found=1;
							console.log('User ignored due to settings (names list)!');
						}
					}
					// check other filters - skip_no_profile_image
					if (found==0 && skip_no_profile_image){
						// check if user doesn't have profile image
						if ($(inputs[e]).closest('._5i_q').length>0 && $(inputs[e]).closest('._5i_q').find('._2ar2 img.img') && $(inputs[e]).closest('._5i_q').find('._2ar2 img.img').length>0 && $(inputs[e]).closest('._5i_q').find('._2ar2 img.img').attr('src').length>0 && ($(inputs[e]).closest('._5i_q').find('._2ar2 img.img').attr('src').indexOf('605120512_n.jpg')>-1 || $(inputs[e]).closest('._5i_q').find('._2ar2 img.img').attr('src').indexOf('2059008_n.jpg')>-1)){
							found=1;
							console.log('User ignored because he doesn\'t have profile image 2!');
						}
					}
					if (found==0){
						mtotalInvited++;
						
						fb_lim_this_page_counter++;
						// ыы
						inputs[e].click();
						//console.log('TRY invite');
						normal_run_limitNoInvitePosts=-1;
						
						// 20190419 - new, test if it is not limited!
						clearTimeout(_timeCheckLimit);
						_timeCheckLimit=setTimeout(function(){checkLimitationPopup()},2000);
						
						hadInvitedButton++;
						loadsWithNoInvite=0;
						addText='';
						timeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
						if (mtotalInvited % 2 === 0)
							timeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
						if (mtotalInvited % 40 === 0 && (mtotalInvited+c_c1)!=fb_limit && additional_script_pause){
							timeout=30000;
							addText='\r' + api.i18n.getMessage("paused");
						}
						updatePopup(addText);
					}
					e++;
					loopTimerDelay=setTimeout(function(){inviteNext3(e,inputs,useTab)},timeout);
				}
			}else{
				//if (inputs[e].className.indexOf('FriendRequestAdd')>-1 && mtotalInvited==0){
					// temp: do not announce this at the moment
					//stopScript(api.i18n.getMessage("error_add_friend") + '\r');
				//}else{
					e++;
					setTimeout(function(){inviteNext3(e,inputs,useTab)},randTwoNumbers(20,150));
				//}
			}
		}
	}else{
		// 20190419 - before loading next let's scroll to the bottom!
		getElem('.uiScrollableArea .uiScrollableAreaWrap','.hidden_elem .uiScrollableAreaWrap,._3wpv .uiScrollableAreaWrap').scrollTop(65*e);
		setTimeout(function(){InvitePeople2(useTab)}, Math.floor(Math.random() * (700 - 200 + 1)) + 200);
	}
}
}

// 20200918 - NEW UI, let's click INVITE and check if INVITE button was pressed!
function noCaptchaOrLimitNewDesign(){
	// for the moment we don't have any info about captcha or limitations, we will stop the script here!
	return true;
}
function inviteNextNewUI(i,inputs,useTab){
if (scriptIsRunning==1){
	
	// scroll to current element!
	if (inputs.length>10){
		if (Math.floor(Math.random()*(100-0+1)+0)>60 || fbInviteBtnArray[usedFbLang]['inv'].includes($(inputs[i]).text())){
			//20200401 scroll to current elem?
			if (newFBinviteDesign && getElem(scrollingNewFBDesignClass).length>0){
				uiMorePagerPrimary++;
				getScrollElemNewFb(scrollingNewFBDesignClass).scrollTop(52*i-220);
			}else if (newFBinviteDesign && getElem(scrollingNewFBDesignClassDef).length>0){
				uiMorePagerPrimary++;
				getScrollElemNewFb(scrollingNewFBDesignClassDef).scrollTop(52*i-220);
			}
			updatePopup();
		}
	}
	clickedForMore=0;
	if(i<inputs.length){
	
		// how many likes did we elaborate
		if (i>likeButtonsElaborated)
			likeButtonsElaborated=i+1;
		
		if (i>canSKIPButton)
			canSKIPButton=i;
		if ((mtotalInvited+c_c1)>=fb_limit || psInvTot>299){
			if ((runMode==3 || runMode==4) && try_after_limit && weAreInvitingFromShared==0 && !weAreScanningOnlyShared){
				if (debug){console.log("next page 20");}
				open_next_page();
			}else{
				console.log("Stop, debug: 7");
				stopScript();
			}
		// 20190719 we can set to invite x for each page
		}else if ((runMode==3 || runMode==4) && fb_lim_this_page_counter>=fb_limit_multi){
			if (fb_limit_multi==0)
				alert("Check settings -> Daily limit -> Limit for single page. Cause you set it to 0, so we cannot invite no one for this page.");
			if (debug){console.log("next page 21");}
			open_next_page();
		}else if (pauseAfterLimit && pauseAfterLimit2!=0 && pauseAfterLimit3!=0 && mtotalInvited%pauseAfterLimit3 == 0 && mtotalInvited!=pauseLastNumber){
			pauseLastNumber=mtotalInvited;
			// 20190930 take a pause if this option is ON. Let's take a pause and go to the next post soon.
			// reset the number, it's 0 now, and mtotalInvited2 has it!
			uiMorePagerPrimary=0;
			likeButtonsElaborated=0;
			
			// create pause
			var localtimeoutDelay=pauseAfterLimit2*60;
			localtimeoutDelay=addRandomToTheTimer(localtimeoutDelay);
			if (localtimeoutDelay<=0)
				localtimeoutDelay=30;
			var today = new Date();
			today.setSeconds(today.getSeconds()+(localtimeoutDelay));
			localtimeoutDelay=localtimeoutDelay*1000;
			
			// update popup
			updatePopup('.<br>We take a pause (you set in settings) every '+pauseAfterLimit3+' invites for ' + (pauseAfterLimit2) + ' minutes (+- 1%). Continue at '+("0"+today.getHours()).slice(-2)+':'+("0"+today.getMinutes()).slice(-2)+':'+("0"+today.getSeconds()).slice(-2),1);
			
			if (pauseAfterLimit2>30){
				if (debug) {console.log("GO TO NEXT Here 20");}
				TimerDelayVar1=setTimeout(function(){ClosePostAndOpenNext(useTab);},localtimeoutDelay); // если больше 30 минут то мы идем к новому посту
			}else
				TimerDelayVar1=setTimeout(function(){inviteNextNewUI(i,inputs,useTab);},localtimeoutDelay); // продолжаем сканировать!
		}else{
			//console.log("--2:"+like_other_pages);
			//console.log((inputs[i].disabled));
			if (    (newFBinviteDesign && $(inputs[i]).text().length>0 && fbInviteBtnArray[usedFbLang]['inv'].includes($(inputs[i]).text()) && !fbInviteBtnArray[usedFbLang]['inv2'].includes($(inputs[i]).text()) && !fbInviteBtnArray[usedFbLang]['oth'].includes($(inputs[i]).text()) )        &&    (inputs[i].disabled == undefined && (!$(inputs[i]).attr('aria-disabled') || ($(inputs[i]).attr('aria-disabled') && $(inputs[i]).attr('aria-disabled')!="true")))     ){
				// TEST: check the text of DO NOT INVITE
				if (document.documentElement.innerHTML.indexOf('no more invitations to like this Page can be sent today')>-1){
					limitreached=1;
					if ((runMode==3 || runMode==4) && try_after_limit && weAreInvitingFromShared==0 && !weAreScanningOnlyShared){
						if (debug){console.log("next page 22");}
						open_next_page();
					}else
						stopScript(api.i18n.getMessage("facebook_limit_block") + '<br>');
				}else if (noCaptchaOrLimitNewDesign()){
					found=0;

					// EMOTIONS ARE NOT READY FOR THE NEW DESIGN
					
					// Check for angry emotion
					if (found==0 && skip_angry_emotion){
						// check if the reaction is ANGRY
						//$( this ).find('img').attr('src')
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src').length>0 && checkInArrayIconNewFB($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['angry'])){
							found=1;
							//console.log('ANGRY reaction found, ignor it!');
						}
					}
					if (found==0 && skip_haha_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src').length>0 && checkInArrayIconNewFB($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['haha'])){
							found=1;
							//console.log('HAHA reaction found, ignor it!');
						}
					}
					if (found==0 && skip_sad_emotion){
						// check if the reaction is ANGRY
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src').length>0 && checkInArrayIconNewFB($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['sad'])){
							found=1;
							//console.log('SAD reaction found, ignor it!');
						}
					}
					// new
					if (found==0 && skip_like_emotion){
						// check if the reaction is LIKE
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src').length>0 && checkInArrayIconNewFB($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['like'])){
							found=1;
							//console.log('LIKE reaction found, ignor it!');
						}
					}
					if (found==0 && skip_love_emotion){
						// check if the reaction is LOVE
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src').length>0 && checkInArrayIconNewFB($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['love'])){
							found=1;
							//console.log('LOVE reaction found, ignor it!');
						}
					}
					if (found==0 && skip_wow_emotion){
						// check if the reaction is WOW
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src').length>0 && checkInArrayIconNewFB($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('img').attr('src'),fbEmotionsBtnArray['newEmoLink']['wow'])){
							found=1;
							//console.log('WOW reaction found, ignor it!');
						}
					}
					// check other filters - accept_ashii_names_only
					if (found==0 && accept_ashii_names_only){
						// check if name contains ashii chars
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a').filter(function () {return ($(this).attr('aria-label'))}).length>0 && !ascii.test( $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a').filter(function () {return ($(this).attr('aria-label'))}).attr('aria-label') )){
							found=1;
							console.log('User ignored due to ascii chars settings!');
						}
					}
					// check other filters - namesFilter
					if (found==0 && namesFilter.length>0){
						// check if name is in ignore list
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a').filter(function () {return ($(this).attr('aria-label'))}).length>0 && arrayInStringFound(namesFilter,$(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a').filter(function () {return ($(this).attr('aria-label'))}).attr('aria-label'))){
							found=1;
							console.log('User ignored due to settings (names list)!');
						}
					}
					// check other filters - skip_no_profile_image
					if (found==0 && skip_no_profile_image){
						// check if user doesn't have profile image
						// male: https://scontent.fblq3-1.fna.fbcdn.net/v/t1.30497-1/cp0/c12.0.40.40a/p40x40/84241059_189132118950875_4138507100605120512_n.jpg?_nc_cat=1&_nc_sid=dbb9e7&_nc_ohc=SRoV1a8-7WkAX_4-gtD&_nc_ht=scontent.fblq3-1.fna&oh=bdf1afb41ac6752d9d0b60ff54cd636c&oe=5EE9E69E
						// female: https://scontent.fblq3-1.fna.fbcdn.net/v/t1.30497-1/cp0/c12.0.40.40a/p40x40/84688533_170842440872810_7559275468982059008_n.jpg?_nc_cat=1&_nc_sid=dbb9e7&_nc_ohc=GQgyjO1APLAAX_Zj4I_&_nc_ht=scontent.fblq3-1.fna&oh=f6c602b04fc4a7ede475342b3f22b595&oe=5EE8C14E
						if ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a image') && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a image').length>0 && $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a image').attr('xlink:href').length>0 && ($(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a image').attr('xlink:href').indexOf('605120512_n.jpg')>-1 || $(inputs[i]).closest('div[data-visualcompletion="ignore-dynamic"]').find('a image').attr('xlink:href').indexOf('2059008_n.jpg')>-1)){
							found=1;
							console.log('User ignored because he doesn\'t have profile image 3!');
						}
					}
					
					if (found==0){
						inputs[i].click();
						//console.log ('TRY TO INVITE1');
						
						// 20190419 - new, test if it is not limited!
						clearTimeout(_timeCheckLimit);
						_timeCheckLimit=setTimeout(function(){checkLimitationPopup()},2000);
						
						timeout=Math.floor(Math.random() * (p1_2 - p1_1 + 1)) + p1_1;
						
						loopTimerDelay=setTimeout(function(){
							// check if button was pressed after 2 sec
							if (!fbInviteBtnArray[usedFbLang]['inv'].includes($(inputs[i]).text()) && (fbInviteBtnArray[usedFbLang]['inv2'].includes($(inputs[i]).text()) || ($(inputs[i]).attr('aria-disabled') && $(inputs[i]).attr('aria-disabled')!="true"))){
								// Invite button IS not present and INVITED button is present OR button has aria-disabled == "true"
								// means everything is OK!
								
									//console.log("test 11:"+$(inputs[i]).closest("body").length);
									//console.log("test 22:"+$(inputs[i]).is(":visible"));
									
								mtotalInvited++;
								
								fb_lim_this_page_counter++;
								normal_run_limitNoInvitePosts=-1;
								hadInvitedButton++;
								loadsWithNoInvite=0;
								i++;
								timeout=timeout-2000;
								
								addText='';
								
								if (mtotalInvited % 40 === 0 && (mtotalInvited+c_c1)!=fb_limit && additional_script_pause){
									timeout=30000;
									addText='\r' + api.i18n.getMessage("paused");
								}
								if (timeout<10)
									loopTimerDelay=setTimeout(function(){inviteNextNewUI(i,inputs,useTab)}, randTwoNumbers(10,120));
								else{
									loopTimerDelay=setTimeout(function(){inviteNextNewUI(i,inputs,useTab)}, timeout);
								}
								updatePopup(addText);
							}else{
								// button WAS NOT PRESSED!
								inviteFailed++;
								if (inviteFailed==1){
									// try again with the same element in 10 sec
									loopTimerDelay=setTimeout(function(){inviteNextNewUI(i,inputs,useTab)}, 10000);
								}else if (inviteFailed==2){
									// go to the next element but not count this as invited
									i++;
									loopTimerDelay=setTimeout(function(){inviteNextNewUI(i,inputs,useTab)}, 5000);
								}else{
									// 20201105 - if we cannot click, let's check, maybe the list was closed? Then just go to the next step!
									// $(inputs[i])
									//console.log("test 1:"+$(inputs[i]).closest("body").length);
									//console.log("test 2:"+$(inputs[i]).is(":visible"));
									if (!$(inputs[i]).is(":visible")){
										if (debug) {console.log("GO TO NEXT Here 21");}
										setTimeout(function(){ClosePostAndOpenNext(useTab)},20);
									}else
										stopScript("After 3 attempts to press 'INVITE' button it wasn't accepted by the server. Maybe you reach the daily limit or has a temporary limitation or there is some lag. Try to click manually or wait 24h. If you can invite manually - contact us via email (take a full screen of this page and copy the version of the script.<br>");
								}
							}
						}, 2000);
					}else if (found==1){
						i++;
						setTimeout(function(){inviteNextNewUI(i,inputs,useTab)},randTwoNumbers(20,150));
					}
				}
			}else{
				i++;
				setTimeout(function(){inviteNextNewUI(i,inputs,useTab)},randTwoNumbers(20,150));
			}
		}
	}else{
		//250200918 scroll to last elem?
		if (newFBinviteDesign && getElem(scrollingNewFBDesignClass).length>0){
			uiMorePagerPrimary++;
			updatePopup();
			getScrollElemNewFb(scrollingNewFBDesignClass).scrollTop(52*i-220);
		}else if (newFBinviteDesign && getElem(scrollingNewFBDesignClassDef).length>0){
			uiMorePagerPrimary++;
			updatePopup();
			getScrollElemNewFb(scrollingNewFBDesignClassDef).scrollTop(52*i-220);
		}
		setTimeout(function(){InvitePeople2(useTab)}, Math.floor(Math.random() * (700 - 200 + 1)) + 200);
	}
}
}
// end new invite








function updatePopup(addMessage,loopShow){
if (scriptIsRunning==1){
if (typeof addMessage === 'undefined') { addMessage = ''; }
if (uiMorePagerPrimary>0){
	if (newFBinviteDesign){
		if (scanByNameNewUI){
			if (scan_reactions_tabs)
				addMessage=". Reactions scanned (separate list): " + likeButtonsElaborated + addMessage;
			else
				addMessage=". Reactions scanned: " + likeButtonsElaborated + addMessage;
		}else
			addMessage=". List was scrolled: " + uiMorePagerPrimary + addMessage;
	}else
		addMessage=". ’See more’ button clicked: " + uiMorePagerPrimary + addMessage;
}

if (antiSpamCommentSkipped>0)
	addMessage=". NOT commented (antispam): " + antiSpamCommentSkipped + addMessage;
if (total_shared_posts_liked>0 || total_shared_posts_commented>0){
	addMessage=". Shared posts/comments liked: " + total_shared_posts_liked + ". Shared posts commented: " + total_shared_posts_commented + addMessage;
		
}
PagesCheckedText="";
if ((runMode==3 || runMode==4) && nextPage>0){
	if (multi_random_order)
		PagesCheckedText=". Page: " + nextPage + " (random order)";
	else{
		PagesCheckedText=". " + api.i18n.getMessage("pages_checked") + " " + nextPage + " / ";
		if (runMode==3)
			PagesCheckedText=PagesCheckedText+urllist1.length;
		else
			PagesCheckedText=PagesCheckedText+urllist2.length;
	}
}
if (loop_PostsListArray.length>0 && totalPostsElaborated > loop_PostsListArray.length && loopShow){
	document.getElementById("invite-all-count-sw").innerHTML=mtotalInvited + PagesCheckedText + addMessage;
}else if (publishingToolInv && !photosTabRunAll && !InsightsTabInv && !isNotificationTab){
	if (window.location.href.indexOf("/creatorstudio")>0){
		if (runMode==2 || runMode==4)
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in Creator Studio: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
		else
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in Creator Studio: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
	}else if (window.location.href.indexOf("/content_management")>0){
		if (runMode==2 || runMode==4)
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in Content Management: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
		else
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in Content Management: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
	}else if (window.location.href.indexOf("/latest/posts")>0){
		if (runMode==2 || runMode==4)
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in Business Suite: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
		else
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in Business Suite: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
	}else if (window.location.href.indexOf("/publishing_tools")>0 && getElem('._68tl ._2eqm._3qn7._61-1._2fyi._3qng','.hidden_elem ._68tl ._2eqm._3qn7._61-1._2fyi._3qng').length>0){
		if (runMode==2 || runMode==4)
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in new Publishing Tools tab: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
		else
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. Scrolls in new Publishing Tools tab: ' + (publishingTabNumber-1) + PagesCheckedText + addMessage;
	}else{
		if (publishingToolTotPost>0){
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + ' (' + publishingToolTotPost + '). ' + api.i18n.getMessage("publ_check_tab") + ' ' + publishingTabNumber + PagesCheckedText + addMessage;
		}else{
			document.getElementById("invite-all-count-sw").innerHTML=((skip_Invite == true && !inviteDuringShareCheck && !inviteDuringShareCheck2) ? '<span style="color:red">DISABLED in options</span>' : mtotalInvited) + '. ' + api.i18n.getMessage("publ_check_tab") + ' ' + publishingTabNumber + PagesCheckedText + addMessage;
		}
	}
}else{
	document.getElementById("invite-all-count-sw").innerHTML=mtotalInvited + PagesCheckedText + addMessage;
}
}
}
	
function createPopup(){
var newAnnounce="";
if (psscr!="fp" && Math.floor(Math.random()*(100-0+1)+0)>40 && (TotalInvited>100 || mtotalInvited>100)) // || 1==1 //ыыы
	newAnnounce="<br><span style='color:red;'>Other script: <b>AUTO-REPLY on all comments, like and send private messages to everyone who comments</b>!</span> With filters and anti-spam feature.<br>Find more on the website (you can <b>upgrade to FULL PACK): <a href=\"https://www.invitelikecomment.com\" target='_blank'>www.invitelikecomment.com</a></b><br><br>";
var additionalInfoShow='';
if (psscr=="fp" || Math.floor(Math.random()*(100-0+1)+0)>40)
	additionalInfoShow='<span style="font-size:0.7em!important;">' + api.i18n.getMessage("switch_tab_info") + '</span><br>';
else
	additionalInfoShow='<div id="running-info">'+ api.i18n.getMessage("inviting_everyone") + '<br>' +newAnnounce+'</div><span style="font-size:0.7em!important;">' + api.i18n.getMessage("switch_tab_info") + '</span><br>';
if (TotalInvited>100) //ыыТЕСТ ДОБАВИТЬ ЩАС НА ВРЕМЯ +  && 1==2 ниже добавил!
	additionalInfoShow=additionalInfoShow + '<div id="fbe-showlessingo" class="btn-div"></div>';
if (showLessInfoDate>0 && Math.floor(Date.now() / 1000)-showLessInfoDate < 604800) // если прошло меньше НЕДЕЛИ - то мы не показываем ничего. 2600000 - мес было.
	additionalInfoShow='<span style="font-size:0.7em!important;">' + api.i18n.getMessage("switch_tab_info") + '</span><br>';
elementUpd=document.getElementsByTagName("head")[0];var t=document.getElementsByTagName("body")[0];var n=document.createElement("div");n.setAttribute("id","add-all-div-sw");n.setAttribute("style",'text-align:center;font-family:"lucida grande",tahoma,verdana,arial,sans-serif;padding:10px;width:80%;border:2px solid #ccc;background-color:#fff;position:fixed;margin:0 auto;z-index:999;top: 5px;left:10%;font-size:2em;');n.innerHTML="<link rel='stylesheet' type='text/css' href='"+api.runtime.getURL('content.css')+"' charset='utf-8'><span style='color:blue'>" + runModetext + "</span><br>" + 'Invited (this post):' +' <span id="invite-all-count-sw">' + mtotalInvited + '</span>.<br>'+additionalInfoShow+'<div id="fbe-stopit" class="btn-div"></div><div id="fbe-next-post"></div>';t.appendChild(n);popup=n;

if ($('#fbe-showlessingo').length>0){
	var $input = $('<div class="fbe-btn"><span class="fbe-btn-text">Show only main info</span></div>').click(showLessInfoRunning);
	jQuery("#fbe-showlessingo").html($input);
}
var $input = $('<div class="fbe-btn"><span class="fbe-btn-text">STOP IT</span></div>').click(stopScript);
jQuery("#fbe-stopit").html($input);

//$input = $('<div class="fbe-btn"><span class="fbe-btn-text">Go to next post</span></div>').click(goToNextPost);
//jQuery("#fbe-next-post").html($input);

// create unvisible div for comments if not created yet:
if (getElem('#invite-shared-elem-comment').length==0){
	var m=document.createElement("div");
	m.setAttribute("id","invite-shared-elem-comment");
	m.setAttribute("style",'display:none;');
	t.appendChild(m);
}
elementUpdCommentText=document.getElementById("invite-shared-elem-comment");
}

function showLessInfoRunning(){
// save to google
api.storage.sync.set({
	//ignoreInviteString: ignoreInviteString
	showLessInfoDate: Math.floor(Date.now() / 1000).toString()
	}, function() {
		// hide all additional info
		$('#fbe-showlessingo').hide();
		$('#running-info').hide();
});
}

function destroyPopup(){
//console.log('destroyPopup');
if (popup && popup.parentElement)
	popup.parentElement.removeChild(popup);
scriptIsRunning=0;
}

function stopScript(addMessage){
	goBackToMainTab(1);
}
function goToNextPost(){
// close all windows, reset all variables and go to the next post
sharedPostIsCheckingNow=1;
if (debug) {console.log("GO TO NEXT Here 22");}
ClosePostAndOpenNext(-1);
// doesn't work because I don't know how to stop InviteNext function, I have to reset all timers there.
}







function checkLimitationPopup(){
if (scriptIsRunning==1){
if (getElem('._pig').length>0 && getElem('._4t2a,.uiLayer').is(':visible')){
	_elsHelpCont = getElem('._pig');
	for(var m = 0; m < _elsHelpCont.length; m++){
	  if(_elsHelpCont[m].innerHTML.indexOf('/help/contact/') > -1){
		if ((runMode==3 || runMode==4) && try_after_limit){
			scriptIsRunning=0;
			if (debug){console.log("next page 23");}
			open_next_page();
		}else{
			scriptIsRunning=0;
			console.log("LIMIT REACHED error shown!");
			stopScript(api.i18n.getMessage("facebook_limit_block")+'<br>',true);
		}
	  }
	}
	
}else if (getElem('div[role="dialog"]').length>0 && getElem('div[role="dialog"]').text() && getElem('div[role="dialog"]').text().length>1 && (getElem('div[role="dialog"]').text().indexOf('misusing this feature by going too fast')>0 || getElem('div[role="dialog"]').text().indexOf('misbruikt omdat je de functie te vaak gebruikt')>0)){ // 20210213 - in the new Facebook we try to get the limitation popup by language. See email info@erikmolenaar.nl
	if ((runMode==3 || runMode==4) && try_after_limit){
		scriptIsRunning=0;
		if (debug){console.log("next page 23");}
		open_next_page();
	}else{
		scriptIsRunning=0;
		console.log("LIMIT REACHED error shown!");
		stopScript(api.i18n.getMessage("inv_limit_error"),true);
	}
}

if (checkNewLimitPopupInClassicDesign() && scriptIsRunning==1){
	if ((runMode==3 || runMode==4) && try_after_limit){
		scriptIsRunning=0;
		if (debug){console.log("next page 24");}
		open_next_page();
	}else{
		scriptIsRunning=0;
		console.log("LIMIT REACHED error shown!");
		stopScript(api.i18n.getMessage("facebook_limit_block")+'<br>',true);
	}
}

}
}
function checkLimitationPopup2(){
if (scriptIsRunning==1){
if (getElem('._pig').length>0 && getElem('._4t2a,.uiLayer').is(':visible')){
	_elsHelpCont = getElem('._pig');
	for(var m = 0; m < _elsHelpCont.length; m++){
	  if(_elsHelpCont[m].innerHTML.indexOf('/help/contact/') > -1){
		return true;
	  }
	}
}

if (checkNewLimitPopupInClassicDesign()){
	return true;
}

}
return false;
}
function checkNewLimitPopupInClassicDesign(){ //20200702 - artur.makowka@gmail.com
	// we need to detect a new popup!
	if (getElem('._4t2a ._61mx .cqf1kptm').length>0 && getElem('._4t2a ._61mx ._4iyi button').length>1 && getElem('._4t2a ._61mx .cqf1kptm').is(':visible'))
		return true;
	else
		return false;
}

function randTwoNumbers(a1,a2){
	if (a1==a2)
		return a1;
	else if (a1>a2)
		return Math.floor(Math.random() * (a1 - a2 + 1)) + a2;
	else
		return Math.floor(Math.random() * (a2 - a1 + 1)) + a1;
}

function inviteWindowInNewUIOpen(){
if (isThisNewFbDesign2020()){
	if (getElem('.cypi58rs .oajrlxb2','.poy2od1o .cypi58rs .oajrlxb2').length>0) // .poy2od1o чтобы исключить кнопку "чата" справа снизу
		return true;
	else if(getElem('div').filter(function(){return ($(this).attr('aria-label')=='Reactions')}).length>0){
		if (getElem('div').filter(function(){return ($(this).attr('aria-label')=='Reactions')}).find('div').filter(function(){return ($(this).attr('aria-label')=='Close')}).length>0){
			return true;
			//getElem('div').filter(function(){return ($(this).attr('aria-label')=='Reactions')}).find('div').filter(function(){return ($(this).attr('aria-label')=='Close')})
		}
	}
}
return false;
}

function closeInviteWindowInNewUI(){
if (isThisNewFbDesign2020()){
	//console.log("QQQQ close invite window");
	if (getNewUIMainScrollOnly('div[role="dialog"] .cypi58rs .thwo4zme').not('div.fbNubFlyout[role="dialog"] div,.uiLayer._31e div[role="dialog"] div').length==1)
		getNewUIMainScrollOnly('div[role="dialog"] .cypi58rs .thwo4zme').not('div.fbNubFlyout[role="dialog"] div,.uiLayer._31e div[role="dialog"] div')[0].click();
	else if (getElem('.cypi58rs .oajrlxb2','.poy2od1o .cypi58rs .oajrlxb2').length>0) // .poy2od1o чтобы исключить кнопку "чата" справа снизу
		getElem('.cypi58rs .oajrlxb2','.poy2od1o .cypi58rs .oajrlxb2')[0].click();
	else if(getElem('div').filter(function(){return ($(this).attr('aria-label')=='Reactions')}).length>0){
		if (getElem('div').filter(function(){return ($(this).attr('aria-label')=='Reactions')}).find('div').filter(function(){return ($(this).attr('aria-label')=='Close')}).length>0){
			getElem('div').filter(function(){return ($(this).attr('aria-label')=='Reactions')}).find('div').filter(function(){return ($(this).attr('aria-label')=='Close')})[0].click();
		}
	}
}
}

function getNewUIMainScrollOnly(newclass){
return getElem(newclass).not('div.fbNubFlyout[role="dialog"] div,.uiLayer._31e div[role="dialog"] div').filter(function () {
	//var outerThis = this;
	var ret=true;
	$(this).parents('div').each(function() {
		if ($(this).attr('aria-hidden') && $(this).attr('aria-hidden')=='true'){
			ret=false;
		}
    });
	//if (ret){
		// verify also we don't have scroll inside scroll
	//	if ($(outerThis).parents(newclass).length!=0){
	//		ret=false;
	//	}
	//}
	return ret;
});
}
function getScrollElemNewFb(newclass){
if (getNewUIMainScrollOnly(newclass).length>0)
	return getNewUIMainScrollOnly(newclass);
else
	return getElem(newclass);
}





function goBackToMainTab(_stop){
	api.runtime.sendMessage({ type: 'separateScanFinished', inv: mtotalInvited, lik: total_shared_posts_liked, com: total_shared_posts_commented, stop:_stop }, function(response) {});
}


var listenerInit;
if (listenerInit)
	FileAlreadyLoadedThisIsNOTerror();
listenerInit=true;


api.runtime.onMessage.addListener(
function(request, sender) {
	if (request.type=="weNeedToStop")
		goBackToMainTab(1);
});