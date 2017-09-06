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
}

function* singleUpload(file, target) {
  return new Promise((resolve, reject) => {
    const args = [file, target];
    if (config.port) {
      args.unshift([`-P ${config.port}`])
    }
    const output = spawn('scp', args);
    let loaded = false;
    output.on('close', (code) => {
      if (loaded) {
        return;
      }
      loaded = true;
      if (code === 0) {
        resolve('The file upload is completed!');
      } else {
        window.showErrorMessage('The upload is failed. Please make sure you have proper access of the server. You need to add your SSH key to your remote server.');
        reject(`Upload file ${fileName.replace(/^(.*)\//, '')} failed!`);
      }
    });
    setTimeout(() => {
      if (loaded) {
        return;
      }
      loaded = true;
      window.showErrorMessage('The upload timeout. Please make sure you can connect to your server and have proper access of the server. You need to add your SSH key to your server.');
      reject('Upload timeout.');
    }, 5000);
    output.stderr.on('data', (data) => {
      window.showErrorMessage(data.toString());
    });
  });
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
  co(function* () {
    window.setStatusBarMessage('Uploading...');
    const result = yield singleUpload(fileName, `${config.url}:${config.root}/${relative}`);
    window.showInformationMessage(result);
    window.setStatusBarMessage('Uploaded!');
  }).catch(e => {
    window.setStatusBarMessage(e);
  })
}

function* sync(path, target) {
  return new Promise((resolve, reject) => {

    const cmd = new Rsync().flags('a')
      .shell('ssh').source(path).destination(target);

    config.ignores.forEach(ignore => {
      // params.push(`--exclude=${ignore}`);
      cmd.exclude(ignore);
    });

    if (config.port) {
      cmd.set('port', config.port);
    }
    
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
      co(function* () {
        for (let i = 0; i < files.length; i++) {
          yield sync(path.join(root, files[i]), `${config.url}:${config.root}`);
        }
      }).catch(e => {
        window.setStatusBarMessage('Last upload is failed!');
      });

      window.showInformationMessage('The workspace upload is completed!');
      window.setStatusBarMessage('');
    } catch (e) {}
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