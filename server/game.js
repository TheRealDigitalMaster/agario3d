/** game dimensions are 1000, 1000, 1000
/** game dimensions are 1000, 1000, 1000
 * @type {{start: module.exports.start, addPlayer: module.exports.addPlayer}}
 */

const config = {
    dimensions: [1000, 1000, 1000],
    startRadius: 30,
    movingFood: true,
    food: {
        num: 500,
        radius: 10
    },
    bots: {
        num: 20,
        colour: 0x0000ff
    },
    viruses: {
        num: 20,
        radius: 50,
        colour: 0x00ff00
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
        bots = getThingsOfType(things, types.bot),
        agents = players.concat(bots),
        food = getThingsOfType(things, types.food),
        both = agents.concat(food)

    agents.forEach(p1 => {
        both.forEach(b1 => {
            if (p1 !== b1 && contains(p1, b1)) {
                delete things[b1.id]
                const mass = p1.m + b1.m,
                    rad = radiusFromMass(mass)
                things[p1.id] = Object.assign(p1, {
                    m: mass,
                    r: rad
                })
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
            c: player.colour,
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

function moveStuff(speed, stuff) {
    const timer = speed * Date.now(),
        [x, y] = config.dimensions
    stuff.forEach(f => {
        things[f.id] = Object.assign({}, f, {
            x: (x / 2) * Math.cos( timer + f.id ),
            y: (y / 2) * Math.sin( timer + f.id * 1.1 )
        })
    })
    return stuff
}

function topUpThings(things, type, min, radius, colour){
    const ofType = getThingsOfType(things, type),
        shortfall = min - ofType.length

    if (shortfall === 0){
        return things
    }

    repeatedly(shortfall, () => {
        const f = Object.assign({
            c: colour,
            id: ++nextId,
            t: type,
            r: radius,
            m: massFromRadius(radius)
        }, randomPosition())
        things[f.id] = f
    })

    console.log(`topped up shortfall of ${shortfall} for type ${type}`)
    return things
}

function delta() {
    //http://threejs.org/examples/#webgl_materials_variations_standard
    if (config.movingFood) {
        moveStuff(0.00001, getThingsOfType(things, types.food))
    }
    moveStuff(0.00003, getThingsOfType(things, types.bot))
    const d = diff(snapshot, checkCollisions(
        topUpThings(
            topUpThings(things, types.bot, config.bots.num, config.startRadius, config.bots.colour),
            types.food, config.food.num, config.food.radius, 0xffffff)))
    snapshot = snapshotState(things)
    return d
}

module.exports = {
    start: (updateFn) => {
        console.log('start game')
        repeatedly(config.food.num, () => {
            const f = Object.assign({
                c: 0xffffff,
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
        repeatedly(config.bots.num, () => {
            const b = Object.assign({
                c: config.bots.colour,
                id: ++nextId,
                name: `Bot ${nextId}`,
                t: types.bot,
                r: config.startRadius,
                m: massFromRadius(config.startRadius)
            }, randomPosition())
            things[b.id] = b
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
                virusColour: config.viruses.colour,
                startRadius: config.startRadius
            }
        }
    }
}
