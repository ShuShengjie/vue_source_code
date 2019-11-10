// 用法 new Compile(el, vm)
class Compile{
    constructor(el, vm) {
        // 要遍历的宿主节点
        this.$el = document.querySelector(el);
        this.$vm = vm;
        // 编译
        if (this.$el) {
            // 转换内部的内容为片段Fragment
            this.$fragment = this.node2Fragment(this.$el);
            // 执行编译
            this.compile(this.$fragment);
            // 将编译完的html追加至$el
            this.$el.appendChild(this.$fragment);
        }
    }
    // 将宿主元素中的代码片段拿出来遍历，这样做高效
    node2Fragment(el){
        const frag = document.createDocumentFragment();
        // 将el中所有子元素搬家至frag中
        let child;
        while (child = el.firstChild) {
            // appendChild是移动操作，将el中的元素拿出来
            frag.appendChild(child);
        }
        return frag;
    };
    compile(el){
        const childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            // 类型判断
            if (this.isElement(node)) {
                // 元素
                // console.log('编译元素' + node.nodeName);
                const nodeAttrs = node.attributes;
                Array.from(nodeAttrs).forEach(attr => {
                    // 属性名
                    const attrName = attr.name;
                    // 属性值
                    const exp = attr.value;
                    if (this.isDirective(attrName)) {
                        // 是否为实例 k-text
                        const dir = attrName.substring(2);
                        // 执行指令
                        this[dir] && this[dir](node, this.$vm, exp);
                    }
                    if (this.isEvent(attrName)) {
                        // 是否为事件
                        const dir = attrName.substring(1);
                        this.eventHandler(node, this.$vm, exp, dir);
                    }
                })
            } else if (this.isInterpolation(node)) {
                // 文本
                // console.log('便以文本' + node.textContent);
                this.compileText(node);
            }

            // 递归子节点
            if (node.childNodes && node.childNodes.length > 0) {
                this.compile(node);
            }
        })
    };
    // 判断是否为元素
    isElement(node) {
        return node.nodeType === 1;
    }
    // 插值文本
    isInterpolation(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
    }
    // 判断是否为属性
    isDirective(attr) {
        return attr.indexOf('k-') === 0;
    }
    // 判断是否为事件
    isEvent(attr) {
        return attr.indexOf('@') === 0;
    }
    // 编译插值文本
    compileText(node) {
        // console.log(RegExp.$1);
        // node.textContent = this.$vm.$data[RegExp.$1];
        this.update(node, this.$vm, RegExp.$1, 'text');
    }
    // 更新函数
    update(node, vm, exp, dir) {
        const updaterFn = this[dir+'Updater'];
        // 初始化
        updaterFn && updaterFn(node, vm[exp]);
        // 依赖收集
        new Watcher(vm, exp, function(value) {
            updaterFn && updaterFn(node, value);
        })
    }

    // k-text
    text(node, vm, exp) {
        this.update(node, this.$vm, exp, 'text');
    }
    // k-model
    model(node, vm, exp) {
        // 制定input的value属性
        this.update(node, vm, exp, 'model');
        // 视图对于模型的响应
        node.addEventListener('input', e => {
            vm[exp] = e.target.value;
        })
    }
    modelUpdater(node, value) {
        node.value = value;
    }

    // k-html
    htmlUpdater(node, value){
        console.log(node, value)
        node.innerHTML = value;
    }

    textUpdater(node, value) {
        node.textContent = value;
    }

    // 事件处理器
    eventHandler(node, vm, exp, dir) {
        let fn = vm.$options.methods && vm.$options.methods[exp];
        if (dir && fn) {
            node.addEventListener(dir, fn.bind(vm));
        }
    }
}