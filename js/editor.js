var editor;

function editorInstall(id)
{
  editor = CodeMirror.fromTextArea(document.getElementById(id), {
      lineNumbers: true,
    //  mode:  {name: "javascript", globalVars: true},
      extraKeys: {"Ctrl-Space": "autocomplete"},
      //gutters: ["CodeMirror-lint-markers"],
      lint: true
    });
}

function getEditorCode() {
  return editor.getValue();
}
