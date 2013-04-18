$("#B_test").html("hi B");

getSelfGadget.whatsyourname = function() {
  return 'I am B';
}


communicate('A', 'whatsyourname', function(name) {
  console.log(name);
});