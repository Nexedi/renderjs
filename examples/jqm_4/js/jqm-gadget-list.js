$(document).on('click','ol li a', function(e) {
  console.log("triggered click!!!");
  e.preventDefault();
  $('#slider-1').val($(e.target).jqmData('value')).slider("refresh");
});

var another_call = function (va) {
  alert(va);
};


// trigger
$(document).on('click','#clickediclick',function() {
  RenderJs.GadgetIndex.getGadgetById('jqm-gadget').gadget_call();
});