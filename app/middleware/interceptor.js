/**
 * 判断目标字符串是否以一个字符串开始
 * @param {String} target 目标字符串
 * @param {String} str 开始字符串
 * @param {Boolean} ignoreCase 忽略大小写，可空，默认false
 * @return {Boolean}
 */
function startWith(target, str, ignoreCase) {
	var startStr = target.substr(0, str.length);
	return ignoreCase ?
		startStr.toLowerCase() === str.toLowerCase() :
		startStr === str;
}

/**
 * 判断目标字符串是否以一个字符串结尾
 * @param {String} target 目标字符串
 * @param {String} str 结尾字符串
 * @param {Boolean} ignoreCase 忽略大小写，可空，默认false
 * @return {Boolean}
 */
function endWith(target, str, ignoreCase) {
	var endStr = target.substring(target.length - str.length);
	return ignoreCase ?
		endStr.toLowerCase() === str.toLowerCase() :
		endStr === str;
}

function _isStaticResource(proxy, path) {
	return !proxy.some(item => {
		return startWith(path, item.location) && !endWith(path, '.html') && !endWith(path, '.js') && !endWith(path, '.css')
	})
}

function interceptor(proxy) {
	return async (ctx, next) => {
		try {
			ctx.path = ctx.path.replace(/\/+/g, '/')
			if (ctx.path === '/') {
				ctx.status = 200
				ctx.body = `<h1 style="text-align:center;line-height:500px;">Welcome to Dev Server!</h1>`
			} else {
				ctx.isStaticResource = _isStaticResource(proxy, ctx.path)
				await next()
				console.log(`${ctx.method} ${ctx.url} ${ctx.status}`)
			}
		} catch (err) {
			ctx.status = err.status || 500
			ctx.body = err.message
			console.error(err.stack)
		}
	}
}

module.exports = interceptor