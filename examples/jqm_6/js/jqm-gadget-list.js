var gadget_call3 = function() {
  console.log("gadget_call3 registered");
};
var gadget_call4 = function() {
  console.log("gadget_call4 registered");
}
var gadget_call5 = function() {
  console.log("gadget_call5 registered");
}
var testevent_handler = function() {
  console.log("testevent handler triggered");
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

$(document).on('click','#dooo', function() {
  console.log("testevent triggered on click");
  $("#main-interactor2").trigger("testevent2");
  
});