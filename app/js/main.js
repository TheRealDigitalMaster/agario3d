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

function $get(id) {
    return document.getElementById(id)
}

let camera, controls, scene, renderer, socket, state, me
const allMeshes = {},
    movementSpeed = 3,
    shininess = {
        f: 20,
        v: 150,
        p: 20,
        b: 20
    },
    specular = {
        f: 0x003300,
        v: 0xffffff,
        p: 0xffffff,
        b: 0xffffff
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
            transparent: options.transparent || false,
            opacity: options.opacity || 1,
            wireframe: options.wireframe,
            shininess: options.shininess
        }),
        mesh = new THREE.Mesh(options.geom, material)
    mesh.position.x = options.x
    mesh.position.y = options.y
    mesh.position.z = options.z
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
    camera.position.set(s.me.x, s.me.y, s.me.z)
    camera.lookAt(scene.position)

    const {things, config} = s
    geoms = {
        f: new THREE.SphereGeometry(config.foodRadius, 20, 20),
        v: new THREE.SphereGeometry(config.virusRadius, 20, 20),
        p: new THREE.SphereGeometry(config.startRadius, 20, 20),
        b: new THREE.SphereGeometry(config.startRadius, 20, 20)
    }

    things.forEach(t => {
        scene.add(addBlob(Object.assign(t, {
            shininess: shininess[t.t],
            specular: specular[t.t],
            transparent: t.id === s.me.id,
            opacity: t.id === s.me.id ? 0.3 : 1,
            wireframe: t.id === s.me.id,
            //wireframe: false,
            geom: geoms[t.t]
        })))
        if (t.t === 'p') {
            leaderboard[t.id] = t
        }
    })

    controls = THREE.FlyControls(camera, renderer.domElement)
    //controls = THREE.FirstPersonControls(allMeshes[s.me.id], renderer.domElement)
    controls.movementSpeed = movementSpeed
    controls.rollSpeed = 0.01

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

function pulseViruses(delta) {
    Object.keys(allMeshes).filter(k => allMeshes[k].geometry === geoms.v)
        .forEach(k => {
            const scale = 1 + (Math.sin(delta * 0.005 + parseInt(k, 10)) / 50)
            allMeshes[k].scale.set(scale, scale, scale)
            allMeshes[k].updateMatrix()
        })
}

function animate(delta) {
    requestAnimationFrame(animate)
    pulseViruses(delta)
    controls.update(delta) // required if controls.enableDamping = true, or if controls.autoRotate = true

    render()

    const scale = me.r / state.config.startRadius,
        rel = new THREE.Vector3(1, -20, -140 * Math.sqrt(scale)),
        myMesh = allMeshes[me.id],
        offSet = rel.applyMatrix4(camera.matrix)
    myMesh.position.copy(offSet)

    socket.emit('position', {
        x: offSet.x,
        y: offSet.y,
        z: offSet.z
    })
}


function updateLeaderboard() {
    leaderboardDom.innerHTML = Object.keys(leaderboard)
        .map(k => leaderboard[k])
        .sort((a, b) => a.m < b.m)
        .reduce((txt, p) => txt + `<div style="color: ${p.c}">${p.name} : ${Math.round(p.m)}</div>`, '')
}

function setupSocket(sock) {
    sock.on('pong', () => {
        console.log('pong')
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
                if (t.t === 'p' || t.t === 'b') {
                    const scale = t.r / state.config.startRadius
                    mesh.scale.set(scale, scale, scale)
                    controls.movementSpeed = movementSpeed / scale
                }
                if (t.id !== me.id) {
                    mesh.position.set(t.x, t.y, t.z)
                }
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
                me = t
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
