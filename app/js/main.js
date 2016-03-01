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
import firstFn from 'three-first-person-controls'
const OrbitControls = orbitFn(THREE),
    FlyControls = flyFn(THREE),
    FirstPersonControls = firstFn(THREE)
import io from 'socket.io-client'

//TODO switch to FirstPersonControls


function debug(msg) {
    console.log(msg)
}

let camera, controls, scene, renderer, socket
const allMeshes = {}

const startBtn = document.getElementById('start'),
    startWrapper = document.getElementById('start-wrapper'),
    nameField = document.getElementById('name')
nameField.focus()

startBtn.addEventListener('click', () => {
    startGame(nameField.value)
    startWrapper.classList.add('hide')
})

function addBlob(options){
    const material = new THREE.MeshPhongMaterial({color: options.c, shading: THREE.SmoothShading, shininess: options.shininess}),
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
    scene.fog = new THREE.FogExp2(0xdddddd, 0.003)
    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(scene.fog.color)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const container = document.getElementById('container')
    container.appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.x = s.me.x
    camera.position.y = s.me.y
    //camera.position.z = s.me.z + 50
    camera.position.z = s.me.z

    controls = THREE.FlyControls(camera, renderer.domElement)
    //controls = THREE.FirstPersonControls(camera, renderer.domElement)
    //controls.movementSpeed = 1000
    //controls.lookSpeed = 0.125
    //controls.lookVertical = true
    //controls.constrainVertical = true
    //controls.verticalMin = 1.1
    //controls.verticalMax = 2.2

    const {things, config} = s,
        shininess = {
            f: 20,
            v: 150,
            p: 20
        },
        geoms = {
            f: new THREE.SphereGeometry(config.foodRadius, 20, 20),
            v: new THREE.SphereGeometry(config.virusRadius, 20, 20),
            p: new THREE.SphereGeometry(20, 20, 20)
        }

    things.forEach(t => scene.add(addBlob(Object.assign(t, {
        shininess: shininess[t.t],
        geom: geoms[t.t]
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
        const {changed, deleted} = s
        changed.forEach(t => {
            const mesh = allMeshes[t.id]
            if (mesh) {
                mesh.position.set(t.x, t.y, t.z)
                mesh.updateMatrix()
            }
        })
        deleted.forEach(id => {
            console.log(`deleted thing ${id}`)
        })
    })
    return sock
}

function startGame(name) {
    socket = setupSocket(io({query: `name=${name}`}))
}
