import {
    Vector3,
    AxisHelper,
    Scene,
    WebGLRenderer,
    Mesh,
    Clock,
    TextureLoader,
    MeshPhongMaterial,
    SpotLight,
    RepeatWrapping,
    PCFSoftShadowMap,
    PerspectiveCamera,
    AmbientLight,
} from 'three'
import { OrbitControls } from '@/utils/threejs/examples/jsm/controls/OrbitControls' // 相机控件可以对
//import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { TrackballControls } from '@/utils/threejs/examples/jsm/controls/TrackballControls.js' // 修复iOS touchend放大滚动问题

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

// 材质加载
const TextLoad = new TextureLoader()

export default class Base3dObj {
    constructor(root) {
        if (!root || root.tagName.toLocaleLowerCase() !== 'canvas') {
            throw Error('init base3d error')
        }
        this.root = root
        this.renderer = null
        this.mixer = null
        this.camera = null
        this.controls = null

        this.lightVal = 0.5
        this.angleVal = 30
        this.timeS = 0
        this.clocktime = 0
        this.clock = new Clock()
        this.scene = new Scene()
        this.dev = process.env.NODE_ENV !== 'production'

        this.init()
    }
    // 初始化
    init() {
        this.initCamera()
        this.initLight()
        this.initRenderer()
        this.initOrbitControls()
    }

    // 初始化相机&光源
    initCamera() {
        // 相机
        const width = this.root.clientWidth //窗口宽度
        const height = this.root.clientHeight //窗口高度
        const k = width / height //窗口宽高比

        this.camera = new PerspectiveCamera(45, k, 0.1, 1000)
        this.camera.position.set(90, 0, 125)
        this.camera.lookAt(new Vector3(0, 0, 0))
    }

    //光源影响整个场景
    initLight() {
        this.ambientLight = new AmbientLight(0xcccccc)
        this.ambientLight.intensity = 1
        this.ambientLight.power = 0.5

        // SpotLight点光 //聚光灯
        this.spotLight = new SpotLight(0xffffff)
        this.spotLightBack = new SpotLight(0xffffff)
        this.spotLight.position.set(20, -9, 60)
        this.spotLightBack.position.set(-20, 9, -60)
        this.spotLight.intensity = this.lightVal // 光的强弱
        this.spotLightBack.intensity = this.lightVal // 光的强弱
        this.scene.add(this.spotLight)
        this.scene.add(this.spotLightBack)
        this.scene.add(this.ambientLight)
    }

    // 控制器
    initOrbitControls() {
        let type = 0 // 0 TrackballControls || 1 OrbitControls
        // type TrackballControls
        if (type == 0) {
            this.controls = new TrackballControls(
                this.camera,
                this.renderer.domElement
            )
            this.controls.target.set(0, 0, 0)
            this.controls.rotateSpeed = 6.5
            this.controls.panSpeed = 3
            this.controls.staticMoving = 0
            this.controls.zoomSpeed = 2
            this.controls.panSpeed = 5
            this.controls.noZoom = !1
            this.controls.noPan = !0
            this.controls.dampingFactor = 5.1
            this.controls.minDistance = 10
            this.controls.maxDistance = 800
            this.controls.enableDamping = false
        }
        // type OrbitControls
        else {
            this.controls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            )
            this.controls.azimuthAngle = Math.PI * 4

            this.controls.target.set(0, 0, 0)
            this.controls.update()
            this.controls.enableDamping = false
            this.controls.minDistance = 10
            this.controls.maxDistance = 800
            this.controls.enablePan = false
            this.controls.panSpeed = 5.0
            this.controls.keyPanSpeed = 2.0
            this.controls.autoRotate = false
            this.controls.dampingFactor = 0.6
        }
    }

    // 渲染器
    initRenderer() {
        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: this.root,
            transparent: true,
            premultipliedAlpha: true,
            stencil: true,
            preserveDrawingBuffer: true, //是否保存绘图缓冲
            maxLights: 1, //maxLights:最大灯光数
        })
        this.renderer.setSize(this.root.clientWidth, this.root.clientHeight)
        //this.renderer.setClearColor(0x000000, 0)

        // this.renderer.setClearColor(0x808080)
        this.renderer.setPixelRatio(window.devicePixelRatio) // 设置显示比例

        this.renderer.shadowMap.enabled = true

        this.renderer.shadowMap.type = PCFSoftShadowMap
        let axes = new AxisHelper(100)
        this.dev && this.scene.add(axes)
    }

    // 加载Obj
    async preLoaderObj(url, mlt) {
        const loader = new OBJLoader()
        //loader.setCrossOrigin('no-cors')
        return new Promise((resolve, reject) => {
            let _load = loader
            if (mlt) {
                _load = loader.setMaterials(mlt)
            }
            _load.load(
                url,
                (gltf) => {
                    resolve(gltf)
                },
                undefined,
                (e) => {
                    console.error(e)
                    reject(e)
                }
            )
        })
    }
    // 加载贴图
    async preLoaderTexture(baseColorUrl) {
        return new Promise((resolve) => {
            let _load = TextLoad.load(baseColorUrl, (texture) => {
                // resolve(texture)
                //console.log(texture, 'texture')
            })
            resolve(_load)
        })
    }

    async render() {
        const object = await this.preLoaderObj(
            '/assets/obj/desert_eagle/desert_eagle.obj',
            ''
        )

        let material = new MeshPhongMaterial({})

        const basecolorMap = await this.preLoaderTexture(
            '/assets/obj/desert_eagle/map_desert_eagle.jpg'
        )

        material.map = basecolorMap
        material.map.wrapS = RepeatWrapping
        material.map.wrapT = RepeatWrapping
        material.opacity = 0

        /*    */
        //
        // object.position.y = -30

        object.traverse(async (child) => {
            child.scale.set(2, 2, 2)
            console.log(child, 'child')
            if (child instanceof Mesh) {
                child.material = material
                child.castShadow = true
                child.receiveShadow = true
                child.material.needsUpdate = true
            }
        })
        this.scene.add(object)
        this.animate()
    }

    animate() {
        let { controls, scene, camera, renderer } = this
        let delta = this.clock.getDelta()
        controls.update(delta)
        // TEXTSURE_SR 边框流光
        if (this.TEXTSURE_SR) {
            this.TEXTSURE_SR.offset.x -= 0.01
        }
        renderer.render(scene, camera)
        this.anId = requestAnimationFrame(this.animate.bind(this))
    }

    destory() {
        try {
            this.anId && cancelAnimationFrame(this.anId)
            this.scene.clear()
            this.renderer.dispose()
            this.renderer.forceContextLoss()
            this.renderer.content = null
        } catch (e) {
            console.log(e)
        }
    }
}
