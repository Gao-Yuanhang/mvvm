# 基于javascript实现mvvm框架

## 1：mvvm框架原理

### 1.1 mvvm框架简介

mvvm框架是对mvc框架的改进，由于MVC模式中controller主要用来处理各种逻辑和数据转化，复杂业务逻辑界面的Controller非常庞大，维护困难。把Controller的数据和逻辑处理部分从中抽离出来，用一个专门的对象去管理，这个对象就是ViewModel，也就是mvvm框架中的vm，可以大幅度简化controller的结构。本mvvm框架实现 单向数据绑定（javascript对象(model)的改变可以引起前端界面(view)的改变）与双向数据绑定（为前端添加input等元素，实现前端view改变会引起model的改变，进一步由单向绑定影响view的其它元素）。mvvm实现绑定的方式有发布者-订阅者模式，数据劫持以及脏值检查等，本框架基于发布订阅模式以及数据劫持。

### 1.2 发布者-订阅者模式

发布者-订阅者模式使得框架能够以异步方式向多个订阅者公布事件，而没有必要将发送方与接收方耦合的模式。

发布者-订阅者模式的元素包括发布者（publisher/subsagent），订阅者（subscriber）以及作为中间媒介的事件通道。发布者维护一个订阅者队列，在发现变化（由observer实现数据劫持并通知发布者，发布者不能自己监测到数据的改变）时通知所有对应的订阅者，并引起订阅者数据的改变。而订阅者可以向发布者注册数据的绑定行为。发布者与订阅者的交互通过中间媒介来完成，即发布者发布事件时无需关注订阅事件的对象，订阅者接收事件时也无需关注发布事件的对象，减少了两者的耦合。

### 1.3 数据劫持

在访问或修改js对象的某个属性时，可以监测到这样的动作，通过额外的代码执行相应额外的行为。javascript提供了劫持对象的get与set方法的机制，即可实现对该对象访问与修改的控制。本框架通过defineProperty（）方法或proxy实现。defineProperty（）提供了对对象一些属性的控制，如是否可枚举，是否可修改等属性，其中最重要的就是定义了get（）方法与set（）方法执行后的回调函数。

## 2：代码结构分析

### 2.1 文件结构分析

```

├─ compiler
│  ├─ compiler.js
│  ├─ compileUtil.js
│  └─ updater.js
├─ observer
│  └─ observer.js
├─ package.json
├─ subscriber
│  ├─ subsAgent.js
│  └─ subscriber.js
├─ mue.js
├─ test.html


```

文件树状结构图如上，主要展示功能相关的文件。

compiler.js实现对模板的编译，递归地解析模板中的节点或文本，并处理mvvm框架新加入的绑定机制代码（即以‘v-’或‘@’开头的代码部分），调用compileUtil.js类处理，实现了v-text，v-on，v-model，v-html的解析。updater.js则实现了视图类的初始化以及更新操作。

subscriber.js负责订阅属性（由compileUtil.js构造并调用）并收到属性变动的通知，执行对应的回调函数（调用updater.js实现对视图的更新）。subsAgent.js则负责管理subscriber序列并通知subscriber属性的变化。

observer.js实现初始化阶段对数据的劫持，从而实现对所有属性的监听，构造并维护发布者（subsAgent）对象，并且通知属性的变化。

test.html展示了该框架实现内容测试的前端页面（view）

mue.js是test.html对应的js文件，负责初始化observer对象与compiler对象。

### 2.2 compiler

```
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
```

出于效率的考虑，将节点转化为文档碎片fragment进行编译最后一次性插入DOM。

compileElementNode方法实现了对具体绑定表达式的解析，如‘v-on:click’

compileTextNode方法实现对文本绑定的解析

````
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
    }
````

通过js的addEventListener函数实现双向绑定

### 2.4 subscriber（发布订阅模式）

````
addSubs(subs){
        this.subscribers.push(subs)
    }

    notifyAllSubs(oldVal){
        this.subscribers.map(subs=>{
        	//订阅者序列逐个更新
            subs.update(oldVal)
        })
    }
````

发布者类包装了订阅者序列以及添加订阅者以及使订阅者逐个更新视图的函数（对于新值与旧值是否相等的比较在subscribers类的update函数中）。

```
	getOldVal() {
        SubsAgent.nowChangedSubs = this
        const oldValue = compileUtil.getExprVal(this.expr, this.vm)
        SubsAgent.nowChangedSubs = null
        return oldValue
    }
    update(oldVal) {
        let newVal = compileUtil.getExprVal(this.expr, this.vm)
        if (newVal !== oldVal) {
            this.callback(newVal)
        }
    }
```

订阅者类封装了对象的oldvalue与被发布者告知改变后需要执行的回调函数。

### 2.4 observer（数据劫持）

```
defineHijack(dataObj, key, value) {
        this.isObject(value) ? this.observe(value) : null
        let agent = new SubsAgent()
        Object.defineProperty(dataObj, key, {
            enumerable: true,
            configurable: false,
            get() {
                SubsAgent.nowChangedSubs && agent.addSubs(SubsAgent.nowChangedSubs)
                return value
            },
            set: (newVal) => {
                const oldVal = value
                this.isObject(newVal) ? this.observe(newVal) : null
                value = newVal
                agent.notifyAllSubs(oldVal)
            }
        })
    }
```

observer的核心部分是defineHijack函数实现对el的data的数据劫持

defineHijack函数构造agent（发布者）对象，调用了js的defineProperty方法实现对数据的监测

当get被执行时把属性的agent和一个或多个属性的subscriber绑定在一起

当set被执行时，执行发布者（subsagent）的notifyAllSubs函数通知订阅者更新，并传更新前的旧值使订阅者可以与新值比较。

### 2.5 框架实现测试

静态页面部分

```
<div id="app">
        <div>以下是使用双大括号语法时获取data中各元素的值</div>
        <div>msg:{{msg}}</div>
        <div>msg2:{{msg2}}</div>
        <div>obj对象value:{{obj.value}}</div>
        <div>obj对象name：{{obj.name}}</div>
        
        <div>以下是对v-text的绑定</div>
        <div v-text='msg'></div>
        <div v-text='obj.name'></div>

        <div>以下是对v-html的绑定</div>
        <div v-html='msg2'></div>
        
        <div>实现单向绑定</div>
        <div>点击按钮后执行的函数会改变msg与obj的内容，从而引起视图层的更改</div>
        <button v-on:click='test1'>testFn1</button>
        <button @click='test2'>testFn2</button>
        <button v-on:click='test3'>testFn3</button>

        <div>实现双向绑定</div>
        <div>尝试修改输入框中的内容并观察最上面data中各项的值</div>
        <div>可以观察到对应元素视图层的值与输入框内容同步修改更新</div>
        <input v-model='msg2' type="text" />
        <input v-model='obj.name' type="text" />
        
    </div>
```

js代码部分

```
 constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            new Observer(this.$data)
            new Compiler(this.$el, this)
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
```

js代码部分主要展示了框架的构造观察者，编译器对象以及实现代理等初始化操作

关于单向绑定与双向绑定的效果详见用浏览器打开界面的效果。

## 3：mvvm框架使用

### 3.1 项目启动

此框架启动只需用VS code的Live Server插件构建本地服务器后启动即可在浏览器端运行。

在下载插件后通过VS code打开项目文件夹，使用**Ctrl+Shift+P** 调出命令窗口，输入命令

```
Live Server:Open with Live Server
```

即可启动项目，浏览器会自动打开到对应网址，项目启动成功。

### 3.2 项目测试

测试框架jest依赖npm下载工具

在项目根目录打开命令行使用

```
npm install --save-dev jest
```

下载jest框架

使用命令'npm run test'即可运行测试