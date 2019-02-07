/**
  @param agent : "a" or "b", "a" has a girl voice and "b" has a man voice
  @param text: text to say
  @returns it performs a speech synthesis of the text text (in english)
*/
function speak(agent, text) {
  if('speechSynthesis' in window){
    var speech = new SpeechSynthesisUtterance(text);
    speech.rate = 0.7;
    if(agent == "a")
        speech.pitch = 3.5;
    else if (agent == "b") {
      speech.pitch = 0.5;
    }
    else if (agent == "ab" ){
        speech.pitch = 2;

    }
    speech.lang = 'en-US';
    window.speechSynthesis.speak(speech);

    var phylactereTop = $('#canvasRealWorld').position().top;

    if(agent == "ab")
            $("#phylactere").css({top:phylactereTop, left:195});
    else if(agent == "c")
            $("#phylactere").css({top:10, left:400});
    else
    {
      let x = getWorldPosition(0, M.getPointedWorld()).x;


      x += M.getNode(M.getPointedWorld()).getAgentRectangle(agent).x1
                 + M.getNode(M.getPointedWorld()).getAgentRectangle(agent).w/2
                 - 70;

      $("#phylactere").css({top:phylactereTop, left:x});
    }

    $("#phylactere").html(text);

    $("#phylactere").fadeIn();


    window.setTimeout(function() {$("#phylactere").fadeOut();},2000);
  }
}
