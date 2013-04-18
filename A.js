$("#A_test").html("hi A");
//$("#test_no").html("hi");

getSelfGadget().whatsyourname = function() {
  return 'I am A';
}

communicate('C', 'whatsyourname', function(name) {
  console.log(name);
});