function parseJSONAndUpdateDOM(result) {
  $("#first_name").text(result['first_name']);
  $("#last_name").text(result['last_name']);
  
}