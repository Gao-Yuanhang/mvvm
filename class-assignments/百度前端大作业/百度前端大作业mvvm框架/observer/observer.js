import SubsAgent from '../subscriber/subsAgent.js'

class Observer {
    constructor(data) {
        this.observe(data)
    }

    observe(data) {
        Object.keys(data).map(key => {
            this.defineHijack(data, key, data[key])
        })
    }

    defineHijack(dataObj, key, value) {
        this.isObject(value) ? this.observe(value) : null
        // 初始化时每个属性都设置agent订阅者队列
        let agent = new SubsAgent()
        Object.defineProperty(dataObj, key, {
            enumerable: true,
            configurable: false,
            get() {
                // 初始化时，subscriber实例加入agent
                SubsAgent.nowChangedSubs && agent.addSubs(SubsAgent.nowChangedSubs)

                return value
            },
            set: (newVal) => {
                const oldVal = value
                this.isObject(newVal) ? this.observe(newVal) : null
                value = newVal
                // 值改变后，触发属性的agent发布通知，进而属性的subscribers逐个更新
                agent.notifyAllSubs(oldVal)

            }
        })
    }

    isObject(data) {
        return Object.prototype.toString.call(data) === "[object Object]"
    }

}

export default Observer