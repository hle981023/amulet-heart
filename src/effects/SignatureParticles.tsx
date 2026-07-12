import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, OctahedronGeometry, SphereGeometry, Vector3 } from 'three'

import type { EffectField } from './EffectController'

const POOL = 48

type Spark = { active: boolean; age: number; life: number; position: Vector3; velocity: Vector3; fragment: boolean }

export function SignatureParticles({ field, activeCap }: { field: EffectField; activeCap: number }) {
  const sparkleRef = useRef<InstancedMesh>(null)
  const fragmentRef = useRef<InstancedMesh>(null)
  const sparkleToken = useRef(field.sparkleToken)
  const shockToken = useRef(field.shockToken)
  const dummy = useMemo(() => new Object3D(), [])
  const sparks = useMemo<Spark[]>(() => Array.from({ length: POOL }, () => ({ active: false, age: 0, life: 0.55, position: new Vector3(), velocity: new Vector3(), fragment: false })), [])
  const sparkleMaterial = useMemo(() => new MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: AdditiveBlending, depthWrite: false }), [])
  const fragmentMaterial = useMemo(() => new MeshBasicMaterial({ color: '#ffd166', transparent: true, blending: AdditiveBlending, depthWrite: false }), [])
  const sparkleGeometry = useMemo(() => new SphereGeometry(1, 5, 5), [])
  const fragmentGeometry = useMemo(() => new OctahedronGeometry(1, 0), [])

  const spawn = (fragment: boolean, count: number) => {
    let emitted = 0
    for (let index = 0; index < Math.min(activeCap, POOL) && emitted < count; index += 1) {
      const spark = sparks[index]
      if (spark.active) continue
      const angle = (emitted / count) * Math.PI * 2
      spark.active = true
      spark.age = 0
      spark.life = fragment ? 0.75 : 0.45
      spark.fragment = fragment
      spark.position.copy(field.origin)
      spark.velocity.set(Math.cos(angle), Math.sin(angle), 0).multiplyScalar(fragment ? 5 : 3.2)
      emitted += 1
    }
  }

  useFrame((_, delta) => {
    if (field.sparkleToken !== sparkleToken.current) { sparkleToken.current = field.sparkleToken; spawn(false, field.attackKind === 'strong' ? 16 : 8) }
    if (field.shockToken !== shockToken.current) { shockToken.current = field.shockToken; spawn(true, 12) }
    const sparkle = sparkleRef.current
    const fragment = fragmentRef.current
    if (!sparkle || !fragment) return
    let sparkleCount = 0
    let fragmentCount = 0
    for (const spark of sparks) {
      if (!spark.active) continue
      spark.age += delta
      if (spark.age >= spark.life) { spark.active = false; continue }
      spark.position.addScaledVector(spark.velocity, delta)
      const fade = (1 - spark.age / spark.life) * field.releaseOpacity
      dummy.position.copy(spark.position)
      dummy.rotation.z += delta * 8
      dummy.scale.setScalar((spark.fragment ? 0.18 : 0.09) * fade)
      dummy.updateMatrix()
      const target = spark.fragment ? fragment : sparkle
      const index = spark.fragment ? fragmentCount++ : sparkleCount++
      target.setMatrixAt(index, dummy.matrix)
    }
    sparkle.count = sparkleCount
    fragment.count = fragmentCount
    sparkle.instanceMatrix.needsUpdate = true
    fragment.instanceMatrix.needsUpdate = true
  })

  return <group>
    <instancedMesh ref={sparkleRef} args={[sparkleGeometry, sparkleMaterial, POOL]} />
    <instancedMesh ref={fragmentRef} args={[fragmentGeometry, fragmentMaterial, POOL]} />
  </group>
}

export function ScreenFlash({ field }: { field: EffectField }) {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(() => new MeshBasicMaterial({ color: '#fff7d6', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, depthTest: false }), [])
  const token = useRef(field.flashToken)
  const age = useRef(Infinity)
  useFrame((_, delta) => {
    if (field.flashToken !== token.current) { token.current = field.flashToken; age.current = 0 }
    age.current += delta
    material.opacity = age.current < 0.14 ? (1 - age.current / 0.14) * 0.65 * field.releaseOpacity : 0
    if (mesh.current) mesh.current.visible = material.opacity > 0
  })
  return <mesh ref={mesh} position={[0, 0, 10]} visible={false}><planeGeometry args={[100, 100]} /><primitive object={material} attach="material" /></mesh>
}
