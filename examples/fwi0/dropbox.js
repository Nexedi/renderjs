(function () {
  var token, 
  dropbox_base_url = 'https://www.dropbox.com/1/',
  auth_path = 'oauth2/authorize',
  auth_data = new FormData(),
  response_type = 'token',
  client_id = 'ritua5xbw67jksr',
  redirect_uri = 'https://softinst48446.host.vifib.net/redirect.html',
  get_variable = {};
  auth_data.append("response_type", "token");
  auth_data.append("client_id", "ritua5xbw67jksr");
  auth_data.append("redirect_uri", "http://softinst48446.host.vifib.net/redirect.html");
  console.log(auth_data);
  console.log('lkvrblvblhbvebhbhvrbhjerbvhb')
  document.getElementById('dropbox_login').setAttribute('href', dropbox_base_url + auth_path +
                          '?response_type=' + response_type + 
                          '&client_id=' + client_id +
                          '&redirect_uri=' + redirect_uri);
  if (window.location.hash.length > 1) {
    for (var aItKey, nKeyId = 0, aCouples = window.location.hash.slice(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
      aItKey = aCouples[nKeyId].split("=");
      get_variable[unescape(aItKey[0])] = aItKey.length > 1 ? unescape(aItKey[1]) : "";
    }
  };
  console.log(get_variable.access_token);
}());
