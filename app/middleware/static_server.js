const resolve = require('path').resolve;
const send = require('koa-send');

function staticServer(prefix, root) {

	return async (ctx, next) => {

		if (!ctx.isStaticResource) {
            return await next()
        }

		if (prefix && ctx.path.indexOf(prefix) != 0) {
			ctx.status = 404
			return await next()
		}

		let opts = {
			root: resolve(root),
			index: 'index.html'
		}

		let done = false

		if (ctx.method === 'HEAD' || ctx.method === 'GET') {
			try {
				done = await send(ctx, ctx.path.replace(prefix, ''), opts)
			} catch (err) {
				if (err.status !== 404) {
					throw err
				}
			}
		}

		if (!done) {
			await next()
		}
	}
}

module.exports = staticServer