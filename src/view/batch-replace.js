const testMode = false; // 为true时可以在浏览器打开不报错
// vscode webview 网页和普通网页的唯一区别：多了一个acquireVsCodeApi方法
const vscode = testMode ? {} : acquireVsCodeApi();
const callbacks = {};

/**
 * 调用vscode原生api
 * @param data 可以是类似 {cmd: 'xxx', param1: 'xxx'}，也可以直接是 cmd 字符串
 * @param cb 可选的回调函数
 */
function callVscode(data, cb) {
    if (typeof data === 'string') {
        data = {
            cmd: data
        };
    }
    if (cb) {
        // 时间戳加上5位随机数
        const cbid = Date.now() + '' + Math.round(Math.random() * 100000);
        callbacks[cbid] = cb;
        data.cbid = cbid;
    }
    vscode.postMessage(data);
}

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.cmd) {
        case 'vscodeCallback':
            console.log(message.data);
            (callbacks[message.cbid] || function() {})(message.data);
            delete callbacks[message.cbid];
            break;
        default:
            break;
    }
});

new Vue({
    el: '#app',
    data: {
        size: 'small',
        fileContent: '这里应该是一段html', // 当前激活编辑器内容
        show: false,
        replaceRule: [
            {
                find: String.raw`(sampler[^ ]{0,} (.{1,});)`,
                to: String.raw`$1float sampler$2;`,
                showDel: false
            },
            {
                find: String.raw`fract`,
                to: String.raw`frac`,
                showDel: false
            },
            {
                find: String.raw`clamp\((.{1,}?), 0.0, 1.0\)`,
                to: String.raw`saturate($1)`,
                showDel: false
            },
            {
                find:String.raw`([^a-z0-9]{0,1})mix([0-9]{0,1}\()`,
                to:String.raw`$1lerp$2`,
                showDel: false
            },
            {
                find:String.raw`vs_`,
                to:String.raw`varyings.vs_`,
                showDel: false
            },
            {
                find:String.raw`([^a-z0-9]{0,1})i{0,1}vec([0-9]{0,1}\()`,
                to:String.raw`$1float$2`,
                showDel: false
            },
            {
                find:String.raw`float[2-4]\((.{1,}?),( \1,){0,2} \1\)`,
                to:String.raw`$1`,
                showDel: false
            },
            {
                find:String.raw`#ifdef UNITY_ADRENO_ES3[\n\s]{1,}.{1,}[\n\s]{1,}#else[\n]{1,}(.{1,})[\n\s]{1,}#endif`,
                to:String.raw`$1`,
                showDel: false
            },
            {
                find:String.raw`texture\((.{1,}?),`,
                to:String.raw`SAMPLE_TEXTURE2D($1, sampler$1,`,
                showDel: false
            },
            {
                find:String.raw`textureLod\((.{1,}?),`,
                to:String.raw`SAMPLE_TEXTURE2D_LOD($1, sampler$1,`,
                showDel: false
            },
            {
                find:String.raw`((([\S]{1,}?)(\.[xyzw]{1,4}){0,1}) = .{1,} _([_A-Za-z0-9]{1,})ST.xy)`,
                to:String.raw`half2 $5UV;$1`,
                showDel: false
            },
            {
                find:String.raw`((([\S]{1,}?)(\.[xyzw]{1,4}){0,1}) = SAMPLE_TEXTURE.{1,}\(_([_A-Za-z0-9]{1,}))`,
                to:String.raw`half4 $5;$1`,
                showDel: false
            },
            {
                find:String.raw`([^a-z0-9]{0,1})float([0-9]{0,1}\()([^(,]{1,}?)\)`,
                to:String.raw`$1$3`,
                showDel: false
            },
            {
                find:String.raw`(([\S]{1,}?)(\.[xyzw]{1,4}){0,1}) = (.{1,});\n([\s]{1,}\1 =)(.{0,})([ \(-])(\1)([ ,\);])(.{0,})(([ \(])(\1)([ ,\)])){0,1}`,
                to:String.raw`$5$6$7($4)$9$10`,
                showDel: false
            },
        ],
        histroyRules: []
    },
    mounted() {
        callVscode('getFileContent', fileContent => this.fileContent = fileContent);
        console.log('window', window.localStorage);
    },
    watch: {
        historyRules: {
            deep: true,
            handler() {}
        }
    },
    methods: {
        cb() {
            this.show = !this.show;
        },
        // 模拟alert
        alert(info) {
            callVscode({
                cmd: 'alert',
                info: info
            }, null);
        },
        // 模拟alert
        test1() {
            callVscode({
                cmd: 'test1',
                info: '123'
            }, null);
        },
        // 模拟alert
        addDefine() {
            callVscode({
                cmd: 'addDefine',
                info: '123'
            }, null);
        },

        // 模拟alert
        RegexpEditor() {
            callVscode({
                cmd: 'RegexpEditor',
                info: '123'
            }, null);
        },
        // 弹出错误提示
        error(info) {
            callVscode({
                cmd: 'error',
                info: info
            }, null);
        },
        reset() {
            this.replaceRule.forEach(item => {
                item.find = '';
                item.to = '';
            })
        },
        resetHistory() {
            this.histroyRules = []
        },
        validate() {
            let emptyNum = 0;
            this.replaceRule.forEach(item => {
                if (!item.find) {
                    emptyNum++;
                }
            });
            if (emptyNum > 0) {
                this.alert('请输入要替换的内容');
                return false;
            }

            return true;
        },
        // 查找匹配项
        match() {
            if (!this.validate()) {
                return;
            }
            this.replaceRule.forEach(element => {
                this.histroyRules.push({
                    ...element
                })
            });
            callVscode({
                cmd: 'match',
                rules: this.replaceRule
            }, (data) => {
                this.alert(`共查找到${data.length}个匹配项`);
            });
        },
        getEditor() {
            callVscode({
                cmd: 'getEditor',
            });
        },
        replace() {
            if (!this.validate()) {
                return;
            }
            this.replaceRule.forEach(element => {
                this.histroyRules.push({
                    ...element
                })
            });
            callVscode({
                cmd: 'replace',
                rules: this.replaceRule
            }, (data) => {
                this.alert(`${data.length}个匹配项已替换`);
            });
        },
        replaceOne(index){
            callVscode({
                cmd: 'RegexpEditor',
                rule: this.replaceRule[index]
            });
        },
        add() {
            this.replaceRule.push({
                find: '',
                to: '',
                showDel: false
            })
        },
        del(index) {
            this.replaceRule.splice(index, 1);
        },
        reuseHistory(item) {
            this.replaceRule.push({...item })
        }
    }
});