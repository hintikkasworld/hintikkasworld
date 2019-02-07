let modelCheckingInfo = {};


let imgModelChecking = new Array();

imgModelChecking[false] = new Image();
imgModelChecking[false].src = "img/notok.png";

imgModelChecking[true] = new Image();
imgModelChecking[true].src = "img/ok.png";

function drawModelChecking(worldID, context) {
    if(modelCheckingInfo[worldID] == undefined) return;
    let r = 16;
    context.drawImage(imgModelChecking[modelCheckingInfo[worldID]], 128-r, 64-r, r, r);
}


function modelCheckingReset() {
  modelCheckingInfo = {};
  graphVisualizationEpistemicModel.nodesRemoveAllClass();
  
}




function modelChecking() {
  try {
        noerror();
        modelCheckingReset();
        let formula = createFormula($("#formula").val());
        for(let w in M.getNodes()) {
            modelCheckingInfo[w] = M.modelCheck(w, formula);
        }
        compute(0);
        graphVisualizationEpistemicModel.nodesAddClass("true", (id) => modelCheckingInfo[id]);
    } catch (e) {
      errorShowMessage(e);
    }


}
