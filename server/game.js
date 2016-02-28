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

const food = [],
    viruses = [],
    players = []

let nextId = 0

function findById(list, id) {
    for (let i = 0, l = list.length; i < l; i++) {
        if (list[i].id === id) {
            return list[i]
        }
    }
    return null
}

function findPlayerById(id) {
    return findById(players, id)
}

function randomPosition(){
    const [x, y, z] = config.dimensions
    return {
        x: ( Math.random() - 0.5 ) * x,
        y: ( Math.random() - 0.5 ) * y,
        z: ( Math.random() - 0.5 ) * z
    }
}

function addPlayer(player) {
    let p = findPlayerById(player.id)
    if (!p) {
        p = Object.assign({
            c: '#ff0000',
            s: config.startSize
        }, player, randomPosition())
        players.push(p)
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

function state() {
    return {
        players,
        food: {
            items: food,
            size: config.food.size
        },
        viruses: {
            items: viruses,
            size: config.viruses.size,
            colour: config.viruses.colour
        }
    }
}


//TODO - make sure that when we send an update we only send things that have
//changed position or size

module.exports = {
    start: (updateFn) => {
        console.log('start game')
        repeatedly(config.food.num, () => food.push(Object.assign({
            c: '#ffffff',
            id: ++nextId
        }, randomPosition())))
        repeatedly(config.viruses.num, () => viruses.push(Object.assign({
            c: config.viruses.colour,
            id: ++nextId
        }, randomPosition())))
        setInterval(updateFn, 1000 / config.updatesPerSecond)
    },
    state: state,
    addPlayer: player => {
        const p = addPlayer(player)
        return Object.assign(state(), {me: p})
    }
}
