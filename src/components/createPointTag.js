import { SpriteMaterial, TextureLoader, Sprite, Vector3 } from 'three'
export default function createPoint(mesh) {
  let spirtMa = new SpriteMaterial({
    map: new TextureLoader().load(require('@/assets/model/光点.png')),
    transparent: true,
  })
  spirtMa = new Sprite(spirtMa)
  let pos = new Vector3()
  mesh.getWorldPosition(pos)
  spirtMa.position.copy(pos)
  spirtMa.scale.set(6, 6, 1)
  return spirtMa
}
