/*globals window, document, $, html_beautify */
/*jslint unparam: true */
$(function () {
  "use strict";

  var presentation = null,
    slideForm,
    newSlideButton = $('#add-slide'),
    formPanel = $('#form-panel');

  formPanel.panel({ beforeclose: function () {
    newSlideButton.show();
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
    $(this.htmlEditButton()).click(function () {
      slideForm.bindToEdit(that);
      openForm();
    });
    $(this.htmlDeleteButton()).click(function () {
      presentation.deleteSlide(that);
    });
  }

  Slide.prototype = {

    dataTemplate: document.querySelector('template#slide-data').content.firstElementChild,
    htmlTemplate: document.querySelector('template#slide-html').content.firstElementChild,

    htmlEditButton: function () {
      return this.html.querySelector("button.edit");
    },

    htmlDeleteButton: function () {
      return this.html.querySelector("button.delete");
    },

    htmlContent: function () {
      return this.html.querySelector(".content");
    },

    htmlTitle: function () {
      return this.html.querySelector("h1");
    },

    data: function () {
      var res = document.importNode(this.dataTemplate, true);
      res.className = this.type;
      res.querySelector('h1').textContent = this.title;
      res.appendChild(document.createTextNode(this.content));
      return res;
    },

    update: function (params) {
      $.extend(this, params);
      this.htmlTitle().textContent = this.title;
      this.htmlContent().innerHTML = this.content;
    }
  };

  function SlideForm() {
    this.elt = document.querySelector("#slide-form");
    this.bindToAdd();
  }

  SlideForm.prototype = {

    reset: function () {
      this.elt.querySelector('#title').value = "";
      this.elt.querySelector('#type').value = "";
      this.elt.querySelector('#content').value = "";
    },

    bindToEdit: function (slide) {
      var that = this;
      $(this.elt).off();
      this.elt.querySelector('#title').value = slide.title;
      this.elt.querySelector('#type').value = slide.type;
      this.elt.querySelector('#content').value = slide.content;
      $(this.elt).submit(function (e) {
        slide.update({
          title: that.elt.querySelector('#title').value,
          type: that.elt.querySelector('#type').value,
          content: that.elt.querySelector('#content').value
        });
        e.preventDefault();
        slideForm.bindToAdd();
      });
    },

    bindToAdd: function () {
      var that = this;
      $(this.elt).off();
      this.reset();
      $(this.elt).submit(function (e) {
        presentation.addSlide(new Slide({
          title: that.elt.querySelector('#title').value,
          type: that.elt.querySelector('#type').value,
          content: that.elt.querySelector('#content').value
        }));
        this.reset();
        e.preventDefault();
      });
      $(this.elt).find("#cancel").click(closeForm);
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
