const Koa = require('koa')
const koaBody = require('koa-body')
const koaRouter = require('koa-router')
const interceptor = require('./middleware/interceptor')
const staticProxy = require('./middleware/static_proxy')
const staticServer = require('./middleware/static_server')
const apiProxy = require('./middleware/api_proxy')

async function startup({ port = 3000, prefix = '', root = '', url = '', rewrite = '', proxy = [] }) {

	const app = new Koa()

	app.use(interceptor(proxy))
	app.use(koaBody({
		multipart: true,
		formidable: {
			keepExtensions: true,
		},
	}))

	if (url) {
		app.use(staticProxy(prefix, url, rewrite))
	} else {
		app.use(staticServer(prefix, root))
	}

	const router = koaRouter()
	router.all(/^\/.+/, apiProxy(proxy))
	app.use(router.routes()).use(router.allowedMethods())

	app.listen(port)
	console.log(`DevServer start success on part ${port}.`)

}

module.exports = { startup }