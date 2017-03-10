// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const Rsync = require('rsync');
const co = require('co');

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
  config.ignores = config.ignores || [];
} catch (e) {
  config.ignores = [];
  console.log(e);
}

function onDocSave(event) {
  const fileName = event.fileName;
  if (fileName === path.join(workspace.rootPath, '.uploadrc')) {
    window.showInformationMessage('You just updated your .uploadrc file. Please reload your workspace to take effect!');
    return;
  }
  if (!configLoaded || !config.url || !config.root || config.disabled === true) {
    return;
  }
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

function* sync(path, target) {
  console.log(`${path}, ${target}`);
  return new Promise((resolve, reject) => {

    const cmd = new Rsync().flags('a')
      .shell('ssh').source(path).destination(target);

    config.ignores.forEach(ignore => {
      // params.push(`--exclude=${ignore}`);
      cmd.exclude(ignore);
    });

    const proc = cmd.execute();
    proc.stderr.on('data', (data) => {
      window.showErrorMessage(data.toString());
    });

    proc.on('close', code => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}

function uploadWorkspace() {
  if (configLoaded) {
    try {
      const root = workspace.rootPath;
      const params = ['-a'];

      const files = fs.readdirSync(root);
      window.setStatusBarMessage('Uploading files...');
      co(function*() {
        for (let i = 0; i < files.length; i++) {
          yield sync(path.join(root, files[i]), `${config.url}:${config.root}`);
        }
      }).catch(e => {
        window.setStatusBarMessage('Last upload is failed!');
      });

      window.showInformationMessage('The workspace upload is completed!');
      window.setStatusBarMessage('');
    } catch (e) {
      console.log(e);
    }
  } else {
    window.showWarningMessage('Your .uploadrc is not specific or the function is disabled. Please update the .uploadrc and reload the workspace!');
  }
}

function activate(context) {

  let sub = context.subscriptions;
  sub.push(vscode.commands.registerCommand('gogocrow.uploadAll', uploadWorkspace));

  workspace.onDidSaveTextDocument(onDocSave);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
