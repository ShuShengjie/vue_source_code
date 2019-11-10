// new KVue({data:{...}})
const toString = Object.prototype.toString;
class KVue {
    constructor(options) {
        this.$options = options;
        // 数据响应化
        this.$data = options.data;
        this.observe(this.$data);

        // 模拟watcher创建过程
        // new Watcher();
        // // 通过访问属性触发get函数，添加依赖
        // this.$data.test;
        // new Watcher();
        // this.$data.foo.bar;


        new Compile(options.el, this);

        // created执行
        if (options.created) {
            options.created.call(this);
        }
    }

    observe(value){
        if (!value || typeof value !== 'object') {
            return;
        }
        // 遍历该对象
        Object.keys(value).forEach(key => {
            // 定义响应化
            this.defineReactive(value, key, value[key]);
            // 代理data中的属性到vue的实例上
            this.proxyData(key);
        })
    }
    // 数据响应化函数
    defineReactive(obj, key, val) {
        if (toString.call(val) === '[object Object]') {
            this.observe(val);
        }

        const dep = new Dep();

        Object.defineProperty(obj, key, {
            get() {
                Dep.target && dep.addDep(Dep.target);
                return val;
            },
            set(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // console.log(`${key} change: ${val}`);
                dep.notify()
            },
        })
    }

    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(newVal) {
                this.$data[key] = newVal;
            }
        })
    }
}

// Dep: 用来管理Watcher 就是观察者的集合
class Dep {
    constructor() {
        // 这里存放若干依赖（watcher）
        this.deps = [];
    }
    addDep(dep) {
        this.deps.push(dep);
    }
    notify() {
        this.deps.forEach(dep => {
            dep.update();
        })
    }
}

// Watcher
class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        // 将当前watcher的实例指定到Dep静态属性target
        Dep.target = this;
        // 触发get 添加依赖
        this.vm[this.key];
        Dep.target = null;
    }
    update() {
        this.cb.call(this.vm, this.vm[this.key]);
    }
}