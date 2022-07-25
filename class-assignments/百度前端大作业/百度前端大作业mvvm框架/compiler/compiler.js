import compileUtil from './compileUtil.js'


export default class Compiler {
    constructor(el, vm) {
        this.el = this.isElementType(el) ? el : document.querySelector(el)
        this.vm = vm
        // 1. 转换el为游离态的fragment碎片
        let fragment = this.node2Fragment(this.el)
        // 2. 编译fragment
        this.compile(fragment)
        // 3. 将fragment插入div#app
        this.el.appendChild(fragment)
    }

    compile(el) {
        [...el.childNodes].forEach(node => {
            if (this.isElementType(node)) {
                // 编译元素
                this.compileElementNode(node)
            } else {
                // 编译文本
                this.compileTextNode(node)
            }
            // 递归地遍历子结点
            if (node.childNodes && node.childNodes.length) {
                this.compile(node)
            }
        })
    }

    compileElementNode(node) {
        const attributes = [...node.attributes]
        attributes.map(attr => {
            const { name, value } = attr
            if (this.isDirective(name)) {
                const attrName = name.replace('@', 'v-on:')
                const [directiveName, eventName] = attrName.split('-')[1].split(':')
                //directiveName:on,html,text,model等，在util中处理
                /**
                 * @param value value是表达式, 如{{msg}}, obj.name, testFn
                 * @param this.vm 可以获取$data和$options.methods
                 * @param eventName 如v-on:click的click
                 */
                compileUtil[directiveName](node, value, this.vm, eventName)

                node.removeAttribute(`v-${directiveName}`)
            }
        })
    }
   
    isDirective(attr) {
        return attr.startsWith('v-') || attr.startsWith('@')
    }

    compileTextNode(node) {
        const expr = node.textContent
        //反斜杠转义
        if (/\{\{(.+?)\}\}/.test(expr)) {
            compileUtil['text'](node, expr, this.vm)
        }
    }

    isElementType(node) {
        return node.nodeType === 1
    }

    node2Fragment(el) {
        let fragment = document.createDocumentFragment()
        while (el.firstChild) {
            fragment.appendChild(el.firstChild)
        }
        return fragment
    }
}