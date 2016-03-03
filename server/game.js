/** game dimensions are 1000, 1000, 1000
/** game dimensions are 1000, 1000, 1000
 * @type {{start: module.exports.start, addPlayer: module.exports.addPlayer}}
 */

const config = {
    dimensions: [1000, 1000, 1000],
    startRadius: 30,
    food: {
        num: 500,
        radius: 10
    },
    viruses: {
        num: 20,
        radius: 50,
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

function massFromRadius(radius) {
    return (4 / 3) * Math.PI * (Math.pow(radius, 3))
}

function radiusFromMass(mass) {
    return Math.cbrt(mass / ((4 / 3) * Math.PI))
}

function euclideanDistance(t1, t2) {
    return Math.sqrt(Math.pow((t2.x - t1.x), 2) + Math.pow((t2.y - t1.y), 2) + Math.pow((t2.z - t1.z), 2))
}

function contains(thing1, thing2) {
    const d = euclideanDistance(thing1, thing2)
    return (d + thing2.r) < thing1.r
}

function getThingsOfType(things, type) {
    return Object.keys(things)
        .filter(k => things[k].t === type)
        .map(k => things[k])
}

function checkCollisions(things) {
    const players = getThingsOfType(things, types.player),
        food = getThingsOfType(things, types.food),
        both = players.concat(food)

    players.forEach(p1 => {
        both.forEach(b1 => {
            if (p1 !== b1 && contains(p1, b1)) {
                delete things[b1.id]
                const mass = p1.m + b1.m,
                    rad = radiusFromMass(mass)
                things[p1.id] = Object.assign(p1, {
                    m: mass,
                    r: rad
                })
                console.log(`p1 changed to ${JSON.stringify(things[p1.id])}`)
                console.log('nom nom nom')
            }
        })
    })
    return things
}

function randomPosition(){
    const [x, y, z] = config.dimensions
    return {
        x: ( Math.random() - 0.5 ) * x,
        y: ( Math.random() - 0.5 ) * y,
        z: ( Math.random() - 0.5 ) * z
    }
}

function middle() {
    return {
        x: 250,
        y: 250,
        z: 250
    }
}

function addPlayer(player) {
    let p = things[player.id]
    if (!p) {
        p = Object.assign({
            c: '#ff0000',
            r: config.startRadius,
            t: types.player,
            m: massFromRadius(config.startRadius)
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
    return {
        deleted: Object.keys(prev).filter(k => next[k] === undefined),
        changed: Object.keys(next)
            .filter(k => prev[k] === undefined || prev[k] !== next[k])
            .map(k => next[k])
    }
}

function delta() {
    const d = diff(snapshot, checkCollisions(things))
    snapshot = snapshotState(things)
    return d
}

module.exports = {
    start: (updateFn) => {
        console.log('start game')
        repeatedly(config.food.num, () => {
            const f = Object.assign({
                c: randomColour(),
                id: ++nextId,
                t: types.food,
                r: config.food.radius,
                m: massFromRadius(config.food.radius)
            }, randomPosition())
            things[f.id] = f
        })
        repeatedly(config.viruses.num, () => {
            const v = Object.assign({
                c: config.viruses.colour,
                id: ++nextId,
                t: types.virus,
                r: config.viruses.radius,
                m: massFromRadius(config.viruses.radius)
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
    removePlayer: id => {
        delete things[id]
    },
    addPlayer: player => {
        const p = addPlayer(player)
        return {
            me: p,
            things: diff({}, things).changed,
            config: {
                foodRadius: config.food.radius,
                virusRadius: config.viruses.radius,
                virusColour: config.viruses.colour
            }
        }
    }
}
