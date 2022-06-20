import {
    Vector3,
    AxisHelper,
    Scene,
    WebGLRenderer,
    Mesh,
    Clock,
    TextureLoader,
    MeshPhongMaterial,
    Color,
    SpotLight,
    ShaderMaterial,
    FrontSide,
    RepeatWrapping,
    MeshPhysicalMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    AmbientLight,
} from 'three'
import { OrbitControls } from '@/utils/threejs/examples/jsm/controls/OrbitControls' // 相机控件可以对
//import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { TrackballControls } from '@/utils/threejs/examples/jsm/controls/TrackballControls.js' // 修复iOS touchend放大滚动问题
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

// 材质加载
const TextLoad = new TextureLoader()
// 碎光
const URShader = {
    uniforms: {
        Ani_UR_TYPE: { value: '1' },
        u_mask_texture: {
            type: 't',
            value: new TextureLoader().load(
                require('@/assets/img/nft/img-suiguang.png')
            ),
        },
        time: { type: 'f', value: 0.2 },
        BgTexture: {
            value: '',
        },
        tDiffuse: {
            type: 't',
            value: 0.0,
        },
        maskColor: {
            value: new Color(0x111111),
        },
        maskAlpha: {
            value: 0,
        },
        markRadius: {
            value: 1,
        },
        smoothSize: {
            value: 0.5,
        },
        opacity: { value: 1.0 },
        transparent: true,
    },
    transparent: true,
    //depthTest: false,
    side: FrontSide,
    vertexShader: `
              varying vec2 vUv;
              varying vec3 iPosition;
              uniform sampler2D BgTexture;
              void main(){
                vUv = uv;
                iPosition = position;
               // vec4 t=texture2D(BgTexture, vUv);
                gl_Position= projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

              } `,

    fragmentShader: `
              uniform vec3 maskColor;
              uniform float maskAlpha;
              uniform float markRadius;
              uniform float smoothSize;
              uniform sampler2D tDiffuse;
              varying vec2 vUv;
              uniform float time;
              uniform int Ani_UR_TYPE;
              uniform float opacity;
              varying vec4 vFragColor;
              uniform sampler2D BgTexture;
              uniform sampler2D u_mask_texture;
              varying vec3 iPosition;
              varying highp vec2 TexCoordOut;
              float sdfCircle(vec2 coord, vec2 center, float radius)
              {
                vec2 offset = coord - center;
                return sqrt((offset.x * offset.x) + (offset.y * offset.y)) - radius;
              }
              void main(){

                vec4 texel = texture2D( BgTexture, vUv );
                vec4 texel2 = texture2D( u_mask_texture, vUv );
                float sdfValue = sdfCircle(vUv, vec2(0.5, 0.5), .0);
                float x = iPosition.x;
                float lightX = x*1.002 +time;// (0.3,-.03)
                float alpha = abs(iPosition.x - lightX );
                // 只保留碎光
                if(Ani_UR_TYPE == 1){
                  float a = 1.0 -  alpha / 0.1;
                  gl_FragColor = texel ;
                  return;
                }
                // 要扫光
                if(alpha > 0.0){
                    float a = 1.0 -  alpha / 0.1;
                    float enda = smoothstep(0.0,1.0,a) ;
                    gl_FragColor = texel* enda ;

                } else {
                  gl_FragColor = texel;
                }
              }
            `,
}
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
        this.TEXTSURE_SR = null
        this.Ani_UR_TYPE = 1

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
        let type = 1 // 0 TrackballControls || 1 OrbitControls
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
            this.controls.enableDamping = true
            this.controls.minDistance = 10
            this.controls.maxDistance = 800
            this.controls.enablePan = true
            this.controls.panSpeed = 5.0
            this.controls.zoomSpeed = 2
            this.controls.keyPanSpeed = 2.0
            this.controls.autoRotate = true
            this.controls.dampingFactor = 0.2
        }
    }

    // 渲染器
    initRenderer() {
        this.TEXTSURE_SR = TextLoad.load(
            require('@/assets/img/nft/border-light.png')
        )
        this.TEXTSURE_SR.wrapS = this.TEXTSURE_SR.wrapT = RepeatWrapping //每个都重复
        this.TEXTSURE_SR.repeat.set(1, 1)
        this.TEXTSURE_SR.rotation = 75 //  Math.random() * 180
        this.TEXTSURE_SR.needsUpdate = true
        // 序列帧动画图

        this.Keyframe_UR = []
        for (let i = 1; i <= 18; i++) {
            let num = ''
            num = i < 10 ? '0' + i : i
            this.Keyframe_UR.push(
                TextLoad.load(
                    require(`@/assets/img/nft/effectUR1/card_512_512_effectUR_${num}.png`)
                )
            )
        }

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
    // 加载FBX
    async preLoaderFBX(url) {
        const loader = new FBXLoader()
        //loader.setCrossOrigin('no-cors')
        return new Promise((resolve, reject) => {
            loader.load(
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

    async render(animateType = 3) {
        let url = '/assets/fbx/card_512_512_01.fbx'
        URShader.uniforms.Ani_UR_TYPE = { value: this.Ani_UR_TYPE }
        //URShader.alphaToCoverage = true // only works when WebGLRenderer's "antialias" is set to "true"
        this.UR_Pointindex = 0
        this.clocktime = 0

        let UR_MixMaterial = new ShaderMaterial(URShader)
        this.UR_MixMaterial = UR_MixMaterial
        let object = await this.preLoaderFBX(url)

        // object.position.y = -30
        object.traverse((child) => {
            if (child instanceof Mesh) {
                child.position.y = -0
                console.log('child2==', child.name)
                if (
                    child.name == 'card_512_512_bian' ||
                    child.name == 'csgo_wang_bian'
                ) {
                    child.material = new MeshPhysicalMaterial({
                        // 颜色贴图
                        map: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_bian_BaseColor.png')
                        ),
                        // 法线贴图
                        normalMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_bian_Normal.png')
                        ),
                        // 粗糙度贴图
                        roughnessMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_bian_Roughness.png')
                        ),
                        // 金属度贴图
                        metalnessMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_bian_Metallic.png')
                        ),
                        // 环境贴图
                        //envMap: textureCube,
                        // 环境贴图影响程度
                        //envMapIntensity: 1.5,
                        roughness: 1.3,
                    })
                }

                if (
                    ['csgo_wang_hou', 'card_512_512_hou'].includes(child.name)
                ) {
                    child.material = new MeshPhysicalMaterial({
                        // color:0xff0000,
                        // 颜色贴图
                        map: TextLoad.load(
                            require('@/assets/img/card_SR_UR.jpeg')
                        ),
                        // 法线贴图
                        normalMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_hou_Normal.png')
                        ),
                        // 粗糙度贴图
                        roughnessMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_hou_Roughness.png')
                        ),
                        // 金属度贴图
                        metalnessMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_hou_Metallic.png')
                        ),
                        // 环境贴图影响程度
                        metalness: 6,
                        roughness: 1.3,
                    })
                }
                if (
                    ['csgo_wang_qian', 'card_512_512_qian'].includes(child.name)
                ) {
                    child.material = new MeshPhysicalMaterial({
                        map: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_qian_BaseColor.jpg')
                        ),
                        // 法线贴图
                        normalMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_qian_Normal.png')
                        ),
                        // 粗糙度贴图
                        roughnessMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_qian_Roughness.png')
                        ),
                        // 金属度贴图
                        metalnessMap: TextLoad.load(
                            require('@/assets/img/nft/card_512_512_qian_Metallic.png')
                        ),
                        roughness: 1.3,
                    })
                }
                // 流光边框效果
                if (['card_512_512_effectSR'].includes(child.name)) {
                    child.material = new MeshPhongMaterial({
                        color: 0xffffff,
                        transparent: true,
                        map: this.TEXTSURE_SR,
                        side: FrontSide,
                        opacity: 1,
                        visible: animateType == 1 || animateType == 3,
                    })
                }
                // 碎光背景效果
                if (['card_512_512_effectUR'].includes(child.name)) {
                    child.scale.set(1, 1, 1)
                    child.material = UR_MixMaterial
                    child.material.transparent = true
                    child.material.visible =
                        animateType == 2 || animateType == 3
                }
                child.material.metalness = 0.1
                child.material.light = true
                child.material.reflectivity = 0.1 // //反射率 默认1 不适用该材质

                if (child instanceof Mesh) {
                    child.castShadow = true
                    child.receiveShadow = true
                    child.material.needsUpdate = true
                }
            }
        })
        this.scene.add(object)
        this.animate()
    }

    animate() {
        let { controls, scene, camera, renderer, clocktime, timeS } = this
        let delta = this.clock.getDelta()
        this.clocktime = clocktime + delta
        this.timeS = timeS + delta
        let ceilTimes = Math.ceil(this.timeS)
        let _URspeed // 走的速度
        switch (this.Ani_UR_TYPE) {
            case 2:
                _URspeed = 0.3
                break
            case 1:
            default:
                _URspeed = 0.06
                break
        }

        // UR_MixMaterial
        if (this.UR_MixMaterial) {
            // console.log(this.clocktime, 'this.clocktime')
            if (this.clocktime > _URspeed && this.isAnimatedmixMaterial) {
                if (this.UR_Pointindex > this.Keyframe_UR.length) {
                    this.UR_Pointindex = -1
                    this.isAnimatedmixMaterial = false
                }
                console.log(this.UR_Pointindex, 'this.UR_Pointindex')
                URShader.uniforms.BgTexture.value =
                    this.Keyframe_UR[this.UR_Pointindex]
                this.clocktime = 0
                this.UR_Pointindex = this.UR_Pointindex + 1
            }
            // 每隔5秒走一次
            if (ceilTimes % 5 == 0) {
                this.isAnimatedmixMaterial = true
            }
        }

        // TEXTSURE_SR 边框流光
        if (this.TEXTSURE_SR) {
            this.TEXTSURE_SR.offset.x -= 0.01
        }
        controls.update(delta)
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
