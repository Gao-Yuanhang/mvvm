// 初始化视图及更新视图类
const updater = {
    textUpdater(node, exprVal) {
        node.textContent = exprVal
    },
    htmlUpdater(node, exprVal) {
        node.innerHTML = exprVal
    },
    modelUpdater(node, exprVal) {
        node.value = exprVal
    }
}

export default updater