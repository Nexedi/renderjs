var gadget_call1 = function() {
  console.log("gadget_call1 registered");
};
var gadget_call3 = function(p) {
  console.log("gadget_call3 registered, parem = "+p);
} 
// trigger
/*
$(document).on('click','#clickediclick',function() {
  console.log("click trigger");
  var g = RenderJs.GadgetIndex.getGadgetById('g1')
  g.gadget_call1();
});
*/