const fs = require('fs')
const request = require('request')
const PassThrough = require('stream').PassThrough

function _ignorePath(path = '') {
	return path.replace(/(^\/+|\/+$)/g, '')
}

function _getApiUrl(ctx, proxy) {
	let apiUrl = null

	proxy.some(item => {
		const reg = new RegExp(item.location)
		if (reg.test(ctx.path)) {
			const domain = _ignorePath(item.proxy_pass)
			let url = ctx.url
			if (!item.trans_rule) {
				const pureLocation = item.location.replace('^', '').replace('(?:/|$)', '')
				url = url.replace(pureLocation, '')
			}
			apiUrl = `${domain}${url}`
			return true
		}
		return false
	})

	return apiUrl
}

function _getParsedBody(ctx) {

	const options = {}

	const files = ctx.request.files
	if (files && Object.keys(files).length > 0) {
		let formData = {}
		for (let key in files) {
			formData[key] = fs.createReadStream(files[key].path)
		}
		const body = ctx.request.body
		if (body && Object.keys(body).length > 0) {
			for (let key in body) {
				formData[key] = body[key]
			}
		}

		options.formData = formData
	} else {
		const body = ctx.request.body
		if (body && Object.keys(body).length > 0) {
			const contentType = ctx.request.header['content-type'] || ''
			if (~contentType.toLowerCase().indexOf('application/json')) {
				options.body = JSON.stringify(body)
			} else if (~contentType.toLowerCase().indexOf('application/x-www-form-urlencoded')) {
				const params = []
				Object.keys(body).forEach(key => {
					params.push(`${key}=${body[key]}`)
				})
				options.form = params.join('&')
			} else {
				options.body = body
			}
		}
	}

	return options
}

async function _startProxy(ctx, apiUrl) {

	const transHeaders = Object.assign(ctx.request.headers, { 'host': apiUrl.split('/')[2] })

	// 删除content-length
	delete transHeaders['content-length']

	let options = {
		url: apiUrl,
		method: ctx.request.method,
		headers: transHeaders,
		encoding: null
	}

	options = Object.assign(options, _getParsedBody(ctx))

	await new Promise(resolve => {

		ctx.body = request(options).on('error', error => {
			ctx.status = 500
			ctx.body = error.message
			resolve()
		}).on('response', response => {
			console.log(`Proxy Result ${ctx.request.method} ${apiUrl} ${response.statusCode}`)
			ctx.status = response.statusCode
			for (let key in response.headers) {
				// http://stackoverflow.com/questions/35525715/http-get-parse-error-code-hpe-unexpected-content-length
				if (key != 'transfer-encoding') {
					ctx.set(key, response.headers[key])
				}
			}
			ctx.set('api-proxy-forward', apiUrl)

			resolve()
		}).pipe(new PassThrough())

	})
}

function apiProxy(proxy) {

	return async (ctx, next) => {

		if (ctx.isStaticResource) {
			return await next()
		}

		const apiUrl = _getApiUrl(ctx, proxy)
		if (apiUrl) {
			console.log(`Proxy Start ${ctx.request.method} ${ctx.url} -> ${apiUrl}`)
			await _startProxy(ctx, apiUrl)
		} else {
			console.log(`Proxy NotFonud ${ctx.url} -> ${apiUrl}`)
			await next()
		}
	}
}

module.exports = apiProxy