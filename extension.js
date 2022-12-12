// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
const util = require('./util');




// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
	/**
	 * 执行回调函数
	 * @param {*} panel
	 * @param {*} message
	 * @param {*} response
	 */
	function invokeCallback(panel, message, response) {
		// 错误码在400-600之间的，默认弹出错误提示
		if (typeof response == 'object' && response.code && response.code >= 400 && response.code < 600) {
			util.showError(response.message || '发生未知错误！');
		}
		panel.webview.postMessage({
			cmd: 'vscodeCallback',
			cbid: message.cbid,
			data: response
		});
	}

	/**
	 * 存放所有消息回调函数，根据 message.cmd 来决定调用哪个方法
	 */
	const messageHandler = {
		// 弹出提示
		alert(global, message) {
			util.showInfo(message.info);
		},
		// 显示错误提示
		error(global, message) {
			util.showError(message.info);
		},
		// 获取工程名
		getProjectName(global, message) {
			invokeCallback(global.panel, message, util.getProjectName(global.projectPath));
		},
		// 获取当前激活编辑器内容
		getFileContent(global, message) {
			invokeCallback(global.panel, message, util.getFileContent());
		},
		// 查找匹配的位置
		match(global, message) {
			const length = util.selectStr(util.currentFile, message.rules)

			invokeCallback(global.panel, message, {
				code: 0,
				text: '成功',
				length
			});
		},
		// 替换
		replace(global, message) {
			const length = util.selectStr(util.currentFile, message.rules)
			util.replaceEditorContent(util.currentFile, message.rules);
			invokeCallback(global.panel, message, {
				code: 0,
				text: '成功',
				length
			});
		}
	};


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('extension.launchInVS', function (uri) {
		console.log('Congratulations, your extension "launch-in-visual-studio" is now active!');

		// 工程目录一定要提前获取，因为创建了webview之后activeTextEditor会不准确
		const projectPath = util.getProjectPath(uri);
		if (!projectPath) return;
		const panel = vscode.window.createWebviewPanel(
			'testWebview', // viewType
			"Batch Replace", // 视图标题
			vscode.ViewColumn.Two, // 显示在编辑器的哪个部位
			{
				enableScripts: true, // 启用JS，默认禁用
				retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
			}
		);
		let global = {
			projectPath,
			panel
		};
		panel.webview.html = util.getWebViewContent(context, 'src/view/batch-replace.html');
		panel.webview.onDidReceiveMessage(message => {
			if (messageHandler[message.cmd]) {
				messageHandler[message.cmd](global, message);
			} else {
				util.showError(`未找到名为 ${message.cmd} 回调方法!`);
			}
		}, undefined, context.subscriptions);

	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;