import Compiler from './compiler/compiler.js'
import Observer from './observer/observer.js'


class Mue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            // 劫持各属性的set，get
            new Observer(this.$data)
            // 第二个参数——Mue的实例
            new Compiler(this.$el, this)
            // this代理this.$data
            this.proxyData(this.$data)
        }
    }
    proxyData(data) {
        Object.getOwnPropertyNames(data).forEach((prop) => {
            Object.defineProperty(this, prop, {
                get() {
                    return data[prop]
                },
                set(val) {
                    data[prop] = val
                }
            })
        })
    }
}


const app = new Mue({
    el: '#app',
    data: {
        msg: '百度前端大作业',
        msg2: `<h1>123</h1>`,
        obj: {
            name: 'obj',
            value: 'test'
        }
    },
    methods: {
        test1() {
            this.obj.name = 'obj.name变了'
            return this.obj.name
        },
        test2() {
            this.msg = 'msg变了'
        },
        test3() {
            this.msg2 = '<h1>msg2变了</h1>'
        }
    }
})

// 使控制台能通过vm访问Mue实例
window.vm = app
