/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function () {
  /**
  * Web site configurations
  */
  var now,
  website_content = 
  [
        {
            "title": "Motto",
            "reference": "erp5-Kyorin.Success.Case",
            "language": "en",
            "version": "001",
            "created": now,
            "modified": now,
            "description": "A success story of Kyorin implementation of ERP5",
            "text_content": "<h2>Motto</h2><p><strong>Regive access to your code</strong></p>"
          },{
            "title": "Guidelines",
            "reference": "erp5-Tristans.document",
            "language": "en",
            "version": "001",
            "created": now,
            "modified": now,
            "description": "test stestestes",
            "text_content": '<h2>Free Web Application rules/guidelines</h2><p>see: <a href="http://www.gnu.org/philosophy/free-sw.en.html">Free Software Philosophy</a>.<ul><li>The freedom to run the application, for any purpose (freedom 0).</li><li>The freedom to study how the application works, and change it so it does your computing as you wish (freedom 1). Access to the source code is a precondition for this. (free web application should provide original code and a facility to compile it.)</li><li>The freedom to redistribute copies so you can help your neighbor (freedom 2).</li><li>The freedom to distribute copies of your modified versions to others (freedom 3). By doing this you can give the whole community a chance to benefit from your changes. Access to the source code is a precondition for this.</l></ul>'
          },{
            "title": "Freedom Button",
            "reference": "erp5-Kyorin.Success.FB",
            "language": "en",
            "version": "001",
            "created": now,
            "modified": now,
            "description": "A success story of Kyorin implementation of ERP5",
            "text_content": "<h2>Freedom Button</h2><p>Free web is at the reach of a button: the freedom button displayed on your page. With just a click, users start to browse and modify the code.</p>"
          },{
            "title": "Education",
            "reference": "erp5-Kyorin.Success.edu",
            "language": "en",
            "version": "001",
            "created": now,
            "modified": now,
            "description": "A success story of Kyorin implementation of ERP5",
            "text_content": "<h2>Free Web is for Education</h2><p>Computer science have never been this easy to practice. The only thing you need is a browser. Let's offer people a opportunity to learn how tools they uses everyday are make.</p><p>Free Web offer the opportunity for user to easily modify the way they are using the web. It facilitates the development of a web application because the user only need a browser to create it. He can easily ask for help because its code is available to everyone. You can also learn by modify and tweaking around an existing application. Further more, languages used in Web application are standard, to learn how to do basic applications you just need to learn 3 basic technologies: JavaScript, html and css.Doing so we offer a direct development tool without any installation. Only the code stays. We can reach people more easily. A MooC only cost its development and in then available to everyone for free, ready for modification and community improvement.We this, we can reach people that could not be reached before: women, children, elders... We can teach them and ask them to do the tools they will be using on the web. Computer science and the Web have been developed by scientists, developers and entrepreneurs, it is time for users to have a word because this amazing tool is for them.</p>"
          }
  ],  
  configuration, cache = {},
  /*jio_config = {
                      "type": "index",
                      "indices": [{
                        "id": "id.json",
                        "index": ["_id", "type", "reference", "modified",
                                  "title", "description",
                                  "text_content"],
                        "title": "Index the ID",
                        "attachment": "index.json"},
                      ],
                      "sub_storage": {
                        "type": "dropbox",
                        "bucket": "yourtasks",
                        "access_key": "-ZKzQmTR8MRh0UEIE-a7Sc-GlD2Rd2tHCEweqKzP",
                        "secret_key": "LUKfbUtFSc_L8Ix8ZRrwEJfC6PgJbJiRWqpnz-kg"
                      }
  },
  jio_config = {
      "type": "local",
      "username": "Nexedi SA",
      "application_name": "Live Website Demo"
    },
  jio_config = {
                      "type": "index",
                      "indices": [{
                        "id": "id.json",
                        "index": ["_id", "type", "reference", "modified",
                                  "title", "description",
                                  "text_content"],
                        "title": "Index the ID",
                        "attachment": "index.json"},
                      ],
                      "sub_storage": {
                        "type": "dropbox",
                        "access_token": "v43SQLCEoi8AAAAAAAAAAVixCoMfDelgGj3NRPfEnqscAuNGp2LhoS8-GiAaDD4C"
                      }
  },*/
  jio_config = {
                        "type": "dropbox",
                        "access_token": "v43SQLCEoi8AAAAAAAAAAVixCoMfDelgGj3NRPfEnqscAuNGp2LhoS8-GiAaDD4C"
  },
  repository = jIO.createJIO(jio_config)
  ,website_emitter = new events.EventEmitter(), place, cache;
  /**
  * allow users to bind listeners to websites event
  * TODO need to export website_emitter to window!
  */
  place = {
    "index": {
      "dom": document.querySelector("#index")
    },
    "content": {
      "dom": document.querySelector("#content")
    }
  };
  /**
  * SHOULD BE USED FOR TEST ONLY
  * Creates and fill the page repository
  * @return A promise
  */
  var addSomePageIntoLocalStorageIfNecessary = function () {
    /*Empty local storage before filling it*/
    //window.localStorage.clear();
    //window.sessionStorage.clear();
    console.log("filling");
    for (i = 0; i < website_content.length -1; i += 1) {
          repository.post(website_content[i]);
      }
    console.log('almost')
    return repository.post(website_content[website_content.length -1])
  };
  /**
  * Retrieve the list of web pages
  */
  var getPageList = function () {
    return repository.allDocs({"include_docs": true})
    .then(function (answer) {
     return answer;
    })
  };
  var loadAndDisplayIndexView = function () {
    getPageList()
    .then(function (response) {
      // on index success
      var i, length, rows, row, page_list_html = "<ul>";
      rows = response.data.rows;
      length = rows.length;
      for (i = 0; i < length; i += 1) {
        page_list_html += "<li><a href=\"#" + rows[i].doc.title.replace(/"/g, "\\\"") +
          "\">" + rows[i].doc.title + "</a></li>";
      }
      page_list_html += "</ul>";
      place.index.dom.innerHTML = page_list_html;
    })
  };
  var loadAndDisplayContentPage = function (page_title) {
    getPageList()
    .then(function (response) {
      // on page list response
      var i, rows = response.data.rows, length = rows.length;
      for (i = 0; i < length; i += 1) {
        if (rows[i].doc.title === page_title) {
          // show page
          place.content.dom.innerHTML = rows[i].doc.text_content;
          return;
        }
      }
      place.content.dom.innerHTML = "<p>404</p>";
    })
  },

  /**
  * Run the web site runtime
  */
  runWebSite = function () {
    console.log('run');
    window.addEventListener("hashchange", function () {
      loadAndDisplayContentPage(location.hash.slice(1));
    });
    console.log('Index')
    loadAndDisplayIndexView();
    if (location.hash) {
      loadAndDisplayContentPage(location.hash.slice(1));
    }
  };
  /*addSomePageIntoLocalStorageIfNecessary().then(runWebSite, console.error);}());*/
  runWebSite();}());