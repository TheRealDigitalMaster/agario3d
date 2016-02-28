/** game dimensions are 1000, 1000, 1000
 * @type {{start: module.exports.start, addPlayer: module.exports.addPlayer}}
 */

const config = {
    dimensions: [1000, 1000, 1000],
    startSize: 5,
    food: {
        num: 500,
        size: 10
    },
    viruses: {
        num: 20,
        size: 50,
        colour: '#00ff00'
    },
    updatesPerSecond: 60
}

const types = {
    food: 'f',
    virus: 'v',
    player: 'p',
    bot: 'b'
}

const things = {}
let snapshot = {}

let nextId = 0

function randomPosition(){
    const [x, y, z] = config.dimensions
    return {
        x: ( Math.random() - 0.5 ) * x,
        y: ( Math.random() - 0.5 ) * y,
        z: ( Math.random() - 0.5 ) * z
    }
}

function addPlayer(player) {
    let p = things[player.id]
    if (!p) {
        p = Object.assign({
            c: '#ff0000',
            s: config.startSize,
            t: types.player
        }, player, randomPosition())
        things[player.id] = p
    }
    return p
}

function randomColour(){
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
}

function repeatedly(n, fn){
    for (let i = 0; i < n; i++){
        fn()
    }
}

function snapshotState(state) {
    const c = {}
    Object.keys(state).forEach(k => c[k] = state[k])
    return c
}

function diff(prev, next) {
    return Object.keys(next)
        .filter(k => prev[k] === undefined || prev[k] !== next[k])
        .map(k => next[k])
}

function delta() {
    const d = diff(snapshot, things)
    snapshot = snapshotState(things)
    return d
}

module.exports = {
    start: (updateFn) => {
        console.log('start game')
        repeatedly(config.food.num, () => {
            const f = Object.assign({
                c: '#ffffff',
                id: ++nextId,
                t: types.food
            }, randomPosition())
            things[f.id] = f
        })
        repeatedly(config.viruses.num, () => {
            const v = Object.assign({
                c: config.viruses.colour,
                id: ++nextId,
                t: types.virus
            }, randomPosition())
            things[v.id] = v
        })
        setInterval(updateFn, 1000 / config.updatesPerSecond)
        return delta()
    },
    updatePosition: (id, pos) => {
        if (things[id]) {
            things[id] = Object.assign({}, things[id], pos)
        }
    },
    delta: delta,
    addPlayer: player => {
        const p = addPlayer(player)
        return {
            me: p,
            things: diff({}, things),
            config: {
                foodSize: config.food.size,
                virusSize: config.viruses.size,
                virusColour: config.viruses.colour
            }
        }
    }
}
