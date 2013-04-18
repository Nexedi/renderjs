define(["./core", "../level2/html"], function(core, html) {

    var exports = {};

    core = core.dom.level3.core;
    html = html.dom.level2.html;

    exports.dom = {
        level3 : {
            html : html,
            core : core
        }
    };

    return exports;
})
