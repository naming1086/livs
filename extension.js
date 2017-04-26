// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

function doesExist(path) {
    var fs = require('fs');

    try {
        fs.accessSync(path, fs.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "launch-in-visual-studio" is now active!'); 

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('extension.launchInVS', function () {
   
        var vsPath2017E = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\IDE\\devenv.exe';
        var vsPath2017P = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Professional\\Common7\\IDE\\devenv.exe';
        var vsPath2017C = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\Common7\\IDE\\devenv.exe';
        var vsPath2015 = 'C:\\Program Files (x86)\\Microsoft Visual Studio 14.0\\Common7\\IDE\\devenv.exe';
        var vsPath2013 = 'C:\\Program Files (x86)\\Microsoft Visual Studio 12.0\\Common7\\IDE\\devenv.exe';
        var vsPath2012 = 'C:\\Program Files (x86)\\Microsoft Visual Studio 11.0\\Common7\\IDE\\devenv.exe';
        var vsPath2010 = 'C:\\Program Files (x86)\\Microsoft Visual Studio 10.0\\Common7\\IDE\\devenv.exe';
        //var vsPath1 = 'C:\\Program Files (x86)\\Microsoft Visual Studio 14.0\\Common7\\IDE\\devenv1.exe';
        
        
        var vsPath;
        
        if (doesExist(vsPath2017E))
        {
            vsPath = vsPath2017E;            
        }
        else if (doesExist(vsPath2017C))
        {
            vsPath = vsPath2017C;            
        }
        else if (doesExist(vsPath2017P))
        {
            vsPath = vsPath2017P;            
        }
        else if (doesExist(vsPath2015))
        {
            vsPath = vsPath2015;            
        }
        else if (doesExist(vsPath2013))
        {
            vsPath = vsPath2013;            
        }
        else if (doesExist(vsPath2012))
        {
            vsPath = vsPath2012;            
        }
        else if (doesExist(vsPath2010))
        {
            vsPath = vsPath2010;            
        }
        else 
        {
            vscode.window.showErrorMessage('Visual Studio not available on this machine.');
            return;
        }
        
        
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Could not find and valid text editor. Please open a file in Code first.');
            return; // No open text editor
        }
        
        if (editor.document.isUntitled) {
            vscode.window.showErrorMessage('Please save the file first.');
            return; // No open text editor
        }
        
        var myfilename = editor.document.fileName;
         
        // Display a message box to the user
        //vscode.window.showInformationMessage('Will open the file ' + text + 'in Visual Studio');
        
        // The code you place here will be executed every time your command is executed
        const execFile = require('child_process').execFile;
        const bat = execFile(vsPath,
            ['/edit', myfilename], (error, stdout, stderr) => {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                 if (error !== null) {
                     console.log('Some error occured while launching Visual Studio.');
                 }
                
            });

        // Display a message box to the user
        console.log('Opened file in VS!');
	});
	
	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;