import {
    MOUSE,
    Vector2,
    Vector3,
    Vector4,
    Euler,
    Quaternion,
    Matrix4,
    Spherical,
    Box3,
    Sphere,
    Raycaster,
    MathUtils,
    AxisHelper,
    LineBasicMaterial,
    Line,
    CubeGeometry,
    MeshStandardMaterial,
    sRGBEncoding,
    ReinhardToneMapping,
    HemisphereLight,
    Group,
    Scene,
    WebGLRenderer,
    Mesh,
    Clock,
    BoxGeometry,
    TextureLoader,
    MeshPhongMaterial,
    ScreenSpacePanning,
    Color,
    CameraHelper,
    SpotLight,
    ShaderMaterial,
    CircleGeometry,
    SphereGeometry,
    FrontSide,
    ImageLoader,
    RepeatWrapping,
    ClampToEdgeWrapping,
    MeshPhysicalMaterial,
    SpotLightHelper,
    PCFSoftShadowMap,
    PMREMGenerator,
    RectAreaLight,
    Perspective,
    PerspectiveCamera,
    BoxBufferGeometry,
    PointLight,
    AmbientLight,
    AnimationMixer,
    PlaneGeometry,
    BufferGeometry,
    PlaneBufferGeometry,
    MeshBasicMaterial,
    DirectionalLight,
    DoubleSide,
    MeshNormalMaterial,
} from 'three'
const subsetOfTHREE = {
    MOUSE: MOUSE,
    Vector2: Vector2,
    Vector3: Vector3,
    Vector4: Vector4,
    Quaternion: Quaternion,
    Matrix4: Matrix4,
    Spherical: Spherical,
    Box3: Box3,
    Sphere: Sphere,
    Raycaster: Raycaster,
    MathUtils: {
        DEG2RAD: MathUtils.DEG2RAD,
        clamp: MathUtils.clamp,
    },
}

import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import CameraControls from 'camera-controls'
import { OrbitControls } from '@/utils/threejs/examples/jsm/controls/OrbitControls' // 相机控件可以对Threejs的三维场景进行缩放、平移、旋转操作
import { ArcballControls } from '@/utils/threejs/examples/jsm/controls/ArcballControls' // 相机控件可以对Threejs的三维场景进行缩放、平移、旋转操作

//import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { TrackballControls } from '@/utils/threejs/examples/jsm/controls/TrackballControls.js' // 修复iOS touchend放大滚动问题
import { CameraSpinControls } from '@/utils/threejs/examples/jsm/controls/CameraSpinControls.js' // 修复iOS touchend放大滚动问题
import { DecalGeometry } from '@/utils/threejs/examples/jsm/geometries/DecalGeometry'
import OrbitUnlimitedControls from '@/utils/threejs/examples/jsm/controls/OrbitUnlimitedControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { URShader } from '@/utils/3djs/index' //材质加载器|扫光shader
// 如果需要mock数据，请打开 objModels 对应的参数
import {
    mock_mtl_ak47,
    mock_mtl_glove_sporty,
    mock_mtl_knife_m9_bay,
    mock_mtl_desert_eagle,
    mock_mtl_aug,
    mock_mtl_cube,
} from '@/mock/mock_3d_data.js'
// 材质加载
const TextLoad = new TextureLoader()
let _Group = new Group()
CameraControls.install({ THREE: subsetOfTHREE })

const mouse = new Vector2()
let mouseHelper = null
mouseHelper = new Mesh(
    new BoxBufferGeometry(1, 1, 10),
    new MeshNormalMaterial()
)
mouseHelper.visible = false

// 定义一条线
let gLine

export default class Base3dObj {
    constructor(root, good) {
        if (!root || root.tagName.toLocaleLowerCase() !== 'canvas') {
            throw Error('init base3d error')
        }
        this.root = root
        this.renderer = null
        this.mixer = null
        this.camera = null
        this.controls = null
        this.TEXTSURE_Loading = null
        this.isloaded = false
        this.rotateSpeedSecond = 1000
        this.disabledAutoRotate = true
        this.tBrightness = 0.1

        // 初始化相关参数
        this.selectedMesh = null
        /* 贴花 */
        // 设置相交面参数
        this.intersection = {
            intersects: false,
            point: new Vector3(),
            normal: new Vector3(),
        }

        // 贴花参数初始化
        this.decalParams = {
            position: new Vector3(),
            orientation: new Euler(),
            minScale: 0.1,
            maxScale: 0.2,
            size: new Vector3(5, 5, 5),
        }
        this.raycaster = new Raycaster()
        this.intersects = []
        // 贴花数组
        this.decals = []
        this.decalMaterial = null

        this.lightVal = 0.5
        this.angleVal = 30
        this.Ani_UR_TYPE = 1
        this.timeS = 0
        this.clocktime = 0
        this.clock = new Clock()
        this.scene = new Scene()
        this.dev = process.env.NODE_ENV !== 'production'
        this.intersectionValue = {
            //用于存储交叉点信息
            intersects: false,
            point: new THREE.Vector3(),
            normal: new THREE.Vector3(),
        }
        this.good = good

        this.init()
    }

    init() {
        this.initCamera()
        this.initLight()
        this.initRenderer()
        this.initOrbitControls()
        this.initMouse()
    }

    // 初始化相机&光源
    initCamera() {
        // 相机
        const width = this.root.clientWidth //窗口宽度
        const height = this.root.clientHeight //窗口高度
        const k = width / height //窗口宽高比

        this.camera = new PerspectiveCamera(45, k, 0.1, 1000)
        // this.camera.position.set(-130, 0, 125)
        //this.camera.lookAt(this.scene.position)
        this.camera.position.set(90, 0, 125)
        this.camera.lookAt(new Vector3(0, 0, 0))
    }

    initLight() {
        //光源影响整个场景
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
        // this.scene.add(new THREE.HemisphereLight(0x443333, 0x222233, 4))
        //方向光
        /*  let directionalLight = new DirectionalLight(0xffffff, 1)
        directionalLight.position.set(150, 300, 200)
        this.scene.add(directionalLight) */

        /*   this.pointLight = new THREE.PointLight(0x333333, 1) //光源设置
        this.pointLight.position.set(300, 400, 200) //点光源位置
        this.pointLight.intensity = 1 */
        // this.scene.add(this.pointLight) //将光源添加到场景中
    }
    changeLight(val) {
        // this.ambientLight.intensity = val
        this.spotLight.intensity = val
        this.spotLightBack.intensity = val
        this.tBrightness = val
        //this.pointLight.intensity = val*5
    }
    changeRotate(val) {
        this.controls.autoRotate = true
        this.rotateSpeedSecond = val
        this.timeS = 0
        //this.controls.autoRotateSpeed = val
    }

    initMouse() {
        let that = this
        let moved = false
        window.addEventListener('pointerup', function (event) {
            if (moved === false) {
                // that.checkIntersection(event.clientX, event.clientY)
                //  console.log(JSON.stringify(that.intersection), 'intersection')
                //if (that.intersection.intersects) that.addDecal()
            }
        })

        window.addEventListener('pointermove', function (event) {
            if (event.isPrimary) {
                //   that.checkIntersection(event.clientX, event.clientY)
            }
        })
        window.addEventListener('pointerdown', function () {
            moved = false
        })
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
            /* this.controls.noZoom = !1
            this.controls.noPan = !0 */
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
            /*  this.controls.mouseButtons = {
                LEFT: MOUSE.LEFT,
                MIDDLE: MOUSE.MIDDLE,
                RIGHT: MOUSE.RIGHT,
            } */
        } else if (type == 2) {
            this.controls = new CameraControls(
                this.camera,
                this.renderer.domElement
            )
            this.controls.azimuthAngle = Math.PI * 4
            this.controls.enableTransition = true
            this.controls.minDistance = 10
            this.controls.maxDistance = 800
            this.controls.verticalDragToForward = true

            this.controls.update()
        } else if (type == 3) {
            this.controls = new ArcballControls(
                this.camera,
                this.renderer.domElement
            )
            this.controls.azimuthAngle = Math.PI * 4
            this.controls.enableTransition = true
            this.controls.minDistance = 10
            this.controls.maxDistance = 800
            this.controls.verticalDragToForward = true

            this.controls.update()
        } else if (type == 4) {
            this.controls = new OrbitUnlimitedControls(
                this.camera,
                this.renderer.domElement
            )

            this.controls.update()
        } else if (type == 5) {
            this.controls = new CameraSpinControls(
                this.camera,
                this.renderer.domElement
            )
            this.controls.zoomSpeed = 2
            this.controls.maxDistance = 800
        }
        // type OrbitControls
        else {
            this.controls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            )
            this.controls.azimuthAngle = Math.PI * 4
            // 左右旋转范围
            /* this.controls.minAzimuthAngle = -Infinity
            this.controls.maxAzimuthAngle = Infinity */
            // These values do not work:
            /*         this.controls.maxAzimuthAngle = (200 * Math.PI) / 180
            this.controls.minAzimuthAngle = (160 * Math.PI) / 180
            this.controls.minPolarAngle = ((90 - 10) * Math.PI) / 180
            this.controls.maxPolarAngle = ((90 + 10) * Math.PI) / 180 */
            /*  this.controls.target.x = 0.8
            this.controls.target.y = 4.5
            this.controls.target.z = 33.1 */

            this.controls.target.set(0, 0, 0)
            this.controls.update()
            this.controls.enableDamping = false
            this.controls.minDistance = 10
            this.controls.maxDistance = 800
            this.controls.enablePan = false
            //this.panningMode = ScreenSpacePanning
            this.controls.panSpeed = 5.0
            //this.controls.panningMode = THREE.ScreenSpacePanning // alternate THREE.HorizontalPanning
            this.controls.keyPanSpeed = 2.0
            this.controls.autoRotate = false
            this.controls.dampingFactor = 0.6
            this.controls.screenSpacePanning = false
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
        if (this.good.type == '手套1') {
            this.renderer.outputEncoding = sRGBEncoding
            this.renderer.toneMapping = ReinhardToneMapping
            this.renderer.toneMappingExposure = 3
        }
        // this.renderer.setClearColor(0x808080)
        this.renderer.setPixelRatio(window.devicePixelRatio) // 设置显示比例

        this.renderer.shadowMap.enabled = true

        this.renderer.shadowMap.type = PCFSoftShadowMap
        let axes = new AxisHelper(100)
        // this.dev && this.scene.add(axes)
        this.scene.add(mouseHelper)
    }

    //material资源加载
    async preLoaderMTL(url) {
        const mTLLoader = new MTLLoader()
        // mTLLoader.setPath('/assets/obj/')

        return new Promise((resolve, reject) => {
            mTLLoader.load(
                url,
                (mtl) => {
                    resolve(mtl)
                },
                undefined,
                (e) => {
                    console.error(e)
                    reject(e)
                }
            )
        })
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
    async preLoaderTexture(baseColorUrl) {
        return new Promise((resolve) => {
            let _load = TextLoad.load(baseColorUrl, (texture) => {
                // resolve(texture)
                //console.log(texture, 'texture')
            })
            resolve(_load)
        })
    }

    async wait(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('Done waiting')
                resolve(ms)
            }, ms)
        })
    }

    async createMesh(url) {
        // 预留带水印？
        return new Promise((resolve) => {
            TextLoad.load(url, (texture) => {
                const SIZE = 20
                const img = texture.image
                let height = (img && img.height) || SIZE
                let width = (img && img.width) || SIZE
                height = (SIZE / width) * height
                width = SIZE
                const mat = new MeshBasicMaterial({})
                mat.map = texture
                mat.map.wrapT = RepeatWrapping
                mat.map.wrapS = RepeatWrapping
                mat.transparent = true
                const geom = new BoxGeometry(width, height, SIZE)
                const cube = new Mesh(geom, mat)
                resolve(cube)
            })
        })
    }

    //获取当前贴图
    /**
     *
     * @param {物品名称} goodName
     * @param {物品类型} goodType
     * @param {模型名称} objName
     * @param {3d贴图} inspect3dUrls
     * @param {obj位置} m_index
     */
    getBaseColorUrl(goodName, goodType, objName, inspect3dUrls, m_index) {
        let nameOfObj = objName.replace('.obj', '') || ''
        let lenUrls = (inspect3dUrls && inspect3dUrls.length) || 0
        //特殊 inspect3dUrls.leng为3时，自带有镜身(ssg08)
        if (lenUrls == 3 && nameOfObj == '0_0') nameOfObj = '0_1'
        if (lenUrls == 3 && objName == 'snip_ssg08_scope.obj') nameOfObj = '0_0'
        //console.log(goodType, 'goodType')
        if (goodType == '手套') {
            if (nameOfObj == '0_0') nameOfObj = '0_1'
            else if (nameOfObj == '0_1.obj') nameOfObj = '0_0'
        }
        let img = ''
        if (inspect3dUrls) {
            inspect3dUrls.filter((item) => {
                if (item.indexOf(nameOfObj) > -1) {
                    img = item
                }
            })
        }
        //特殊贴图处理:如aug
        //console.log(goodName, objName, 'goodName, nameOfObj')
        if (/(aug|ssg 08)/gi.test(goodName.toLowerCase())) {
            switch (true) {
                case objName.indexOf('snip_ssg08_scope.obj') > -1 &&
                    lenUrls == 2:
                    img =
                        'https://static.pwesports.cn/esportsadmin/esports/csgo/3d/textures/ssg08/snip_ssg08_scope.png'
                    break
                case objName.indexOf('rif_aug_scope.obj') > -1:
                    img =
                        'https://static.pwesports.cn/esportsadmin/esports/csgo/3d/textures/aug/rif_aug_scope.png?v=1'
                    break
                case objName.indexOf('glass.obj') > -1:
                    img =
                        'https://static.pwesports.cn/esportsadmin/esports/csgo/3d/textures/aug/scope_lens_reflect_mask.png'
                    break
                case objName.indexOf('scope_lens_dirt') != -1:
                    img =
                        'https://static.pwesports.cn/esportsadmin/esports/csgo/3d/textures/aug/scope_lens_dirt.png'
                    break
                case objName.indexOf('scope_aug') != -1:
                    img =
                        'https://static.pwesports.cn/esportsadmin/esports/csgo/3d/textures/aug/scope.png'
                    break
            }
            //console.log(img, 'img')
        }

        return img
    }
    //获取高光贴图
    findSpecularMap(mapLen, m_index, inspect3dUrls) {
        let img = '',
            reg = mapLen + '_' + m_index
        if (inspect3dUrls) {
            inspect3dUrls.filter((item) => {
                if (item.indexOf(reg) > -1) {
                    img = item
                }
            })
        }

        return img
    }

    // showpostioncenter
    showPosCenter(_Group) {
        let center = new Vector3()
        // console.log(_Group.children[0], '_Group.children[0]')
        _Group.children[0].children[0].geometry.computeBoundingBox()
        _Group.children[0].children[0].geometry.boundingBox.getCenter(center)
        let x = center.x
        let y = center.y
        let z = center.z
        // 把对象放到坐标原点
        _Group.children[0].children[0].geometry.center()
        // 绕轴旋转
        _Group.children[0].children[0].geometry.rotateY(0.2)

        // 再把对象放回原来的地方
        _Group.children[0].children[0].geometry.translate(x, y, z)
    }
    //mesh显示中间位置
    meshPosCenter(child) {
        let center = new Vector3()
        child.geometry.computeBoundingBox()
        child.geometry.boundingBox.getCenter(center)
        // 把对象放到坐标原点
        child.geometry.center()
    }

    async renderObj({
        inspect3dUrls,
        objModels,
        mtlModels,
        paintKit,
        scale,
        good,
    }) {
        objModels =
            process.env.NODE_ENV !== 'production'
                ? objModels || '' //test mock_mtl_ak47
                : objModels
        // test mock
        objModels = mock_mtl_aug
        /* mock_mtl_ak47,
        mock_mtl_glove_sporty,
        mock_mtl_knife_m9_bay,
        mock_mtl_desert_eagle,
        mock_mtl_aug,
        mock_mtl_cube */
        _Group.position.set(0, 0, 0)

        //console.log(good, 'good')
        this.setLine()
        this.setDecalMaterial()

        let maxGroup = [],
            maxObjModel_xyz = []
        //loading
        this.TEXTSURE_Loading = await this.createMesh('/assets/img/logo.png')
        this.TEXTSURE_Loading.visible = true
        //this.scene.add(this.TEXTSURE_Loading)

        let loopModel = 1
        /*
        规则:
        非手套：0_0, 1_0
        手套：0_0, 0_1, 2_0, 2_1
        */
        let colorMapLen =
            (inspect3dUrls && Math.floor(inspect3dUrls.length / 2)) || 0
        //console.log(objModels, 'objModels')
        objModels.forEach(async (m_item, m_index) => {
            let startTime = new Date()
            //不需要用mlt
            /* if (m_index == 2) {
                m_item.url =
                    'https://img.csgo.com.cn/csgostatic/csgo/647183e7-faba-423d-b7ad-ed6a8c0178fb.jpg?v=9'
            } */

            const object = await this.preLoaderObj(m_item.url, '' || '') // mlt暂时不使用
            //console.log(object)
            /*
            let endTime1 = new Date()
            console.log('loopModel', (endTime1 - startTime) / 1000 + 's') */
            let material = new MeshPhongMaterial({
                /*  transparent: true, // 设置为true，opacity才会生效
                opacity: 0,
                color: '#ffffff',
                reflectivity: 0, */
                /*  color: 0xffffff,
                emissive: 0xffffff, */
                /*  depthTest: true,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -4,
                wireframe: false, */
            }) // MeshStandardMaterial|MeshPhongMaterial|MeshPhysicalMaterial

            //特殊处理金属度和粗造度
            let obj_name = good.name || m_item.name
            if (/(沙漠之鹰)/gi.test(obj_name)) {
                //material = new MeshStandardMaterial({})
                /*   material.roughness = 0.55
                material.metalness = 0.83 */
            }
            let baseColorUrl = this.getBaseColorUrl(
                good.name,
                good.type,
                m_item.name,
                inspect3dUrls,
                m_index
            )
            //mock
            baseColorUrl = m_item.map || baseColorUrl
            const basecolorMap = await this.preLoaderTexture(baseColorUrl)
            //console.log(basecolorMap, 'basecolorMap')

            material.map = basecolorMap
            material.map.wrapS = RepeatWrapping
            material.map.wrapT = RepeatWrapping
            /*  material.transparent = true */
            material.opacity = 0
            // 法线贴图,只有一张
            let normalPicUrl = ''
            if (paintKit && paintKit.normalPicUrl) {
                normalPicUrl = paintKit.normalPicUrl
            }
            if (m_index === 0 || good.type == '手套') {
                //mock m_item.normalMap
                //重新获取应对的法线贴图
                normalPicUrl = m_item.normalMap || normalPicUrl
                if (normalPicUrl) {
                    const normalMap = await this.preLoaderTexture(normalPicUrl)
                    //normalMap.flipY = true
                    material.normalMap = normalMap
                    material.normalMap.wrapS = RepeatWrapping
                    material.normalMap.wrapT = RepeatWrapping
                }
            }
            // 仅支持MeshPhongMaterial
            // if (!/(沙漠之鹰)/gi.test(good.name || m_item.name)) {
            //重新获取应对的高光贴图
            let specularbaseColorUrl = this.findSpecularMap(
                colorMapLen,
                m_index,
                inspect3dUrls
            )
            specularbaseColorUrl = m_item.normalMap || specularbaseColorUrl
            // console.log(specularbaseColorUrl, 'specularbaseColorUrl')
            const specularMap = await this.preLoaderTexture(
                specularbaseColorUrl
            )
            /*  material.specularMap = specularMap
            material.specularMap.wrapS = RepeatWrapping
            material.specularMap.wrapT = RepeatWrapping */
            // }
            if (good.type == '!手套') {
                material.roughness = 0.3
                material.roughnessMap = specularMap
                material.roughnessMap.wrapS = RepeatWrapping
                material.roughnessMap.wrapT = RepeatWrapping
            } else {
                // basecolorMap.encoding = sRGBEncoding
                //basecolorMap.anisotropy = 16
                material.metalness = 1
                material.roughness = 1
                material.shininess = 60
                material.metalnessMap = material.roughnessMap = specularMap
                material.metalnessMap.wrapS = RepeatWrapping
                material.metalnessMap.wrapT = RepeatWrapping
                material.roughnessMap.wrapS = RepeatWrapping
                material.roughnessMap.wrapT = RepeatWrapping
            }

            /*    */
            //
            // object.position.y = -30

            object.traverse(async (child) => {
                console.log(child, 'child')
                if (child instanceof Mesh) {
                    if (child.material) {
                        // material.transparent = true
                        material.opacity = 0
                        if (child.name == '1rif_aug_decal_B') {
                            // material.visible = false
                            // console.log(baseColorUrl, ' rif_aug_decal_B')
                            URShader.uniforms.BgTexture.value = basecolorMap
                            URShader.uniforms.tBrightness.value =
                                this.tBrightness
                            material = new ShaderMaterial(URShader)
                        }
                        if (child.name == '1rif_aug_decal_A') {
                            // material.visible = false
                            //console.log(baseColorUrl, ' rif_aug_decal_A')
                            URShader.uniforms.BgTexture.value = basecolorMap
                            URShader.uniforms.tBrightness.value =
                                this.tBrightness
                            material = new ShaderMaterial(URShader)
                        }
                        child.material = material

                        //material.transparent = true
                        if (child.name.includes('decal')) {
                            material.transparent = true
                        }

                        /* child.material.emissive = '#fffffff' */
                    }
                    if (m_item.name == '0_0.obj') {
                        this.selectedMesh = child
                    }
                    if (objModels.length == 1) {
                        await this.wait(1)
                        this.meshPosCenter(child)
                    }

                    child.castShadow = true
                    child.receiveShadow = true
                    child.material.needsUpdate = true
                }
            })
            //  this.scene.add(object)
            //  return

            _Group.add(object)

            let _getObj = new Box3()
                .setFromObject(_Group)
                .getSize(new Vector3())
            maxGroup.push(_Group)
            maxObjModel_xyz.push(Math.max(_getObj.x, _getObj.y, _getObj.z))

            _Group.rotation.y = -Math.PI / 4
            if (/(手枪)/gi.test(good.type || m_item.name)) {
                //  _Group.rotation.z = -Math.PI / 10
            }

            let self = this
            //加载耗时
            let endTime = new Date()
            console.log(
                'load obj:',
                loopModel,
                (endTime - startTime) / 1000 + 's'
            )

            if (objModels.length == loopModel) {
                _Group.visible = false
                this.isloaded = false
                //加载图片/模型资源
                await this.wait(1000)
                this.aniLoading()
                // this.showPosCenter(_Group)
                this.scene.add(_Group)
                await this.wait(500)
                self.setObjectSize(_Group, maxGroup, maxObjModel_xyz, scale)
                await this.wait(1500)
                /* this.addDecal({
                    intersects: true,
                    point: {
                        x: 5,
                        y: 7,
                        z: -2,
                    },
                }) */

                /*   this.addDecal({
                    intersects: true,
                    point: {
                        // 0.6486564874649048 3.031660556793213 5.684671401977539
                        x: 0,
                        y: v.y / 4,
                        z: 0,
                    },
                }) */
            }
            loopModel++
        })

        this.animate()
    }
    // 设置线条
    setLine() {
        const geometry = new BufferGeometry()
        geometry.setFromPoints([new Vector3(), new Vector3()])
        gLine = new Line(geometry, new LineBasicMaterial())
        this.scene.add(gLine)
    }
    setDecalMaterial() {
        // 设置贴花（图案）的纹理图案
        const decalDiffuse = new TextureLoader().load(
            '/assets/img/img-decal.png'
        )
        // 设置贴花（图案）的材质
        this.decalMaterial = new MeshPhongMaterial({
            map: decalDiffuse,
            normalScale: new THREE.Vector2(1, 1),
            shininess: 30,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            wireframe: false,
        })
    }

    // 判断相交面
    checkIntersection(x, y) {
        if (!this.selectedMesh) return
        // 转换鼠标坐标
        mouse.x = (x / window.innerWidth) * 2 - 1
        mouse.y = -(y / window.innerHeight) * 2 + 1
        // 通过鼠标位置和相机设置射线
        this.raycaster.setFromCamera(mouse, this.camera)
        // 计算射线与模型相交的面
        this.raycaster.intersectObject(
            this.selectedMesh,
            false,
            this.intersects
        )
        //console.log(this.selectedMesh, 'this.selectedMesh.children')
        // 若存在相交面
        if (this.intersects.length > 0) {
            const p = this.intersects[0].point
            mouseHelper.position.copy(p)
            this.intersection.point.copy(p)

            const n = this.intersects[0].face.normal.clone()
            n.transformDirection(this.selectedMesh.matrixWorld)
            n.multiplyScalar(10)
            n.add(this.intersects[0].point)

            this.intersection.normal.copy(this.intersects[0].face.normal)
            mouseHelper.lookAt(n)

            const positions = gLine.geometry.attributes.position
            positions.setXYZ(0, p.x, p.y, p.z)
            positions.setXYZ(1, n.x, n.y, n.z)
            positions.needsUpdate = true

            this.intersection.intersects = true

            this.intersects.length = 0
        } else {
            this.intersection.intersects = false
        }
    }

    // 添加贴花
    addDecal(options) {
        this.intersection = options || this.intersection
        // 设置贴花的位置
        console.log(JSON.stringify(this.intersection), 'this.intersection')
        this.decalParams.position.copy(this.intersection.point)

        this.decalParams.orientation.copy(mouseHelper.rotation)
        // 随机贴花的尺寸
        /* this.decalParams.scale =
            this.decalParams.minScale +
            Math.random() * (this.decalParams.maxScale - this.decalParams.minScale)
        this.decalParams.size.set(
            this.decalParams.scale * 100,
            this.decalParams.scale * 100,
            this.decalParams.scale * 100
        ) */
        // 拷贝材质避免修改原始的数据
        const material = this.decalMaterial.clone()
        console.log(material, this.decalParams, 'material')
        // 获得贴花模型
        const decal = new Mesh(
            new DecalGeometry(
                this.selectedMesh,
                this.decalParams.position,
                this.decalParams.orientation,
                this.decalParams.size
            ),
            material
        )
        //  decal.visible = false
        // 添加贴花模型到场景中
        // decals.push(decal)
        this.scene.add(decal)
        // await this.wait(800)
        // decal.visible = true
    }

    // 设置obj 根据box size来自动缩放
    /*
     * @param setObjectSize
     * @param _Group 所有合并的obj组
     * @param maxGroup 最大坐标model
     * @param maxObjModel_xyz  最大坐标model xyz
     * @param scale 放大比例，占不用
     */
    setObjectSize(curGroup, maxGroup, maxObjModel_xyz, scale) {
        //console.log(maxObjModel_xyz, 'maxObjModel_xyz')
        //console.log(Math.max.apply(null,maxObjModel_xyz))
        //获取最大的xyz对应的obj model
        let max = Math.max(...maxObjModel_xyz)
        let indexOfMax = maxObjModel_xyz.indexOf(max)
        let _gr = maxGroup[indexOfMax]
        // console.log(_gr, '_gr', indexOfMax, max)
        let self = this
        self.width = window.innerWidth
        self.height = window.innerHeight
        let bbox = new Box3().setFromObject(_gr)
        let mdlen = bbox.max.x - bbox.min.x //边界的最小坐标值 边界的最大坐标值
        let mdhei = bbox.max.y - bbox.min.y
        let mdwid = bbox.max.z - bbox.min.z
        let dist = Math.abs(self.camera.position.z - _gr.position.z - mdwid / 2)
        //console.log('dist值为:' + dist );
        let vFov = (self.camera.fov * Math.PI) / 180
        //console.log('vFov值为:' + vFov );
        let vheight = 2 * Math.tan(vFov * 0.5) * dist
        //console.log('vheight值为:' + vheight );
        let fraction = mdhei / vheight
        //console.log('fraction值为:' + fraction );
        let finalHeight = self.height * fraction
        //console.log('finalHeight值为:' + finalHeight);
        let finalWidth = (finalHeight * mdlen) / mdhei
        //console.log('finalWidth值为:' + finalWidth );
        let value1 = (self.width / finalWidth) * 0.8
        //console.log('value1缩放比例值为:' + value1);
        let value2 = (self.height / finalHeight) * 0.5
        //console.log('value2缩放比例值为:' + value2);

        let getscale = value1 >= value2 ? value2 : value1
        this.aniWeapon(getscale, _Group)
        /* if (scale) {
            _Group.scale.setScalar(scale)
        } else {
            _Group.scale.setScalar(3.5)
        } */
    }
    aniLoading() {
        let param = { opacity: 1, scale: 1 }
        new TWEEN.Tween(param)
            .to({ opacity: 0, scale: 0 }, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                if (this.TEXTSURE_Loading && this.TEXTSURE_Loading.material) {
                    this.TEXTSURE_Loading.material.opacity = param.opacity
                    this.controls.enabled = true
                }
            })
            .start()
    }
    aniWeapon(getscale, _Group) {
        let param = { scale: getscale * 5, opacity: 0, transparent: 0 }
        //console.log(_Group)
        new TWEEN.Tween(param)
            .to({ scale: getscale, opacity: 1, transparent: true }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                _Group.scale.set(param.scale, param.scale, param.scale)
                _Group.visible = true
                _Group['children'].forEach((item) => {
                    //console.log(item['children'][0], 'item11')
                    if (item['children'][0]) {
                        item['children'][0]['material'].opacity = param.opacity
                        //item['children'][0]['material'].transparent = false
                    }
                })
                _Group['children'].forEach((item) => {
                    setTimeout(() => {
                        if (item['children'][0]) {
                            //  item['children'][0]['material'].transparent = false
                        }
                    }, 100)
                })
            })
            .start()
    }
    getObjectSizeInViewSpace(object) {
        const size = new Vector3()
        const box = new Box3().setFromObject(object).getSize(size)
        size.project(this.camera)

        let halfWidth = window.innerWidth / 2
        let halfHeight = window.innerHeight / 2
        //console.log(box, 'size.x')

        size.x = size.x * window.innerWidth
        // size.y = size.y * halfHeight
        return size.x
        // return new Vector2(size.x, size.y)
    }
    changedisabledAutoRotate(status) {
        this.disabledAutoRotate = status
    }
    changeZoom(val) {
        this.scene.scale.set(val, val, val)
    }
    saveScreenshot() {
        this.base64_snapshot = this.renderer.domElement.toDataURL(
            'image/png',
            1
        )
    }

    animate() {
        let { controls, scene, camera, renderer, clocktime, timeS } = this
        let delta = this.clock.getDelta()
        this.clocktime = clocktime + delta
        this.timeS = timeS + delta
        if (this.TEXTSURE_Loading && !this.isloaded) {
            this.TEXTSURE_Loading.rotation.y += delta
        }
        const hasControlsUpdated = controls.update(delta)
        //console.log(this.timeS / this.rotateSpeedSecond)
        if (!this.disabledAutoRotate) {
            let deg = this.rotateSpeedSecond / 100000
            this.scene.rotation.y += deg
        }
        URShader.uniforms.tBrightness.value = this.tBrightness
        //controls.update()
        //stats && stats.update()
        //renderer.render(scene, camera)
        if (hasControlsUpdated) {
        }
        renderer.render(scene, camera)

        TWEEN.update()
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
