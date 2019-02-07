
let exampleNames = {};



function setExample(exampleInternalName)
{
  if(exampleInternalName == "")
    return;
    $("#exampleName").html(exampleNames[exampleInternalName]);
  $("#titlescreen").fadeOut();
  $("#examplesscreen").fadeOut();
  $("#mainscreen").fadeIn();
  history.replaceState('', 'Title of the page', '?example=' + exampleInternalName);
  noerror();
  modelCheckingReset();
  $('#selectExamples option[value="' + exampleInternalName + '"]').prop('selected', true);
  onRealWorldClick = (evt) => {};
  actionButtonsInit();
  setResetButtonAction(() => setExample(exampleInternalName));
  $("#guiExample").html("");
  $("#panelGeneralTool").hide();
  eval("setExample" + exampleInternalName + "();");
  updateOnChangeKripkeModel();

}



function registerExample(exampleInternalName, caption) {
  let example = $("<div class='Example'>  " + caption + "</div>");
  exampleNames[exampleInternalName] = caption;
  
  if(!(eval("typeof(" + exampleInternalName + "World)") === "undefined"))
  {
      let canvas = $("<canvas class='canvasWorldExample'>");
      let world = eval("new " + exampleInternalName + "World([])");//new MuddyChildrenWorld([]);
        //canvas.on("draw", () => world.draw(getContext(canvas[0])));
    world.draw(getContext(canvas[0]));
    example.prepend(canvas);
  }
  
  example.on("click", () => setExample(exampleInternalName));
  exampleCategory.append(example);
}


let exampleCategory;


function newExampleCategory(categoryName) {
  $("#examples").append("<h3 class='accordion-header'>" + categoryName + "</h3>");
  exampleCategory = $("<div>");
  $("#examples").append(exampleCategory);
}


$().ready(function()
{
  newExampleCategory("Basic examples");
  registerExample("Simple", "Marble or not?");
  registerExample("MuddyChildren", "Muddy children");
  registerExample("ConsecutiveNumbers", "Consecutive numbers");
  registerExample("SallyAndAnne", "Sally and Anne");
  registerExample("Hats", "Hats");
  registerExample("NanoHanabi", "NanoHanabi");
  registerExample("PrisonnersHats", "PrisonnersHats");
  registerExample("CherylsBirthday", "Cheryl's Birthday");
  //registerExample("Cluedo","Cluedo");
  
  
  newExampleCategory("Games");
  registerExample("MineSweeper","MineSweeper");
  registerExample("BlindTicTacToe","BlindTicTacToe");
  registerExample("Belote", "Belote");
  registerExample("Hanabi", "Hanabi");
  
  newExampleCategory("Medium examples");
  registerExample("DiningCryptographers", "Dining cryptographers");
  registerExample("RussianCards", "Russian Cards");

  
  newExampleCategory("Technical examples");
  registerExample("NonKD45", "non-KD45 epistemic state");
  registerExample("Precondition1andNoPostconditions", "Preconditions of modal depth 1 and no postconditions");
  registerExample("CellularAutomata", "Cellular Automata");
  
  
  newExampleCategory("Advanced");
  registerExample("QDECPOMDPMuseum", "Museum, park and knowledge-based programs");
  registerExample("Asynchronous", "Asynchronous setting");


  
  registerExample("Custom", "Create my own example :)");

  /*
  $("#examples").accordion({
heightStyle: "content",
      collapsible:true,
      active: false,
      autoHeight:false, disabled:false,
});
  
  $('#examples h3.ui-accordion-header').click(function(){
    var _this = $(this);
    $('.ui-accordion-header-icon', _this).toggleClass('ui-icon-triangle-1-e ui-icon-triangle-1-s');
    _this.next().slideToggle();
    return false;
});*/

})

