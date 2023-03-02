const fs = require('fs');
const os = require('os');
const path = require('path');
const vscode = require('vscode');
let document = null;
let editor = null;
let currentFile = null;
let positions = [];
let hightLightSelection = [];
let fristLine;
let replaceIndex = 0;

/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
function getWebViewContent(context, templatePath) {
    const resourcePath = util.getExtensionFileAbsolutePath(context, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({
            scheme: 'vscode-resource'
        }).toString() + '"';
    });
    return html;
}

var TODO_STYLE = {
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    overviewRulerColor: '#FFF176',
    light: {
        // this color will be used in light color themes
        backgroundColor: '#FFF176'
    },
    dark: {
        // this color will be used in dark color themes
        color: '#fff',
        backgroundColor: 'red'
    }
};

const util = {
    getWebViewContent: getWebViewContent,
    currentFile: currentFile,

    /**
     * 获取当前所在工程根目录，有3种使用方法：<br>
     * getProjectPath(uri) uri 表示工程内某个文件的路径<br>
     * getProjectPath(document) document 表示当前被打开的文件document对象<br>
     * getProjectPath() 会自动从 activeTextEditor 拿document对象，如果没有拿到则报错
     * @param {*} document
     */
    // getProjectPath(uri) {
    //     editor = vscode.window.activeTextEditor;

    //     if (!uri) {
    //         document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
    //     }
    //     if (!document) {
    //         this.showError('当前激活的编辑器不是文件或者没有文件被打开！');
    //         return '';
    //     }
    //     currentFile = (document.uri ? document.uri : document).fsPath;
    //     util.currentFile = currentFile;
    //     let projectPath = null;

    //     let workspaceFolders = vscode.workspace.workspaceFolders.map(item => item.uri.fsPath);

    //     // 由于存在Multi-root工作区，暂时没有特别好的判断方法，先这样粗暴判断
    //     // 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
    //     if (workspaceFolders.length == 1 && workspaceFolders[0] === vscode.workspace.rootPath) {
    //         const rootPath = workspaceFolders[0];
    //         var files = fs.readdirSync(rootPath);
    //         workspaceFolders = files.filter(name => !/^\./g.test(name)).map(name => path.resolve(rootPath, name));
    //         // vscode.workspace.rootPath会不准确，且已过时
    //         // return vscode.workspace.rootPath + '/' + this._getProjectName(vscode, document);
    //     }
    //     workspaceFolders.forEach(folder => {
    //         if (currentFile.indexOf(folder) === 0) {
    //             projectPath = folder;
    //         }
    //     })
    //     if (!projectPath) {
    //         this.showError('获取工程根路径异常！');
    //         return '';
    //     }
    //     return projectPath;
    // },
    /**
     * 获取当前工程名
     */
    // getProjectName: function(projectPath) {
    //     return path.basename(projectPath);
    // },
    /**
     * 获取打开文档内容
     */
    getFileContent() {
        let html = fs.readFileSync(currentFile, 'utf-8');
        return html;
    },
    getEditor() {
        editor = vscode.window.activeTextEditor;
        vscode.window.showInformationMessage(path.basename(editor.document.uri.fsPath));
    },
    /**
     * 弹出错误信息
     */
    showError: function (info) {
        vscode.window.showErrorMessage(info);
    },
    /**
     * 弹出提示信息
     */
    showInfo: function (info) {
        vscode.window.showInformationMessage(info);
    },
    ReplaceAll: async function (key, index) {
        await vscode.commands.executeCommand('editor.actions.findWithArgs', {
            searchString: key,
            replaceString: "Only" + index,
            findInSelection: false,
            isRegex: false,
            matchWholeWord: true
        }).then(async () => {
            setTimeout(async () => {
                await vscode.commands.executeCommand('search.action.replaceAll');
            }, 100);
        });

    },
    ReplaceAll2: function (key, replaceString1) {
        vscode.commands.executeCommand('editor.actions.findWithArgs', {
            searchString: key,
            replaceString: replaceString1,
            findInSelection: false,
            isRegex: false,
            matchWholeWord: true
        }).then(() => {
            for (let index = 0; index < 100; index++) {
                vscode.commands.executeCommand('editor.action.nextMatchFindAction').then(() => {
                    var range = editor.selection;
                    var raw = editor.document.getText(range);
                    vscode.commands.executeCommand('editor.action.replaceOne');
                });
            }
        });
    },
    ReplaceForMulit: async function () {
        vscode.commands.executeCommand('editor.actions.findWithArgs', {
            searchString: String.raw`(([\S]{1,}?)(\.[xyzw]{1,4}){0,1}) = (.{1,});\n([\s]{1,}\1 =)(.{0,})([ \(-])(\1)([ ,\);])(.{0,})(([ \(])(\1)([ ,\)])){0,1}`,
            replaceString: String.raw`$5$6$7($4)$9$10`,
            findInSelection: false,
            isRegex: true,
            matchWholeWord: false
        }).then(async () => {
            for (let index = 0; index < 100; index++) {
                await vscode.commands.executeCommand('editor.action.nextMatchFindAction').then( async () => {
                    var range = editor.selection;
                    var raw = editor.document.getText(range);
                    var regex = /(([\S]{1,}?)(\.[xyzw]{1,4}){0,1}) = (.{1,});\r\n([\s]{1,}\1 =)((.{0,})([ \(-])(\1)([ ,\);])(.{0,})){2,}/;
                    var result = regex.test(raw);
                    if (!result) {
                        await vscode.commands.executeCommand('editor.action.replaceOne').then(async () => {
                            if (300) await new Promise(r => setTimeout(r, 300));
                        });
                    }
                });
            }
        });
        if (200) await new Promise(r => setTimeout(r, 200));
    },
    replaceOnlyOrSimilar: async function (info) {
        var dicOnlyOne = new Array(); //定义一个字典
        var dicSimpleMore = new Array(); //定义一个字典
        let content = editor.document.getText().replace(/\"/g, '\'');
        let contentList = content.split('\r\n');
        let id = 0;
        for (const index in contentList) {
            let textMatch = contentList[index].match(new RegExp(/^ {1,}?(\S{1,}?) =/, 'ig'));
            // 存在多个相同标签的情况 总数需要叠加
            if (textMatch) {
                var variable = textMatch[0].trim().replace(" =", ""); //这个是整个=号前的字符串
                var variable2 = variable.replace(/\..{1,}/g, ""); //这个是整个.前的字符串
                if (!variable2.includes("SV_") && !variable2.includes("vs_TEXCOORD")) {
                    if (dicSimpleMore.hasOwnProperty(variable2) == false) {
                        dicSimpleMore[variable2] = new Array(); //储存第一次的位置
                        dicSimpleMore[variable2][variable] = 1;
                    }
                    else if (dicSimpleMore[variable2].hasOwnProperty(variable) == false) {
                        dicSimpleMore[variable2][variable] = 1;
                    }
                    else {
                        dicSimpleMore[variable2][variable] += 1;
                    }

                    if (dicOnlyOne.hasOwnProperty(variable2) == false) {
                        dicOnlyOne[variable2] = 1; //储存第一次的位置
                    }
                    else {
                        dicOnlyOne[variable2] += 1;
                    }
                }
            }
        }
        var index = 0;
        for (var key in dicOnlyOne) {
            index = index + 1;
            if (dicOnlyOne[key] == 1) {
                await vscode.window.showTextDocument(editor.document.uri).then(async () => {
                    this.ReplaceAll2(key, "Only" + index);
                    if (1000) await new Promise(r => setTimeout(r, 1000));
                });
            }
        }

        index = 0;
        var index2 = 0;
        for (var key1 in dicSimpleMore) {
            index2 = 0;
            for (var key2 in dicSimpleMore[key1]) {
                index2 += 1;
                if (index2 > 1) {
                    break;
                }
            }

            if (index2 == 1) {
                index = index + 1;
                await vscode.window.showTextDocument(editor.document.uri).then(async () => {
                    this.ReplaceAll2(key1, "Simple" + index);
                    if (1000) await new Promise(r => setTimeout(r, 1000));
                });
            }
        }

    },
    forTest: async function (info) {

        vscode.window.showTextDocument(editor.document.uri).then(() => {
            this.ReplaceForMulit();
        });

    },
    addDefine: function (info) {

        var range = editor.selection;
        var raw = editor.document.getText(range);
        let varying = raw.replace(/(in.{1,}[^a-z0-9]{0,1})vec([0-9]{0,1})/ig, "float$2 ");
        let addVaryingString = 'struct Varyings \n{ \n ' + varying + '\n};';
        let varying2 = raw.replace(/(in.{1,}[^a-z0-9]{0,1})vec([0-9]{0,1})/ig, " ").replace(/;\r\n/ig, ",").replace(/;/ig, "");
        let addVaryingString2 = 'Varyings varyings = Varyings(' + varying2 + ');';


        var addtextString = `
#define float2 vec2
#define float3 vec3
#define float4 vec4
#define half mediump float
#define half2 mediump vec2
#define half3 mediump vec3
#define half4 mediump vec4
#define bool2 bvec2
#define bool3 bvec3
#define bool4 bvec4
#define frac fract
#define lerp mix
#define saturate(i) clamp(i, 0.0, 1.0)
#define SAMPLE_TEXTURE2D(sss, sample_Texture, uv) texture(sss,uv)
#define SAMPLE_TEXTURE2D_LOD(sss, sample_Texture, uv, lodLevel) textureLod(sss,uv,lodLevel)
`
        editor.edit((textEditorEdit) => {
            textEditorEdit.insert(editor.selection.anchor, addtextString + addVaryingString + '\n' + addVaryingString2);
        });
    },
    varyingVariable: function () {
    },
    RegexpEditor: function (rule) {
        vscode.window.showTextDocument(editor.document.uri).then(() => {
            vscode.commands.executeCommand('editor.actions.findWithArgs', {
                searchString: rule.find,
                replaceString: rule.to,
                isRegex: true,
            })
        });
    },
    /**
     * 获取某个扩展文件绝对路径
     * @param context 上下文
     * @param relativePath 扩展中某个文件相对于根目录的路径，如 images/test.jpg
     */
    getExtensionFileAbsolutePath: function (context, relativePath) {
        return path.join(context.extensionPath, relativePath);
    },
    simpleOne: function () {

    },

    getSelection: function () {

        let raw1 = [];
        var range = editor.selection;
        var raw = editor.document.getText(range).trim();
        raw1.push(raw);

        replaceIndex = 0;
        fristLine = editor.document.getText(new vscode.Range(
            editor.selection.start,
            new vscode.Position(editor.selection.anchor.line + 1, 0)
        )).replace(/(\S{1,}?) =/ig, '').replace('\r\n', '').replace(';', '');

        let content1 = editor.document.getText(new vscode.Range(
            new vscode.Position(editor.selection.anchor.line + 1, 0),
            new vscode.Position(editor.document.lineCount + 1, 0),
        ));
        this.selectStr(content1, raw1);
    },
    /**
     * 选中匹配的字符串
     */
    selectStr: function (content, str) {
        let todoDecorationType = vscode.window.createTextEditorDecorationType(TODO_STYLE);
        editor.setDecorations({}, hightLightSelection);

        positions = [];
        let matches;
        for (let index = 0; index < str.length; index++) {
            const rows = content.split('\r\n'); // 分行查找只为了拿到行
            let rule = new RegExp(str[index], 'ig'); // 正则匹配
            for (let i = 0; i < rows.length; i++) {
                while ((matches = rule.exec(rows[i]))) {
                    positions.push({
                        rule: str[index],
                        row: editor.selection.anchor.line + 1 + i,
                        col: rule.lastIndex - matches[0].length
                    });
                }
            }
        }
        hightLightSelection = [];
        for (let i = 0; i < positions.length; i++) {
            hightLightSelection.push(
                new vscode.Selection(
                    new vscode.Position(positions[i].row, positions[i].col),
                    new vscode.Position(positions[i].row, positions[i].col + positions[i].rule.length)
                )
            )
        }
        console.log(hightLightSelection);
        //editor.setDecorations(todoDecorationType, hightLightSelection);
        return positions.length;
    },
    replaceNextOne: function () {
        console.log(positions);
        editor.edit(editBuilder => {
            // 替换内容
            editBuilder.replace(new vscode.Range(
                new vscode.Position(positions[replaceIndex].row, positions[replaceIndex].col),
                new vscode.Position(positions[replaceIndex].row, positions[replaceIndex].col + positions[replaceIndex].rule.length)
            ), fristLine);
        });
        replaceIndex += 1;
    },
    /**
     * 修改当前激活编辑器内容
     */
    replaceEditorContent: function (str) {
        editor.edit(editBuilder => {
            // 替换内容
            for (let i = 0; i < positions.length; i++) {
                editBuilder.replace(new vscode.Range(
                    new vscode.Position(positions[i].row, positions[i].col),
                    new vscode.Position(positions[i].row, positions[i].col + positions[i].rule.length)
                ), positions[i].to);
            }
        });
    },

};

module.exports = util;