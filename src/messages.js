'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb(n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.')
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i)
          ar[i] = from[i]
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from))
  }
exports.__esModule = true
exports.sendToMainProcess = exports.handleMessages = void 0
var electron_1 = require('electron')
var fs_1 = require('fs')
var path_1 = require('path')
function respond(messageHandlers, message) {
  return __awaiter(this, void 0, void 0, function () {
    var responseHandler, result
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          responseHandler = messageHandlers[message.type]
          result = responseHandler.apply(void 0, message.args || [])
          return [4 /*yield*/, result]
        case 1:
          // @ts-ignore
          return [2 /*return*/, _a.sent()]
      }
    })
  })
}
function handleMessages(mainWindow) {
  var messageHandlers = getMessageResponders(mainWindow)
  function onMessage(message) {
    return __awaiter(this, void 0, void 0, function () {
      var responseHandler, result, rawError_1, error
      var _a
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 3, , 4])
            responseHandler = messageHandlers[message.type]
            if (!responseHandler)
              throw new Error(
                'Unknown message type: ' + JSON.stringify(message)
              )
            return [4 /*yield*/, respond(messageHandlers, message)]
          case 1:
            result = _b.sent()
            _a = {}
            return [4 /*yield*/, result]
          case 2:
            return [2 /*return*/, ((_a.result = _b.sent()), _a)]
          case 3:
            rawError_1 = _b.sent()
            error = {
              message:
                rawError_1 instanceof Error
                  ? rawError_1.message
                  : 'Non-error thrown: ' + String(rawError_1),
              stack: rawError_1 instanceof Error ? rawError_1.stack : '',
              name: rawError_1 instanceof Error ? rawError_1.name : '',
            }
            return [2 /*return*/, { error: error }]
          case 4:
            return [2 /*return*/]
        }
      })
    })
  }
  electron_1.ipcMain.handle('message', function (event, message) {
    return onMessage(message)
  })
  mainWindow.on('closed', function () {
    electron_1.ipcMain.removeHandler('message')
  })
}
exports.handleMessages = handleMessages
function sendToMainProcess(message) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            electron_1.ipcRenderer.invoke('message', message),
          ]
        case 1:
          return [2 /*return*/, _a.sent()]
      }
    })
  })
}
exports.sendToMainProcess = sendToMainProcess
var getMessageResponders = function (mainWindow) {
  return {
    isReady: function () {
      return true
    },
    getFfmpegAndFfprobePath: function () {
      var _a = global,
        ffmpegpath = _a.ffmpegpath,
        ffprobepath = _a.ffprobepath
      return {
        ffmpegpath: ffmpegpath,
        ffprobepath: ffprobepath,
      }
    },
    log: function () {
      var args = []
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i]
      }
      console.log.apply(console, args)
    },
    /** for sending messages to renderer during integration tests */
    sendToRenderer: function (channel, args) {
      var _a
      if (!mainWindow) console.error('Main window reference lost')
      else
        (_a = mainWindow.webContents).send.apply(
          _a,
          __spreadArray([channel], args, false)
        )
    },
    getPersistedTestState: function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var initialState
        return __generator(this, function (_a) {
          initialState = process.env.PERSISTED_STATE_PATH
            ? JSON.parse(
                (0, fs_1.readFileSync)(process.env.PERSISTED_STATE_PATH, 'utf8')
              )
            : undefined
          return [2 /*return*/, initialState]
        })
      })
    },
    sendInputEvent: function (inputEvent) {
      if (!mainWindow) console.error('Main window reference lost')
      else mainWindow.webContents.sendInputEvent(inputEvent)
    },
    showOpenDialog: function (filters, multiSelections) {
      return electron_1.dialog.showOpenDialog(mainWindow, {
        properties: multiSelections
          ? ['openFile', 'multiSelections']
          : ['openFile'],
        filters: filters,
      })
    },
    showOpenDirectoryDialog: function (showHiddenFiles) {
      return electron_1.dialog.showOpenDialog({
        properties: __spreadArray(
          ['openDirectory'],
          showHiddenFiles ? ['showHiddenFiles'] : [],
          true
        ),
      })
    },
    showOpenDirectoriesDialog: function (showHiddenFiles) {
      return electron_1.dialog.showOpenDialog(mainWindow, {
        properties: __spreadArray(
          ['openDirectory', 'multiSelections'],
          showHiddenFiles ? ['showHiddenFiles'] : [],
          true
        ),
      })
    },
    showSaveDialog: function (name, extensions) {
      return electron_1.dialog.showSaveDialog({
        filters: [{ name: name, extensions: extensions }],
      })
    },
    showMessageBox: function (options) {
      return electron_1.dialog.showMessageBox(mainWindow, options)
    },
    showAboutDialog: function (aboutMessage) {
      return __awaiter(void 0, void 0, void 0, function () {
        var messageBoxReturnValue
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                electron_1.dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  icon: electron_1.nativeImage.createFromPath(
                    (0, path_1.join)(process.cwd(), 'icons', 'icon.png')
                  ),
                  title: 'Knowclip v' + electron_1.app.getVersion(),
                  message: aboutMessage,
                  buttons: ['OK', 'Go to website'],
                }),
              ]
            case 1:
              messageBoxReturnValue = _a.sent()
              if (messageBoxReturnValue) {
                if (messageBoxReturnValue.response === 1)
                  electron_1.shell.openExternal('http://knowclip.com')
              }
              return [2 /*return*/]
          }
        })
      })
    },
    setAppMenuProjectSubmenuPermissions: function (projectOpened) {
      var _a
      var menu = electron_1.Menu.getApplicationMenu()
      var submenu = menu
        ? (_a = menu.getMenuItemById('File')) === null || _a === void 0
          ? void 0
          : _a.submenu
        : null
      if (!submenu) return
      var saveProject = submenu.getMenuItemById('Save project')
      var closeProject = submenu.getMenuItemById('Close project')
      if (saveProject) saveProject.enabled = projectOpened
      if (closeProject) closeProject.enabled = projectOpened
      var openProject = submenu.getMenuItemById('Open project')
      if (openProject) openProject.enabled = !projectOpened
    },
  }
}
