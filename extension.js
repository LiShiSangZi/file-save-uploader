// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const {
  workspace,
  window
} = vscode;

let config = {};
let configLoaded = false;
try {
  config = JSON.parse(fs.readFileSync(path.resolve(workspace.rootPath, './.uploadrc')));
  if (config.root && config.url) {
    configLoaded = true;
  }
} catch (e) {
  console.log(e);
}


function onDocSave(event) {
  const fileName = event.fileName;
  const root = workspace.rootPath;
  let relative = path.relative(root, fileName);
  let output = spawn('scp', [`${relative}`, `${config.url}:${config.root}/${relative}`], {
    cwd: root
  });
  output.on('close', (code) => {
    if (code === 0) {
      window.showInformationMessage('The file upload is completed!');
    }
  });
  output.stderr.on('data', (data) => {
    window.showErrorMessage(data.toString());
  });
}

function activate(context) {

  if (configLoaded) {
    workspace.onDidSaveTextDocument(onDocSave);
  }
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
