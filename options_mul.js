var api = typeof chrome!="undefined" ? chrome : browser;
var maxPages=200;
var do_not_check_who_comments;
var do_not_check_who_comments2;

// ... (existing urlCode, urlDeCode, checkSpintaxFormatOk, showHideImgInfo1 functions remain) ...

// Saves options to api.storage
function save_options() {
  // ... (existing variable declarations for p1_1, p1_2, fb_timeout_1, etc.) ...
  
  // Add new variables for comment actions
  var like_comments = document.getElementById('like_comments').checked;
  var invite_comment_likers = document.getElementById('invite_comment_likers').checked;
  // Add variables for group tools here once defined


  var ok=checkSpintaxFormatOk();
  var status1 = document.getElementById('status1');
  status1.textContent = '';


  var status = document.getElementById('status');

  if (p1_1>p1_2){
    var tttemp=p1_1;
    p1_1=p1_2;
    p1_2=tttemp;
  }
  if (pc_1>pc_2){
    var tttemp=pc_1;
    pc_1=pc_2;
    pc_2=tttemp;
  }

  // ... (existing URL saving logic) ...

  if (ok==1){
    if (p1_1<1.5)
      alert("Advice: set the minimum timeout to 2 sec (or higher), otherwise fb can disable this feature for a day.");

    api.storage.sync.set({
      // ... (existing options to save) ...
      
      // Add new options to save
      like_comments: like_comments,
      invite_comment_likers: invite_comment_likers
      // Add group tool options here
    }, function() {
      var error = api.runtime.lastError;
      if (error && error.message && maxPages>20 && (urllist1.length>20 || urllist2.length>20)){
          if (maxPages==200)
              alert(error.message+". You have too many pages, we will trim the list a little. We can save 8192 symbols due to browser limitation.");
          maxPages=maxPages-5;
          save_options();
      }else{
          var status = document.getElementById('status');
          status.textContent = 'Options saved. Reopen Facebook now.';
          setTimeout(function() {
            status.textContent = '';
          }, 4750);
      }
    });

  // ... (existing URL restore logic) ...
  }
}

// Restores select box and checkbox state using the preferences
function restore_options() {
  api.storage.sync.get({
    // ... (existing default values) ...
    
    // Add default values for new options
    like_comments: false,
    invite_comment_likers: false
    // Add default values for group tools here
  }, function(items) {
    // ... (existing document.getElementById assignments) ...
    
    // Assign values to new UI elements
    document.getElementById('like_comments').checked = items.like_comments;
    document.getElementById('invite_comment_likers').checked = items.invite_comment_likers;
    // Assign values for group tools here

    // ... (remaining restore logic) ...
  });
}

function reset_options(){
  // ... (existing reset logic) ...

  // Reset new options
  document.getElementById('like_comments').checked = false;
  document.getElementById('invite_comment_likers').checked = false;
  // Reset group tool options here

  save_options();
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('reset').addEventListener('click', reset_options);
document.getElementById('imgInfoShow1').addEventListener('click', showHideImgInfo1);

// ... (existing codeAddress and refreshOptionPersNameIgnore functions remain) ...