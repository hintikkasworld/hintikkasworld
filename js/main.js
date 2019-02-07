'use strict';

var M;



/*
function main() {
    compute();
    loop();
    window.requestAnimationFrame(loop);
}*/



$().ready(function() {
    
    loop();
//  window.requestAnimationFrame(main);
});





function showExamplesScreen() {
  $("#titlescreen").fadeOut();
  $("#mainscreen").fadeOut();
  $("#examplesscreen").fadeIn();
}


function showTitleScreen() {
  $("#titlescreen").show();
  $("#mainscreen").hide();
  $("#examplesscreen").hide();
}




$().ready(function()
{
    var urlParams = new URLSearchParams(window.location.search);
  let exampleToLoad = urlParams.get('example');

  if(exampleToLoad == null)
    showTitleScreen();
  else if(exampleToLoad == '?')
    showExamplesScreen();
  else
    setExample(exampleToLoad);
});


function showHelp() {
    window.open("about.html", "_target");
}
