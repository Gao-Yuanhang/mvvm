import updater from './updater.js'
import Subscriber from '../subscriber/subscriber.js'

// 编译v-text，v-html，v-model等指令的工具类
const compileUtil = {
    getExprVal(expr, vm) {
        // reduce层层递进取嵌套对象
        return expr.split('.').reduce((prev, cur) => {
            return prev[cur]
        }, vm.$data)
    },

    setModelVal(expr, vm, newVal) {
        let exp = expr.split('.')
        exp.reduce((prev, cur, index) => {
            if (index < exp.length - 1) {
                // 非最后一个key，则还有嵌套的对象，继续reduce
                return prev[cur]
            } else {
                prev[cur] = newVal
            }
        }, vm.$data)
        return 
    },

    getContentVal(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getExprVal(args[1], vm)
        })
    },

    text(node, expr, vm) {
        let exprVal
        if (expr.includes('{{')) {
            // 处理{{...}}模板
            exprVal = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                new Subscriber(args[1], vm, newVal => {
                    updater.textUpdater(node, this.getContentVal(expr, vm))
                })
                return this.getExprVal(args[1], vm)
            })
        } else {
            new Subscriber(expr, vm, newVal => {
                updater.textUpdater(node, newVal)
            })
            exprVal = this.getExprVal(expr, vm)
        }
        updater.textUpdater(node, exprVal)
    },

    html(node, expr, vm) {
        const exprVal = this.getExprVal(expr, vm)
        new Subscriber(expr, vm, newVal => {
            updater.htmlUpdater(node, newVal)
        })
        updater.htmlUpdater(node, exprVal)
    },

    model(node, expr, vm) {
        const exprVal = this.getExprVal(expr, vm)
        new Subscriber(expr, vm, newVal => {
            updater.modelUpdater(node, newVal)
        })
        //实现双向绑定
        node.addEventListener('input', (e) => {
            this.setModelVal(expr, vm, e.target.value)
        })

        updater.modelUpdater(node, exprVal)
    },

    on(node, expr, vm, eventName) {
        const fn = vm.$options.methods[expr]
        node.addEventListener(eventName, fn.bind(vm), false)
    }
}

export default compileUtil