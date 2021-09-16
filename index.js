const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require("electron");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const url = require("url");
const MenuTray = Menu;
const iconPath = path.join(__dirname, "/public/image/logo_smb.png");
const { autoUpdater } = require("electron-updater");

// process.env.NODE_ENV = "production";

let mainWindow;
let addWindow;
let menuApplication;
let mainTray;

let menuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Add a new task",
        click() {
          createAddWindow();
        },
      },
      {
        label: "Exit",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Control+Q",
        click() {
          app.quit();
        },
      },
    ],
  },
];

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 1500,
    minHeight: 1000,
    title: "Task Application",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file",
      slashes: true,
    })
  );

  menuApplication = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menuApplication);

  mainWindow.once("ready-to-show", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
};

if (process.env.NODE_ENV !== "production") {
  menuTemplate.push({
    label: "Developer Tools",
    submenu: [
      {
        label: "Toggle DevTools",
        accelerator: process.platform == "darwin" ? "Command+I" : "Control+I",
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        },
      },
    ],
  });
}

// create Add task Window
const createAddWindow = () => {
  addWindow = new BrowserWindow({
    width: 300,
    height: 200,
    title: "Add Task",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "create.html"),
      protocol: "file",
      slashes: true,
    })
  );
};

// Create Tray
const createTray = () => {
  mainTray = Tray(iconPath);

  let menuTemplate = [
    {
      label: "Open",
      click() {
        mainWindow.show();
      },
    },
    {
      label: "Hidden",
      click() {
        mainWindow.hide();
      },
    },
    {
      label: "Exit",
      click() {
        app.quit();
      },
    },
  ];

  const ctxMenu = MenuTray.buildFromTemplate(menuTemplate);
  mainTray.setContextMenu(ctxMenu);
  mainTray.setToolTip("Task Manager Application");
};

// Process
const reviewProcess = () => {
  console.log("--------");
  console.log(process.getCPUUsage().percentCPUUsage * 100);
  console.log("--------");
  console.log(process.getSystemMemoryInfo());
  console.log("--------");
  console.log(process.getSystemVersion());
};

app.whenReady().then(() => {
  createMainWindow();
  createTray();

  reviewProcess();
});

ipcMain.on("task-add", async (event, args) => {
  console.log("------------");
  console.log('Da nhan duoc yeu cau cua index.html voi ten la "task-add"');
  console.log("Chuan bi tao cua so AddWindow");
  createAddWindow();
});

ipcMain.on("submit-task", async (event, args) => {
  console.log("------------");
  console.log(
    `Da nhan duoc yeu cau va du lieu cua create.html voi ten la "submit-task": ${args}`
  );
  const taskName = args;
  const taskID = uuidv4();
  const data = {
    taskName,
    taskID,
  };

  console.log('Gui du lieu cua so index.html voi yeu cau ten la "submit-task"');
  mainWindow.webContents.send("submit-task", data);
  addWindow.close();
});

// Xử lý sau khi Window được đóng
app.on("window-all-closed", () => {
  app.quit();
});

// Xử lý khi app ở trạng thái active, ví dụ click vào icon
app.on("activate", () => {
  // Mở window mới khi không có window nào
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Auto update new version with Electron-Updater
ipcMain.on("app_version", async (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
});

ipcMain.on("restart_app", () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on("checking-for-update", () => {
  mainWindow.webContents.send("message", "Checking for update...");
  console.log("Checking for update");
});
autoUpdater.on("update-available", (info) => {
  mainWindow.webContents.send("message", "update_available");
  console.log("update avail");
});
autoUpdater.on("update-not-available", (info) => {
  mainWindow.webContents.send("message", "Update not available.");
});
autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  mainWindow.webContents.send("message", log_message);
});
autoUpdater.on("update-downloaded", (info) => {
  console.log("update downlaoded");
  mainWindow.webContents.send("message", "update_downloaded");
  autoUpdater.quitAndInstall();
});
