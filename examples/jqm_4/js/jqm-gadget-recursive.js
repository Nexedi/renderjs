var gadget_call2 = function() {
  console.log("gadget_call2 registered");
};
var gadget_call4 = function() {
  console.log("gadget_call4 registered");
}
console.log("hello");
var btns = $('#clickediclick');

btns
  .filter(function() { return $(this).data("bound") !== true; })
  .data('bound', true )
  .on('click', function() {
    console.log("clicked button");
    RenderJs.GadgetIndex.getGadgetById('g1').gadget_call1();
  });
