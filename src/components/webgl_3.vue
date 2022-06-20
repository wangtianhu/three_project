<template>
  <div class="web">
    <div class="webgl_1" ref="dom"></div>
    <div class="webgl_2" ref="myStats"></div>
  </div>
</template>

<script>
import Stats from 'stats.js'
import dat from 'dat.gui'
// 渲染第一个three.js的demo
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  Mesh,
  AxesHelper,
  PlaneGeometry,
  MeshLambertMaterial,
  AmbientLight,
  SpotLight,
  Vector2,
} from 'three'
export default {
  name: 'webgl_3',
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
    render.shadowMap.enabled = true
    this.$refs['dom'].appendChild(render.domElement)

    // 三维轴
    let axes = new AxesHelper(50)
    scene.add(axes)

    let gemty = new BoxGeometry(8, 8, 8)
    let material = new MeshLambertMaterial({ color: 0xff2288 })
    let cube = new Mesh(gemty, material)
    scene.add(cube)

    let gemty2 = new BoxGeometry(4, 4, 4)
    let material2 = new MeshLambertMaterial({ color: 0x00ff00 })
    let cube2 = new Mesh(gemty2, material2)
    cube2.castShadow = true
    cube2.name = 'cube2'
    cube2.position.x = 10
    cube2.position.y = 10
    cube2.position.z = 0
    scene.add(cube2)

    let myCube = cube2.getObjectByName('cube2', false)
    console.log(myCube)

    let cube2Contro = new (function () {
      this.removeFindCube = function () {
        if (myCube instanceof Mesh) {
          scene.remove(myCube)
        }
      }
      this.addCube = function () {
        let gemty2 = new BoxGeometry(4, 4, 4)
        let material2 = new MeshLambertMaterial({ color: 0x00ff00 })
        let cube3 = new Mesh(gemty2, material2)

        cube3.position.x = -Math.random() * 20
        cube3.position.y = Math.random() * 20
        cube3.position.z = Math.random() * 20
        cube3.castShadow = true
        console.log('cube3', cube3)
        scene.add(cube3)
      }
    })()
    let ctrl22 = new dat.GUI()
    ctrl22.add(cube2Contro, 'removeFindCube')
    ctrl22.add(cube2Contro, 'addCube')
    // 增加带反射材质的地面
    let planeGeomery = new PlaneGeometry(100, 100)
    let planeMaterial = new MeshLambertMaterial({ color: 0xcccccc })
    let plane = new Mesh(planeGeomery, planeMaterial)
    plane.position.set(15, 0, 0)
    plane.rotation.x = -0.5 * Math.PI
    plane.receiveShadow = true
    scene.add(plane)
    camera.position.z = 35
    camera.position.y = 35
    // 摄像机默认在z轴上
    camera.position.x = -30
    camera.lookAt(scene.position)
    cube.castShadow = true
    cube.position.x = 5
    cube.position.y = 10
    cube.position.z = 20

    // 聚光灯
    let spotLigth = new SpotLight(0xffffff)
    spotLigth.position.set(-60, 40, -65)
    spotLigth.castShadow = true
    spotLigth.shadow.mapSize = new Vector2(1024, 1024)
    spotLigth.shadow.camera.far = 140
    spotLigth.shadow.camera.near = 40
    scene.add(spotLigth)
    // 增加光源
    let amienLight = new AmbientLight(0xaaaaaa)
    scene.add(amienLight)
    // cube.rotation.x += 0.5
    // cube.rotation.y += 0.5
    let _this = this
    let stats = addStats()

    let controObj = {
      rotationSpeed: 0.01,
      jumpSpeed: 0.01,
    }
    let ctrl = new dat.GUI()
    ctrl.add(controObj, 'rotationSpeed', 0, 1)
    ctrl.add(controObj, 'jumpSpeed', 0, 1)
    let gap = 0.01
    renderScene()
    function renderScene() {
      // cube.rotation.x += 0.01
      // cube.rotation.y += 0.01
      // cube.rotation.z += 0.01

      scene.traverse((obj) => {
        if (obj instanceof Mesh && obj !== plane) {
          obj.rotation.x += controObj.rotationSpeed
          obj.rotation.y += controObj.rotationSpeed
          obj.rotation.z += controObj.rotationSpeed
        }
      })

      gap += controObj.jumpSpeed
      cube.position.x = 25 + 20 * Math.sin(gap)
      cube.position.y = 6 + 20 * Math.abs(Math.cos(gap))
      stats.update()
      requestAnimationFrame(renderScene)
      render.render(scene, camera)
    }
    function addStats() {
      let stats = new Stats()
      stats.domElement.style.position = 'absolute'
      stats.domElement.style.left = '0px'
      stats.domElement.style.top = '0px'
      stats.setMode(0)
      _this.$refs['myStats'].appendChild(stats.domElement)
      return stats
    }
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      render.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize, false)
  },
}
</script>

<style></style>
