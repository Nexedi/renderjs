$("#A_test").html("hi A");

getSelfGadget().whatsyourname = function() {
  return 'I am A';
}

// ask gadget C which is not sandbox what it's name is
// as it's asynchronous provide a callback to get executed when
// result is know
communicate('C', 'whatsyourname', function(name) {
  console.log(name);
});