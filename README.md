1、安装@fedhong/dev-server模块

npm install @fedhong/dev-server --save-dev

2、在项目里添加server.js（名字随便起，位置随便放），内容如下：

```
const app = require('@fedhong/dev-server')

app.startup({    
    port: 3000, // devServer启动的端口    
    prefix: '/', // 访问页面的前缀
    root: '/', // 静态服务方式一：本地静态文件目录（这种情况适用于：编译工具编译到文件的方式，将root指向到dist或者build文件夹）
    url: 'http://localhost:3001',// 静态服务方式二：HTTP静态文件的URL（这种方式适用于：webpack编译到内存，将url指向webpack启动的服务地址端口上，若配置该项优先级高于root）    
    rewrite: '/', // 重写路径（例如：webpack编译的html目录，则配置rewrite:/html）
    proxy: [
        {
            "location": "/xxx",// 代理规则
            "proxy_pass": "http://api.xxx.com",// 代理接口的地址
            "trans_rule": true // 是否传递代理规则
        }
    ]
});
```

3、启动server

node server.js

4、访问

默认为：http://localhost:3000 + prefix + /页面.html
