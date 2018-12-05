const request = require('request')
const PassThrough = require('stream').PassThrough

function _startProxy(ctx, prefix, url, pathRewrite) {

    const transHeaders = Object.assign(ctx.request.headers, { 'host': url.split('/')[2] })
    delete transHeaders['content-length']

    const option = {
        url: url + ctx.url.replace(prefix, pathRewrite),
        method: ctx.request.method,
        headers: transHeaders,
        encoding: null
    }

    return new Promise(resolve => {

        ctx.body = request(option).on('error', error => {
            ctx.status = 500
            ctx.body = error.message
            resolve()
        }).on('response', response => {
            ctx.status = response.statusCode
            for (let key in response.headers) {
                if (key != 'transfer-encoding') {
                    ctx.set(key, response.headers[key])
                }
            }
            resolve()
        }).pipe(new PassThrough())

    })
}

function staticProxy(prefix, url, pathRewrite) {

    return async (ctx, next) => {

        if (!ctx.isStaticResource) {
            return await next()
        }
        await _startProxy(ctx, prefix, url, pathRewrite)
    }
}

module.exports = staticProxy