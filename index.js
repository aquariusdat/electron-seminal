const { app, BrowserWindow } = require("electron");

let mainWindow;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 1000,
    minHeight: 700,
    title: "Task Application",
  });

  mainWindow.loadFile("index.html");
};

app.whenReady().then(() => {
  createMainWindow();
});
