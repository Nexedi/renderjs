<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <title>plaintext</title>
  <script type="text/javascript" src="http://code.jquery.com/jquery-1.9.1.js"></script>
  <script type="text/javascript" src="../renderjs.js"></script>
</head>
<body>
  <table style="border: 1px solid black; font-size: 9px">
    <tr>
      <td colspan="2" style="text-align:center;"><b>plaintext.html</b></td>
    <tr>
      <td><b>Loaded</b></td>
      <td>Ajax (from addGadget())</td>
    </tr>
    <tr>
      <td><b>Location</b></td>
      <td>inside index.html</td>
    </tr>
    <tr>
      <td><b>Service</b></td>
      <td>None</td>
    </tr>
    <tr>
      <td><b>Domain</b></td>
      <td>same</td>
    </tr>
  </table>


  <p>We try to calculate!</p>
  <div>
    <input style="width: 20px;" type="number" value="2" name="a" id="a" />
    <input style="width: 20px;" type="number" value="2" name="b" id="b" />
    <input style="width: 50px;" type="number" value=""  name="c" id="c" /> 
    <button id="multiply">Multiply</button>
    <button id="subtract">Subtract</button>
  </div>
  <div data-gadget="gadgets/nestedplaintext.html"></div>
  <script type="text/javascript">

    $(this.document).find('button').on('click', function(e, target) {
      var options = {
        "service" : $(this).attr('id'),
        "parameters": [$('#a').val(), $('#b').val()]
      };

      // this is not perfect, because I cannot call $("button").requestService...
      renderJs.requestService(options, function (response) {
         $("#c").val(response);
        }
      );
    });
  </script>
</body>
</html>