/** game dimensions are 1000, 1000, 1000
 * @type {{start: module.exports.start, addPlayer: module.exports.addPlayer}}
 */

const config = {
    dimensions: [1000, 1000, 1000],
    food: {
        num: 500,
        size: 10
    },
    viruses: {
        num: 20,
        size: 50,
        colour: '#00ff00'
    }
}

const food = [],
    viruses = []

function randomColour(){
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
}

function repeatedly(n, fn){
    for (let i = 0; i < n; i++){
        fn()
    }
}

module.exports = {
    start: () => {
        console.log('start game')
        const [x, y, z] = config.dimensions
        repeatedly(config.food.num, () => food.push({
            x: ( Math.random() - 0.5 ) * x,
            y: ( Math.random() - 0.5 ) * y,
            z: ( Math.random() - 0.5 ) * z,
            c: randomColour()
        }))
        repeatedly(config.viruses.num, () => viruses.push({
            x: ( Math.random() - 0.5 ) * x,
            y: ( Math.random() - 0.5 ) * y,
            z: ( Math.random() - 0.5 ) * z,
            c: config.viruses.colour
        }))
    },
    addPlayer: name => {
        return {
            player: {
                name: name
            },
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
}
