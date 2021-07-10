import fastify from 'fastify'
import { TedeeApiClient } from 'tedee-api-client'
import jsonfile from 'jsonfile'

let configuration = jsonfile.readFileSync('config.json')

// As per documentation, the update interval should not be below 10 seconds
if (configuration.updateInterval < 10) {
    configuration.updateInterval = 10
}

const tedee = new TedeeApiClient(configuration)

const server = fastify()

server.get('/lock', async (request, reply) => {
    const lock = await tedee.getLockByNameAsync(configuration.deviceName)
    if (!lock) {
        throw { statusCode: 404, message: `Could not find lock ${configuration.deviceName}` }
    }
        
    await tedee.closeAsync(lock)
    return 'locked'
})

server.get('/unlock', async (request, reply) => {
    const lock = await tedee.getLockByNameAsync(configuration.deviceName)
    if (!lock) {
        throw { statusCode: 404, message: `Could not find lock ${configuration.deviceName}` }
    }

    await tedee.openAsync(lock)
    return 'unlocked'
})

server.get('/unlatch', async (request, reply) => {
    const lock = await tedee.getLockByNameAsync(configuration.deviceName)
    if (!lock) {
        throw { statusCode: 404, message: `Could not find lock ${configuration.deviceName}`}
    }

    await tedee.pullSpringAsync(lock)
    return 'unlatched'
})

server.get('/activity/latest', async (request, reply) => {
    const lock = await tedee.getLockByNameAsync(configuration.deviceName)
    if (!lock) {
        throw { statusCode: 404, message: `Could not find lock ${configuration.deviceName}` }
    }
    
    return await tedee.getLatestDeviceActivityAsync(lock)
})

server.get('/activity/:count', async (request, reply) => {
    const lock = await tedee.getLockByNameAsync(configuration.deviceName)
    if (!lock) {
        throw { statusCode: 404, message: `Could not find lock ${configuration.deviceName}` }
    }

    const params = request.params as {count: number}
    return await tedee.getDeviceActivityAsync(lock, params.count)
})

server.listen(configuration.port, configuration.address, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }

    console.log(`Server listening at ${address}`)
})