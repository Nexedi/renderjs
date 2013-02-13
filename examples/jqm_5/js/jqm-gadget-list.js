var gadget_call3 = function() {
  console.log("gadget_call3 registered");
};
var gadget_call4 = function() {
  console.log("gadget_call4 registered");
}
// trigger
$(document).on('click','ol li',function(e) {
  e.preventDefault();
  if ($(this).data("bound")) {
    return;
  }
  $(this).data("bound",true);
  console.log("clicked on listitem, now trigger g3");
  RenderJs.GadgetIndex.getGadgetById('g3').gadget_call3();
});