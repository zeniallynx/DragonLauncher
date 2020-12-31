// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog} = require('electron')
const path = require('path')
var fs = require('fs');
var http = require("http");
const ejse = require('ejs-electron')
const discord = require('discord-rich-presence')('794242365388095528');

app.commandLine.appendSwitch ("disable-http-cache");

function createWindow () {

  discord.updatePresence({
    state: 'Playing Dracarys',
    details: 'Dragon Launcher v2.1.0',
    startTimestamp: Date.now(),
    largeImageKey: 'dragon',
    smallImageKey: 'dragonlauncher',
    instance: true,
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 552,
    icon: getPlatformIcon('dragon'),
    frame: false,
    resizable: false,
    backgroundColor: '#080808',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'app/assets/js/preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true
    },
  })

  /*mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });*/


  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
  })

  mainWindow.loadFile('app/app.ejs');

  process.on('uncaughtException', function (error) {
    mainWindow.loadFile('app/frontend/error.html');
    mainWindow.webContents.send('error', error);
    console.log(error);
  });

}

function get_callback(url, callback) {
    http.get(url, function(res) {
      var body = '';
      res.on('data', function(chunk) {
          body += chunk;
      });

      res.on('end', function() {
        try {
          var response = JSON.parse(body);
        } catch {

        }
          // call function ----v
          callback(response);
      });
    });
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

function getPlatformIcon(filename){
  let ext
  switch(process.platform) {
      case 'win32':
          ext = 'ico'
          break
      case 'darwin':
      case 'linux':
      default:
          ext = 'png'
          break
  }

  return path.join(__dirname,'app', 'assets', 'images', `${filename}.${ext}`)
}