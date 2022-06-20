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
  MeshBasicMaterial,
  Mesh,
} from 'three'
export default {
  name: 'webgl_1',
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
    this.$refs['dom'].appendChild(render.domElement)

    let gemty = new BoxGeometry()
    let material = new MeshBasicMaterial({ color: 0xff2288 })
    let cube = new Mesh(gemty, material)
    scene.add(cube)

    camera.position.z = 5

    cube.rotation.x += 0.5
    cube.rotation.y += 0.5

    render.render(scene, camera)
  },
}
</script>

<style></style>
