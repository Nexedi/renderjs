/*globals window, document, $, html_beautify, FileReader */
/*jslint unparam: true */
$(function () {
  "use strict";

  var presentation = null,
    slideForm,
    newSlideButton = $('#add-slide'),
    formPanel = $('#form-panel');

  formPanel.panel({ beforeclose: function () {
    newSlideButton.show();
    slideForm.reset();
  }});
  
  function openForm() {
    formPanel.panel("open");
    newSlideButton.hide();
  }

  function closeForm() {
    formPanel.panel("close");
  }
  
  function Slide(params) {
    var that = this;
    this.html = document.importNode(this.htmlTemplate, true);
    if (params.section) {
      this.update({
        title: params.section.querySelector('h1').textContent || "",
        type: params.section.className || "",
        content:
          params
          .section
          .childNodes[2] ? (params.section.childNodes[2].textContent || "") : ""
      });
    } else {
      this.update(params);
    }
    $(this.editBtn()).click(function () {
      slideForm.bindToEdit(that);
      openForm();
    });
    $(this.deleteBtn()).click(function () {
      presentation.deleteSlide(that);
    });
  }

  Slide.prototype = {

    dataTemplate: document.querySelector('template#slide-data').content.firstElementChild,
    htmlTemplate: document.querySelector('template#slide-html').content.firstElementChild,

    editBtn: function () {return this.html.querySelector("button.edit");},
    deleteBtn: function () {return this.html.querySelector("button.delete");},
    htmlContent: function () {return this.html.querySelector(".content");},
    htmlImage: function () {return this.html.querySelector("img");},
    htmlTitle: function () {return this.html.querySelector("h1");},

    data: function () {
      var res = document.importNode(this.dataTemplate, true);
      res.className = this.type;
      res.querySelector('h1').textContent = this.title;
      res.appendChild(document.createTextNode(this.content));
      return res;
    },

    update: function (params) {
      console.log(params);
      $.extend(this, params);
      this.htmlTitle().textContent = this.title;
      this.htmlContent().innerHTML = this.content;
      if (this.type === "screenshot" || this.type === "illustration") {
        this.htmlImage().src = this.image;
      }else{
        this.htmlImage().src= "";
      }
    }
  };
  
  function SlideForm() {
    var that = this;
    this.elt = document.querySelector("#slide-form");
    this.bindToAdd();
    $(this.elt).find("#cancel").click(closeForm);
    $(this.elt).find('input[type="radio"]').click(function () {
      that.updateFieldVisibility();
    });
    $(this.elt).find('#image-input').change(function (evt) {
      var file = evt.target.files[0];
      console.log(file);
      if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          console.log(e.target);
          that.attrImageFile(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  SlideForm.prototype = {

    attrTextInput: function (inputElt, content) {
      if (content !== undefined) {
        inputElt.value = content;
      }else{
        return inputElt.value;
      }
    },
    
    attrTitle: function(content) {
      return this.attrTextInput(this.elt.querySelector('#title'), content);
    },
    
    attrContent: function(content) {
      return this.attrTextInput(this.elt.querySelector('#content'), content);
    },
    
    attrDetails: function(content) {
      return this.attrTextInput(this.elt.querySelector('#details'), content);
    },

    attrType: function(type) {
      var radios = $(this.elt).find('input[type="radio"]');
      if (type !== undefined) {
        radios.prop('checked', false);
        if (type === "") {type = "basic";}
        radios.filter("#"+type+"-type").prop('checked', true);
        radios.checkboxradio('refresh');
        this.updateFieldVisibility();
      }else{
        return radios.filter(':checked').val();
      }
    },

    attrImageFile: function (imageFile) {
      var input = this.elt.querySelector('#image-input');
      var preview = this.elt.querySelector('#image-preview');
      if (imageFile !== undefined) {
        input.value = "";
        preview.src = imageFile;
      }else{
        return preview.src;
      }
    },
    
    attrAll: function (slide) {
      if (slide !== undefined) {
        this.attrTitle(slide.title);
        this.attrType(slide.type);
        this.attrContent(slide.content);
        this.attrDetails(slide.details);
        this.attrImageFile(slide.image);
      }else{
        return {
          title: this.attrTitle(),
          type: this.attrType(),
          content: this.attrContent(),
          details: this.attrDetails(),
          image: this.attrImageFile()
        };
      }
    },

    updateFieldVisibility: function () {
      var type = this.attrType();
      if (type === "screenshot" || type === "illustration") {
        $(this.elt).find('#image-field').show("blind", {direction: "up"});
      }else{
        $(this.elt).find('#image-field').hide("blind", {direction: "up"});
      }
    },
    
    setSubmitLabel: function (label) {
      var submit = $(this.elt).find("#submit");
      submit.prop("value", label).button('refresh');
    },
    
    reset: function () {
      this.attrAll({title: "", type: "basic", content: "", details: "", image: ""}); 
    },
    
    bindToEdit: function (slide) {
      var that = this;
      that.currentSlide = slide;
      $(this.elt).off();
      this.attrAll(slide);
      $(this.elt).submit(function (e) {
        slide.update(that.attrAll());
        e.preventDefault();
        that.currentSlide = null;
        slideForm.bindToAdd();
      });
      this.setSubmitLabel("Save");
    },

    bindToAdd: function () {
      var that = this;
      $(this.elt).off();
      this.reset();
      $(this.elt).submit(function (e) {
        presentation.addSlide(new Slide(that.attrAll()));
        that.reset();
        e.preventDefault();
      });
      this.setSubmitLabel("Add");
    }
  };

  function Presentation(DOMElement) {
    this.html = DOMElement;
    slideForm = new SlideForm();
    this.slides = [];
    $("#add-slide").click(openForm);
    $(this.html).sortable({
      update: function (event, ui) {
        presentation.updateOrder(ui.item);
      }
    });
  }

  Presentation.prototype = {

    addSlide: function (slide) {
      this.slides.push(slide);
      this.html.appendChild(slide.html);
      return slide;
    },

    deleteSlide: function (slide) {
      if (slideForm.currentSlide === slide) {
        slideForm.bindToAdd();
      }
      var index = this.slides.indexOf(slide);
      this.slides.splice(index,  1);
      slide.html.remove();
      return index;
    },

    updateOrder: function (DOMElement) {
      var newIndex = $(this.html.children).index(DOMElement),
        oldIndex,
        i,
        tmp;
      for (i = 0; i < this.slides.length; i++) {
        if (this.slides[i].html === DOMElement[0]) {
          oldIndex = i;
          break;
        }
      }
      tmp = this.slides.splice(oldIndex, 1)[0];
      this.slides.splice(newIndex, 0, tmp);
    },

    getContent: function () {
      var i, container = document.createElement('div');
      for (i = 0; i < this.slides.length; i++) {
        container.appendChild(this.slides[i].data());
      }
      return html_beautify(container.innerHTML);
    },

    setContent: function (content) {
      var i, sections, container = document.createElement('div');
      container.innerHTML = content;
      sections = container.children;
      for (i = 0; i < sections.length; i++) {
        this.addSlide(new Slide({section: sections[i]}));
      }
    }
  };

  $.fn.extend({
    presentation: function () {
      presentation = new Presentation(this[0]);
      window.prez = presentation;
      return presentation;
    }
  });

});
