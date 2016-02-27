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

function debug(msg) {
    console.log(msg)
}

let camera, controls, scene, renderer

const startBtn = document.getElementById('start'),
    nameField = document.getElementById('name')
nameField.focus()

startBtn.addEventListener('click', () => {
    startGame(nameField.value)
})

function addBlob(options){
    const geometry = new THREE.SphereGeometry(options.size, 20, 20),
        material = new THREE.MeshPhongMaterial({color: options.c, shading: THREE.SmoothShading}),
        mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = options.x
    mesh.position.y = options.y
    mesh.position.z = options.z
    mesh.updateMatrix()
    mesh.matrixAutoUpdate = false
    return mesh
}


function init(state) {
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xdddddd, 0.003)
    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(scene.fog.color)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const container = document.getElementById('container')
    container.appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 500

    controls = THREE.FlyControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = true


    const {food, viruses} = state
    food.items.forEach(f => scene.add(addBlob(Object.assign(f, {size: food.size}))))
    viruses.items.forEach(f => scene.add(addBlob(Object.assign(f, {c: viruses.colour, size: viruses.size}))))

    let light = new THREE.DirectionalLight(0xffffff)
    light.position.set(1, 1, 1)
    scene.add(light)

    light = new THREE.DirectionalLight(0x002288)
    light.position.set(-1, -1, -1)
    scene.add(light)

    light = new THREE.AmbientLight(0x222222)
    scene.add(light)

    window.addEventListener('resize', onWindowResize, false)
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
}

function setupSocket(socket) {
    socket.on('pong', () => {
        debug('pong')
    })

    // Handle error.
    socket.on('connect_failed', () => {
        socket.close()
    })

    socket.on('disconnect', () => {
        socket.close()
    })

    // Handle connection.
    socket.on('welcome', (state) => {
        debug(`welcome ${state.player.name} to the game`)
        init(state)
        animate()
    })
}

function startGame(name) {
    setupSocket(io({query: `name=${name}`}))
}
