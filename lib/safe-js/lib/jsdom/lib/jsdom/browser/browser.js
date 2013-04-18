define(
    ["./index", "./documentfeatures", "./domtohtml", "./htmlencoding", "./htmltodom" ], 
    function(index, documentfeatures, domtohtml, htmlencoding, htmltodom ){
        return {
            index: index, 
            documentfeatures: documentfeatures, 
            domtohtml: domtohtml, 
            htmlencoding: htmlencoding, 
            htmltodom: htmltodom 
        };   
    })
