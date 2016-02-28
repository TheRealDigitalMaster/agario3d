// IMPORT ASSETS
import '../css/App.scss'
import '../img/feed.png'
import '../img/split.png'
//import virusImage from '../img/virus.png'
import '../audio/spawn.mp3'
import '../audio/split.mp3'
import { THREE } from 'three'
import orbitFn from 'three-orbit-controls'
import flyFn from 'three-fly-controls'
const OrbitControls = orbitFn(THREE),
    FlyControls = flyFn(THREE)
import io from 'socket.io-client'

//TODO switch to FirstPersonControls


function debug(msg) {
    console.log(msg)
}

let camera, controls, scene, renderer, state, socket, me

const startBtn = document.getElementById('start'),
    nameField = document.getElementById('name')
nameField.focus()

startBtn.addEventListener('click', () => {
    startGame(nameField.value)
})

function addBlob(options){
    const material = new THREE.MeshPhongMaterial({color: options.c, shading: THREE.SmoothShading, shininess: options.shininess}),
        mesh = new THREE.Mesh(options.geom, material)
    mesh.position.x = options.x
    mesh.position.y = options.y
    mesh.position.z = options.z
    mesh.updateMatrix()
    mesh.matrixAutoUpdate = false
    return mesh
}


function init(s) {
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xdddddd, 0.003)
    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(scene.fog.color)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const container = document.getElementById('container')
    container.appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.x = state.me.x
    camera.position.y = state.me.y
    camera.position.z = state.me.z

    controls = THREE.FlyControls(camera, renderer.domElement)
    //controls.enableDamping = true
    //controls.dampingFactor = 0.25
    //controls.enableZoom = true


    const {food, viruses, players} = s
    const foodGeom = new THREE.SphereGeometry(food.size, 20, 20),
        virusGeom = new THREE.SphereGeometry(viruses.size, 20, 20)

    food.items.forEach(f => scene.add(addBlob(Object.assign(f, {
        shininess: 10,
        geom: foodGeom
    }))))

    viruses.items.forEach(f => scene.add(addBlob(Object.assign(f, {
        c: viruses.colour,
        shininess: 150,
        geom: virusGeom
    }))))

    players.forEach(f => scene.add(addBlob(Object.assign(f, {
        shininess: 20,
        geom: new THREE.SphereGeometry(5, 20, 20)
    }))))

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

function animate() {
    requestAnimationFrame(animate)
    controls.update() // required if controls.enableDamping = true, or if controls.autoRotate = true
    render()
    socket.emit('position', me)
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
        animate()
    })

    sock.on('update', s => {
        console.log('received an update')
        state = s
    })
}

function startGame(name) {
    socket = setupSocket(io({query: `name=${name}`}))
}
