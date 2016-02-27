/** game dimensions are 1000, 1000, 1000
 * @type {{start: module.exports.start, addPlayer: module.exports.addPlayer}}
 */

const dimensions = [1000, 1000, 1000]

const food = []

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
        const [x, y, z] = dimensions
        repeatedly(500, () => food.push({
            x: ( Math.random() - 0.5 ) * x,
            y: ( Math.random() - 0.5 ) * y,
            z: ( Math.random() - 0.5 ) * z,
            c: randomColour()
        }))
    },
    addPlayer: name => {
        return {
            player: {
                name: name
            },
            food: food
        }
    }
}
