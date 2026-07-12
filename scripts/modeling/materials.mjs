import * as THREE from 'three'

export const materials = {
  blush: new THREE.MeshStandardMaterial({ color: 0xf383ad, roughness: 0.42, metalness: 0.05 }),
  rose: new THREE.MeshStandardMaterial({ color: 0xffb2c9, roughness: 0.34, metalness: 0.04 }),
  palePink: new THREE.MeshStandardMaterial({ color: 0xffd1df, roughness: 0.3, metalness: 0.03 }),
  black: new THREE.MeshStandardMaterial({ color: 0x09070a, roughness: 0.28, metalness: 0.15 }),
  gold: new THREE.MeshPhysicalMaterial({ color: 0xe8aa25, roughness: 0.2, metalness: 0.88, clearcoat: 0.72, clearcoatRoughness: 0.16 }),
  darkGold: new THREE.MeshPhysicalMaterial({ color: 0xb76d13, roughness: 0.26, metalness: 0.82, clearcoat: 0.5 }),
  pearlPink: new THREE.MeshPhysicalMaterial({ color: 0xffb7d2, roughness: 0.12, metalness: 0.05, transmission: 0.06, thickness: 0.35, ior: 1.7, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.68, iridescenceIOR: 1.35 }),
}

