<template>
  <div class="webgl_1" ref="dom"></div>
</template>

<script>
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
  name: 'webgl_2',
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

    render.render(scene, camera)
  },
}
</script>

<style></style>
