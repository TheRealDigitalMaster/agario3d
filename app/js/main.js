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


function init() {
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

    const geometry = new THREE.SphereGeometry(10, 20, 20)
    const material = new THREE.MeshPhongMaterial({color: 0xfa9a00, shading: THREE.FlatShading})

    for (let i = 0; i < 500; i++) {
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = ( Math.random() - 0.5 ) * 1000
        mesh.position.y = ( Math.random() - 0.5 ) * 1000
        mesh.position.z = ( Math.random() - 0.5 ) * 1000
        mesh.updateMatrix()
        mesh.matrixAutoUpdate = false
        scene.add(mesh)
    }

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
    //camera.position.z -= 1
    renderer.render(scene, camera)
}

function animate() {
    requestAnimationFrame(animate)
    controls.update() // required if controls.enableDamping = true, or if controls.autoRotate = true
    render()
}

init()
animate()

const socket = io()

function setupSocket() {
    socket.on('pong', () => {
        debug('pong')
    })

    // Handle error.
    socket.on('connect_failed', () => {
        socket.close()
        disconnected = true
    })

    socket.on('disconnect', () => {
        socket.close()
        disconnected = true
    })

    // Handle connection.
    socket.on('welcome', () => {
        debug('welcome')
    })
}
setupSocket(socket)

