<template>
  <div class="phone">
    <div class="webgl_1" ref="dom"></div>
    <div class="btn">
      <button v-if="isRatate" @click="handleChangeRatate(false)">
        停止转动
      </button>
      <button v-else @click="handleChangeRatate(true)">开始转动</button>
    </div>
    <div id="color">
      <!-- 四个按钮 -->
      <div
        class="colorChoose"
        :class="{ chosen: choseindex === 0 }"
        @click="handleChangeMap(0)"
      >
        <img src="@/assets/images/极光紫.png" />
      </div>
      <div
        class="colorChoose"
        :class="{ chosen: choseindex === 1 }"
        @click="handleChangeMap(1)"
      >
        <img src="@/assets/images/幻夜黑.png" />
      </div>
      <div
        class="colorChoose"
        :class="{ chosen: choseindex === 2 }"
        @click="handleChangeMap(2)"
      >
        <img src="@/assets/images/珊瑚红.png" />
      </div>
      <div
        class="colorChoose"
        :class="{ chosen: choseindex === 3 }"
        @click="handleChangeMap(3)"
      >
        <img src="@/assets/images/极光蓝.png" />
      </div>
    </div>
    <div id="camera" style="visibility: hidden">
      <div>
        <div
          style="
            height: 1px;
            width: 130px;
            background: #00ffff;
            margin-top: 68px;
          "
        ></div>
      </div>
      <div id="message" style="width: 350px; height: 120px">
        <div style="padding: 10px 4px; font-size: 18px">双摄像头</div>
        <div style="padding: 10px 24px; font-size: 16px">
          后置主摄像头——1300万像素(F/1.8光圈)
        </div>
        <div style="padding: 10px 24px; font-size: 16px">
          后置副摄像头——200万像素的
        </div>
      </div>
      <!-- 设置一个关闭按钮 -->
      <div style="position: relative">
        <div style="position: absolute; left: -30px; top: 10px">
          <img
            @click="handleClose"
            id="close"
            src="@/assets/model/关闭.png"
            alt=""
            width="18"
            style="cursor: pointer"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 渲染第一个three.js的demo
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  // BoxGeometry,
  // MeshBasicMaterial,
  Mesh,
  AxesHelper,
  DirectionalLight,
  AmbientLight,
  TextureLoader,
  MeshStandardMaterial,
  CubeTextureLoader,
  BufferGeometry,
  ArcCurve,
  LineBasicMaterial,
  Line,
  MeshLambertMaterial,
  ShapeGeometry,
  DoubleSide,
  Group,
  Clock,
  Raycaster,
  Vector2,
} from 'three'
import { OrbitControls } from '@/lib/threejs/examples/jsm/controls/OrbitControls' // 相机控件可以对Threejs的三维场景进行缩放、平移、旋转操作
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'

import createPoint from './createPointTag'
const PhoneAssets = {
  glb: require('@/assets/model/手机.glb'),
  bg: require('@/assets/model/basecolor.png'),
  metallic: require('@/assets/model/metallic.png'),
  normal: require('@/assets/model/normal.png'),
  opacity: require('@/assets/model/opacity.png'),
  roughness: require('@/assets/model/roughness.png'),
}
export default {
  name: 'PhoneWl',
  data() {
    return {
      isRatate: true,
      choseindex: 0,
      autoChangeTime: 0,
      handleClose: () => {},
    }
  },
  mounted() {
    let scene = new Scene()
    let camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    let render = new WebGLRenderer()
    render.setSize(window.innerWidth, window.innerHeight)
    render.setPixelRatio(window.devicePixelRatio) //设置设备像素比率,防止Canvas画布输出模糊。
    this.$refs['dom'].appendChild(render.domElement)

    let css2dRender = new CSS2DRenderer()
    css2dRender.setSize(window.innerWidth, window.innerHeight)
    css2dRender.domElement.style.position = 'absolute'

    // 相对标签原位置位置偏移大小
    css2dRender.domElement.style.top = '0px'
    css2dRender.domElement.style.left = '252px' //HTML标签尺寸宽度一半
    css2dRender.domElement.style.display = 'none'
    this.$refs['dom'].appendChild(css2dRender.domElement)

    let cameraControl = new OrbitControls(camera, render.domElement)
    // 缩放范围限制
    cameraControl.minDistance = 100 //相机距离观察目标点极小距离——模型最大状态
    cameraControl.maxDistance = 500 //相机距离观察目标点极大距离——模型最小状态
    camera.position.z = 200

    const phoneLoader = new GLTFLoader()
    // 加载环境贴图
    let textureCube = new CubeTextureLoader().load([
      require('@/assets/model/envMap/px.jpg'),
      require('@/assets/model/envMap/nx.jpg'),
      require('@/assets/model/envMap/py.jpg'),
      require('@/assets/model/envMap/ny.jpg'),
      require('@/assets/model/envMap/pz.jpg'),
      require('@/assets/model/envMap/nz.jpg'),
    ])
    console.log('textureCube', textureCube)
    let gltfScene = null //产品模型对象
    let phoneMesh = null
    let phoneLight = null
    let phoneLightLabel = null
    let frontObject3D = null
    let modelGroup = new Group() //
    phoneLoader.load(PhoneAssets.glb, (glb) => {
      gltfScene = glb.scene
      modelGroup.add(gltfScene)
      scene.add(modelGroup) //手机产品三维模型添加到场景中
      phoneMesh = glb.scene.getObjectByName('手机') //找到手机Mesh
      phoneMesh.renderOrder = 0
      // 模型中包含两个空对象分别对应手机前后摄像头的位置，主要是为了方便读取摄像头的世界坐标
      frontObject3D = glb.scene.getObjectByName('后置摄像头位置')
      phoneLight = createPoint(frontObject3D)
      phoneLight.position.z -= 4
      phoneLight.position.x -= 10
      modelGroup.add(phoneLight)
      phoneLight.renderOrder = 1

      // 创建一个HTML元素作为标签标注相机对应sprite对象
      // 选择id为camera的一个HTML元素作为标签标注相机对象热点位置
      var div = document.getElementById('camera')
      //div元素包装为CSS2模型对象CSS2DObject
      phoneLightLabel = new CSS2DObject(div)
      // 设置HTML元素标签在three.js世界坐标中位置
      phoneLightLabel.position.copy(frontObject3D.position)
      phoneLightLabel.position.y = -phoneLightLabel.position.y
      phoneLightLabel.position.x -= 10
      phoneLightLabel.position.z = -phoneLightLabel.position.z - 3
      modelGroup.add(phoneLightLabel)

      let texLoader = new TextureLoader() //纹理贴图加载器
      phoneMesh.material = new MeshStandardMaterial({
        metalness: 1.0, //Mesh表面金属度，默认值0.5
        roughness: 1.0, //Mesh表面粗糙度，默认值0.5
        map: texLoader.load(PhoneAssets.bg),
        // 金属度、粗糙度贴图表示的值会和金属度、粗糙度分别相乘
        roughnessMap: texLoader.load(PhoneAssets.roughness), //粗糙度贴图
        metalnessMap: texLoader.load(PhoneAssets.metallic), //金属度贴图
        normalMap: texLoader.load(PhoneAssets.normal), //法线贴图
        // 相机镜头等位置需要设置半透明效果(设置alphaMap和transparent属性)
        alphaMap: texLoader.load(PhoneAssets.opacity), //alpha贴图
        transparent: true, //使用alphaMap，注意开启透明计算
        envMap: textureCube, //设置pbr材质环境贴图，渲染效果更好
        envMapIntensity: 0.9, //设置环境贴图对模型表面影响程度
      })
      // 注意：纹理朝向texture.flipY设置
      phoneMesh.material.map.flipY = false
      phoneMesh.material.map.roughnessMap = false
      phoneMesh.material.map.metalnessMap = false
      phoneMesh.material.map.normalMap = false
      phoneMesh.material.map.alphaMap = false
    })

    let geometry = new BufferGeometry() //声明一个几何体对象BufferGeometry
    console.log('geometry', geometry)
    //参数：0, 0圆弧坐标原点x，y  100：圆弧半径    0, 2 * Math.PI：圆弧起始角度
    let R = 60 //半径
    let arc = new ArcCurve(
      0,
      0,
      R,
      Math.PI / 2 + Math.PI / 6,
      Math.PI / 2 - Math.PI / 6
    )
    //getPoints是基类Curve的方法，返回一个vector2对象作为元素组成的数组
    let points = arc.getPoints(50) //分段数50，返回51个顶点
    // setFromPoints方法从points中提取数据改变几何体的顶点位置数据.attributes.position
    geometry.setFromPoints(points)
    console.log('arc', arc, points)
    //材质对象
    let material = new LineBasicMaterial({
      color: 0xffffff, //线条颜色
    })
    //线条模型对象
    let line = new Line(geometry, material)
    console.log('line', line)
    line.rotateX(Math.PI / 2) //绕x轴旋转90度
    let CircleLine = new Group() //声明一个组对象，用来添加线模型
    CircleLine.add(line)
    line.position.y = -80
    scene.add(CircleLine)

    const ft = new FontLoader()
    ft.load('./gentilis_bold.typeface.json', (font) => {
      let material = new MeshLambertMaterial({
        color: 0xffffff,
        side: DoubleSide,
      })
      // .generateShapes()：获得字符'720°'的轮廓顶点坐标
      let Shapes = font.generateShapes('huawei', 10) //10)控制字符大小
      let geometry = new ShapeGeometry(Shapes) //通过多个多边形轮廓生成字体
      let textMesh = new Mesh(geometry, material)
      textMesh.position.x = -25
      textMesh.position.y = -70
      textMesh.position.z = 50
      CircleLine.add(textMesh)
    })

    let directionalLight = new DirectionalLight(0xffffff, 1)
    directionalLight.position.set(400, 200, 300)
    scene.add(directionalLight)
    // 平行光2
    let directionalLight2 = new DirectionalLight(0xffffff, 1)
    directionalLight2.position.set(-400, -200, -300)
    scene.add(directionalLight2)
    //环境光
    let ambient = new AmbientLight(0xffffff, 2)
    scene.add(ambient)
    // 辅助线
    const axesHelper = new AxesHelper(100)
    scene.add(axesHelper)

    this.clockTime = new Clock()
    const changeMapAuto = (index) => {
      this.choseindex = index
      phoneMesh && (phoneMesh.material.map = ChangeMap[`map${index + 1}`])
    }
    const autoChange = () => {
      if (this.autoChangeTime >= 0 && this.autoChangeTime < 4) {
        changeMapAuto(0)
      } else if (this.autoChangeTime >= 2 && this.autoChangeTime < 8) {
        changeMapAuto(1)
      } else if (this.autoChangeTime >= 4 && this.autoChangeTime < 12) {
        changeMapAuto(2)
      } else if (this.autoChangeTime >= 6 && this.autoChangeTime < 16) {
        changeMapAuto(3)
      } else if (this.autoChangeTime >= 16) {
        this.autoChangeTime = 0
      }
      this.autoChangeTime += 2
    }
    setInterval(() => {
      autoChange()
    }, 2000)
    initRender()
    function initRender() {
      css2dRender.render(scene, camera) //渲染HTML标签对象
      render.render(scene, camera)
      cameraControl.update()
      requestAnimationFrame(initRender)
    }
    let ratateAnimate = null
    const animate = () => {
      if (modelGroup) {
        modelGroup.rotateY(0.006)
      }
      ratateAnimate = requestAnimationFrame(animate)
    }
    animate()

    let scaleSpeed = 0
    let scaleSpeedTap = 0.01
    const phoneLightAni = () => {
      if (phoneLight) {
        scaleSpeed += scaleSpeedTap
        if (scaleSpeed > 0 && scaleSpeed < 0.5) {
          phoneLight.scale.x = 6 * (1 + scaleSpeed)
          phoneLight.scale.y = 6 * (1 + scaleSpeed)
        } else if (scaleSpeed > 0.5) {
          phoneLight.scale.x = 6 * (1 + scaleSpeed)
          phoneLight.scale.y = 6 * (1 + scaleSpeed)
          scaleSpeedTap = -0.01
        } else if (scaleSpeed <= 0) {
          scaleSpeedTap = 0.01
        }
      }
      requestAnimationFrame(phoneLightAni)
    }
    phoneLightAni()

    let texLoader = new TextureLoader() //纹理贴图加载器
    const ChangeMap = {
      map1: texLoader.load(require('@/assets/model/极光紫.png')), //颜色贴图
      map2: texLoader.load(require('@/assets/model/幻夜黑.png')), //颜色贴图
      map3: texLoader.load(require('@/assets/model/珊瑚红.png')), //颜色贴图
      map4: texLoader.load(require('@/assets/model/极光蓝.png')), //颜色贴图
    }
    ChangeMap.map1.flipY = false // 纹理朝向texture.flipY
    ChangeMap.map2.flipY = false // 纹理朝向texture.flipY
    ChangeMap.map3.flipY = false // 纹理朝向texture.flipY
    ChangeMap.map4.flipY = false // 纹理朝向texture.flipY
    this.handleChangeMap = (index) => {
      this.choseindex = index
      phoneMesh.material.map = ChangeMap[`map${index + 1}`]
      this.autoChangeTime = index * 2
      console.log('autoChangeTime', this.autoChangeTime)
    }
    this.handleClose = () => {
      phoneLightLabel.element.style.visibility = 'hidden'
      css2dRender.domElement.style.display = 'none'
    }
    this.handleChangeRatate = (flag) => {
      this.isRatate = flag
      if (this.isRatate) {
        animate()
      } else {
        cancelAnimationFrame(ratateAnimate)
      }
    }

    window.addEventListener('click', (e) => {
      let { clientX, clientY } = e
      let x = (clientX / window.innerWidth) * 2 - 1 //WebGL标准设备横坐标
      let y = -(clientY / window.innerHeight) * 2 + 1 //WebGL标准设备纵坐标

      //创建一个射线投射器`Raycaster`
      var raycaster = new Raycaster()
      //通过鼠标单击位置标准设备坐标和相机参数计算射线投射器`Raycaster`的射线属性.ray
      raycaster.setFromCamera(new Vector2(x, y), camera)
      //返回.intersectObjects()参数中射线选中的网格模型对象
      // 未选中对象返回空数组[],选中一个数组1个元素，选中两个数组两个元素
      var intersects = raycaster.intersectObjects([phoneLight])
      if (intersects.length > 0) {
        // 选中模型的第一个设置为半透明
        phoneLightLabel.element.style.visibility = 'visible'
        // intersects[0].object.material.transparent = true
        // intersects[0].object.material.opacity = 0.6
        css2dRender.domElement.style.display = 'block'
      }
    })

    window.onresize = () => {
      render.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
  },
}
</script>

<style>
.phone {
  width: 100vw;
  height: 100vh;
  position: relative;
}
.webgl_1 {
  width: 100%;
  height: 100%;
  /* position: relative; */
}
.btn {
  position: absolute;
  top: 20px;
  right: 50px;
}
.colorChoose {
  display: inline-block;
  margin-left: 20px;
  cursor: pointer;
}

.colorChoose img {
  width: 50px;
  border-radius: 50%;
  padding: 2px 4px;
  border: 2px solid #ccc;
}
.chosen img {
  border-color: #e3393c;
}

#color {
  width: 375px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  /* top: 30px; */
  bottom: 12px;
  /* background:rgba(255,255,255,0.1); */
}

#camera {
  position: absolute;
  display: flex;
  /* row是flex-direction默认值,可以不设置，表示主轴为水平方向，从左向右排列*/
  flex-direction: row;
  /*space-between表示*/
  justify-content: space-between;
  /* visibility: hidden; */
}

#message {
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 0px;
  /* 边框 */
  background: linear-gradient(#00ffff, #00ffff) left top,
    linear-gradient(#00ffff, #00ffff) left top,
    linear-gradient(#00ffff, #00ffff) right bottom,
    linear-gradient(#00ffff, #00ffff) right bottom;
  background-repeat: no-repeat;
  background-size: 2px 20px, 36px 2px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 18px;
  padding: 8px 12px;
}
</style>
