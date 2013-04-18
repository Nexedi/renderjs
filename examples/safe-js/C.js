$("#C_test").html("hi C");

var gadget = RenderJs.GadgetIndex.getGadgetById('C');
gadget.whatsyourname = function() {
  return "Hey there, I'm C!";
};