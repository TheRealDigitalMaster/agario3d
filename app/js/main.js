// IMPORT ASSETS
import '../css/App.scss'
import '../img/feed.png'
import '../img/split.png'
//import virusImage from '../img/virus.png'
import '../audio/spawn.mp3'
import '../audio/split.mp3'
import '../audio/plop.mp3'
import { THREE } from 'three'
import orbitFn from 'three-orbit-controls'
import flyFn from 'three-fly-controls'
import firstFn from 'three-first-person-controls'
const OrbitControls = orbitFn(THREE),
    FlyControls = flyFn(THREE),
    FirstPersonControls = firstFn(THREE)
import io from 'socket.io-client'

//TODO switch to FirstPersonControls


function debug(msg) {
    console.log(msg)
}

function $get(id) {
    return document.getElementById(id)
}

let camera, controls, scene, renderer, socket, state
const allMeshes = {},
    movementSpeed = 3,
    shininess = {
        f: 20,
        v: 150,
        p: 20
    },
    specular = {
        f: 0x003300,
        v: 0xffffff,
        p: 0xffffff
    }
let geoms = { }

const startBtn = $get('start'),
    startWrapper = $get('start-wrapper'),
    nameField = $get('name'),
    nameLabel = $get('my-name'),
    colourField = $get('colour'),
    massLabel = $get('my-mass'),
    radiusLabel = $get('my-radius'),
    speedLabel = $get('my-speed'),
    leaderboardDom = $get('leaderboard'),
    spawnAudio = $get('spawn_cell'),
    eatAudio = $get('eat'),
    leaderboard = {}
nameField.focus()

startBtn.addEventListener('click', () => {
    startGame(nameField.value, colourField.value)
    startWrapper.classList.add('hide')
})

function addBlob(options){
    const material = new THREE.MeshPhongMaterial({
            color: options.c,
            specular: options.specular,
            shininess: options.shininess
        }),
        mesh = new THREE.Mesh(options.geom, material)
    mesh.position.x = options.x
    mesh.position.y = options.y
    mesh.position.z = options.z
    mesh.updateMatrix()
    mesh.matrixAutoUpdate = false
    allMeshes[options.id] = mesh
    return mesh
}

function init(s) {
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002)
    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(scene.fog.color)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const container = $get('container')
    container.appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.x = s.me.x
    camera.position.y = s.me.y
    //camera.position.z = s.me.z + 50
    camera.position.z = s.me.z

    controls = THREE.FlyControls(camera, renderer.domElement)
    //controls = THREE.FirstPersonControls(camera, renderer.domElement)
    controls.movementSpeed = movementSpeed
    controls.rollSpeed = 0.01
    //controls.lookSpeed = 0.125
    //controls.lookVertical = true
    //controls.constrainVertical = true
    //controls.verticalMin = 1.1
    //controls.verticalMax = 2.2

    const {things, config} = s
    geoms = {
        f: new THREE.SphereGeometry(config.foodRadius, 20, 20),
        v: new THREE.SphereGeometry(config.virusRadius, 20, 20),
        p: new THREE.SphereGeometry(config.startRadius, 20, 20)
    }

    things.forEach(t => {
        scene.add(addBlob(Object.assign(t, {
            shininess: shininess[t.t],
            specular: specular[t.t],
            geom: geoms[t.t]
        })))
        if (t.t === 'p') {
            leaderboard[t.id] = t
        }
    })

    let light = new THREE.DirectionalLight(0xffffff)
    light.position.set(1, 1, 1)
    scene.add(light)

    light = new THREE.DirectionalLight(0x002288)
    light.position.set(-1, -1, -1)
    scene.add(light)

    light = new THREE.AmbientLight(0x222222)
    scene.add(light)

    window.addEventListener('resize', onWindowResize, false)
    return s
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function render() {
    renderer.render(scene, camera)
}

let prevPosition = {
    x: 0,
    y: 0,
    z: 0
}

function animate() {
    requestAnimationFrame(animate)
    controls.update() // required if controls.enableDamping = true, or if controls.autoRotate = true
    render()
    if (prevPosition.x !== camera.position.x
        || prevPosition.y !== camera.position.y
        || prevPosition.z !== camera.position.z) {
        socket.emit('position', {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        })
        prevPosition = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        }
    }
}

let me

function updateLeaderboard() {
    leaderboardDom.innerHTML = Object.keys(leaderboard)
        .map(k => leaderboard[k])
        .sort((a, b) => a.m < b.m)
        .reduce((txt, p) => txt + `<div style="color: ${p.c}">${p.name} : ${Math.round(p.m)}</div>`, '')
}

function setupSocket(sock) {
    sock.on('pong', () => {
        debug('pong')
    })

    // Handle error.
    sock.on('connect_failed', () => {
        sock.close()
    })

    sock.on('disconnect', () => {
        sock.close()
    })

    // Handle connection.
    sock.on('welcome', (s) => {
        state = init(s)
        me = state.me
        nameLabel.innerText = `Name: ${me.name}`   //TODO: xss vulnerability - html encode
        animate()
    })

    sock.on('update', s => {
        const {changed, deleted} = s
        changed.forEach(t => {
            const mesh = allMeshes[t.id]
            if (mesh) {
                if (t.t === 'p') {
                    const scale = t.r / state.config.startRadius
                    mesh.scale.set(scale, scale, scale)
                    controls.movementSpeed = movementSpeed / scale
                }
                mesh.position.set(t.x, t.y, t.z)
                mesh.updateMatrix()
            } else {
                console.log(`we got a new thing ${JSON.stringify(t)}`)
                scene.add(addBlob(Object.assign(t, {
                    shininess: shininess[t.t],
                    specular: specular[t.t],
                    geom: geoms[t.t]
                })))
            }
            if (t.id === me.id) {
                massLabel.innerText = `Mass: ${Math.round(t.m)}`
                radiusLabel.innerText = `Radius: ${Math.round(t.r)}`
                speedLabel.innerText = `Speed: ${Math.round(controls.movementSpeed * 100)}`
            }
            if (t.t === 'p') {
                leaderboard[t.id] = t
            }
        })
        deleted.forEach(id => {
            console.log(`deleted thing ${id}`)
            scene.remove(allMeshes[id])
            delete leaderboard[id]
            if (id === me.id) {
                alert('You is dead!')
                window.location.reload()
            }
            eatAudio.play()
        })
        updateLeaderboard()
    })
    return sock
}

function startGame(name, colour) {
    socket = setupSocket(io({query: `name=${name}&colour=${colour}`}))
}
