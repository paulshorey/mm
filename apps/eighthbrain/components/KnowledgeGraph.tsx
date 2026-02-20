'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import WebGPU from 'three/addons/capabilities/WebGPU.js'

type SpaceNode = {
  id: string
  val: number
  color: string
  x: number
  y: number
  z: number
}

type SpaceLink = {
  source: string
  target: string
  color: string
  width: number
  curvature: number
  particles: number
  speed: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function generateKnowledgeGraph() {
  const coreColors = ['#f59e0b', '#fbbf24', '#84cc16', '#22c55e']
  const planetColors = ['#f97316', '#fb923c', '#facc15', '#a3e635', '#4ade80']
  const rogueColors = ['#fde047', '#facc15', '#bef264']

  const nodes: SpaceNode[] = []
  const links: SpaceLink[] = []
  const seenLinks = new Set<string>()
  const clusterNodeIds: string[][] = []
  const coreNodeIds: string[] = []

  const addLink = (source: string, target: string, config?: Partial<SpaceLink>) => {
    if (source === target) return
    const key = [source, target].sort().join('::')
    if (seenLinks.has(key)) return
    seenLinks.add(key)

    links.push({
      source,
      target,
      color: config?.color ?? 'rgba(163, 230, 53, 0.28)',
      width: config?.width ?? rand(0.4, 1.3),
      curvature: config?.curvature ?? rand(-0.2, 0.2),
      particles: config?.particles ?? (Math.random() > 0.6 ? 2 : 1),
      speed: config?.speed ?? rand(0.002, 0.01),
    })
  }

  const clusterCount = 8
  for (let c = 0; c < clusterCount; c++) {
    const armAngle = (c / clusterCount) * Math.PI * 2 + rand(-0.25, 0.25)
    const armRadius = rand(190, 360)
    const center = {
      x: Math.cos(armAngle) * armRadius,
      y: rand(-120, 120),
      z: Math.sin(armAngle) * armRadius,
    }

    const coreId = `core-${c}`
    coreNodeIds.push(coreId)
    clusterNodeIds[c] = [coreId]
    nodes.push({
      id: coreId,
      val: rand(12, 18),
      color: coreColors[c % coreColors.length] ?? '#dbeafe',
      ...center,
    })

    const satellites = Math.floor(rand(11, 17))
    for (let i = 0; i < satellites; i++) {
      const nodeId = `cluster-${c}-${i}`
      clusterNodeIds[c]?.push(nodeId)
      const orbit = rand(60, 170)
      const theta = rand(0, Math.PI * 2)
      const phi = rand(0.2, Math.PI - 0.2)
      const x = center.x + orbit * Math.sin(phi) * Math.cos(theta)
      const y = center.y + orbit * Math.cos(phi)
      const z = center.z + orbit * Math.sin(phi) * Math.sin(theta)

      nodes.push({
        id: nodeId,
        val: rand(2.2, 7.2),
        color: planetColors[(c + i) % planetColors.length] ?? '#818cf8',
        x,
        y,
        z,
      })

      addLink(coreId, nodeId, {
        color: 'rgba(251, 191, 36, 0.44)',
        width: rand(0.6, 1.6),
        particles: 2,
        speed: rand(0.004, 0.013),
      })

      if (i > 1 && Math.random() > 0.35) {
        addLink(`cluster-${c}-${Math.floor(Math.random() * i)}`, nodeId, {
          color: 'rgba(249, 115, 22, 0.3)',
          width: rand(0.3, 0.95),
          particles: 1,
        })
      }

      if (i > 2 && Math.random() > 0.7) {
        addLink(`cluster-${c}-${i - 1}`, nodeId, {
          color: 'rgba(163, 230, 53, 0.34)',
          width: rand(0.4, 1.1),
          particles: 2,
          speed: rand(0.005, 0.016),
        })
      }
    }
  }

  for (let i = 0; i < coreNodeIds.length; i++) {
    const next = coreNodeIds[(i + 1) % coreNodeIds.length]
    const current = coreNodeIds[i]
    if (!next || !current) continue

    addLink(current, next, {
      color: 'rgba(253, 224, 71, 0.36)',
      width: rand(1.2, 2.1),
      curvature: rand(-0.33, 0.33),
      particles: 3,
      speed: rand(0.003, 0.01),
    })

    if (Math.random() > 0.28) {
      const skip = coreNodeIds[(i + 2) % coreNodeIds.length]
      if (skip) {
        addLink(current, skip, {
          color: 'rgba(34, 197, 94, 0.3)',
          width: rand(0.6, 1.3),
          curvature: rand(-0.45, 0.45),
          particles: 2,
        })
      }
    }
  }

  const rogueCount = 26
  for (let i = 0; i < rogueCount; i++) {
    const rogueId = `rogue-${i}`
    nodes.push({
      id: rogueId,
      val: rand(1.3, 4.2),
      color: rogueColors[i % rogueColors.length] ?? '#fde68a',
      x: rand(-460, 460),
      y: rand(-280, 280),
      z: rand(-460, 460),
    })

    const anchorCluster = Math.floor(rand(0, clusterCount))
    const anchorNodes = clusterNodeIds[anchorCluster] ?? []
    for (let j = 0; j < Math.floor(rand(1, 3)); j++) {
      const anchor = anchorNodes[Math.floor(Math.random() * anchorNodes.length)]
      if (anchor) {
        addLink(rogueId, anchor, {
          color: 'rgba(132, 204, 22, 0.28)',
          width: rand(0.25, 0.9),
          curvature: rand(-0.55, 0.55),
          particles: 1,
          speed: rand(0.003, 0.009),
        })
      }
    }
  }

  return { nodes, links }
}

export function KnowledgeGraph() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const graphData = useMemo(generateKnowledgeGraph, [])

  useEffect(() => {
    const mountEl = mountRef.current
    if (!mountEl) return
    if (!WebGPU.isAvailable()) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 9000)
    camera.position.set(0, 160, 2100)

    const renderer = new WebGPURenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    const maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    let currentPixelRatio = maxPixelRatio
    renderer.setPixelRatio(currentPixelRatio)
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight)
    renderer.domElement.style.pointerEvents = 'none'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    mountEl.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0x403318, 0.95)
    const key = new THREE.DirectionalLight(0xfff2bf, 0.9)
    key.position.set(230, 250, 180)
    scene.add(ambient, key)

    const starsGeometry = new THREE.BufferGeometry()
    const starCount = 3000
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      starPos[i3] = rand(-2600, 2600)
      starPos[i3 + 1] = rand(-1700, 1700)
      starPos[i3 + 2] = rand(-2600, 2600)
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starsMaterial = new THREE.PointsMaterial({
      size: 2.1,
      sizeAttenuation: true,
      color: new THREE.Color('#fef3c7'),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16)
    const nodeMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.34,
      metalness: 0.1,
      emissive: new THREE.Color('#2a1a00'),
      emissiveIntensity: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
    })
    const nodeMesh = new THREE.InstancedMesh(sphereGeometry, nodeMaterial, graphData.nodes.length)
    const nodeDummy = new THREE.Object3D()
    const nodePosById = new Map<string, THREE.Vector3>()
    graphData.nodes.forEach((node, i) => {
      const pos = new THREE.Vector3(node.x, node.y, node.z)
      nodePosById.set(node.id, pos)
      nodeDummy.position.copy(pos)
      const scale = Math.max(2.2, node.val * 1.35)
      nodeDummy.scale.setScalar(scale)
      nodeDummy.updateMatrix()
      nodeMesh.setMatrixAt(i, nodeDummy.matrix)
      nodeMesh.setColorAt(i, new THREE.Color(node.color))
    })
    nodeMesh.instanceMatrix.needsUpdate = true
    if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true
    scene.add(nodeMesh)

    const linePositions: number[] = []
    const lineColors: number[] = []

    type LinkSegment = {
      start: THREE.Vector3
      end: THREE.Vector3
      color: THREE.Color
      speed: number
    }
    const segments: LinkSegment[] = []

    graphData.links.forEach((link) => {
      const start = nodePosById.get(link.source)
      const end = nodePosById.get(link.target)
      if (!start || !end) return

      const c = new THREE.Color(link.color)
      linePositions.push(start.x, start.y, start.z, end.x, end.y, end.z)
      lineColors.push(c.r, c.g, c.b, c.r, c.g, c.b)
      segments.push({ start, end, color: c, speed: link.speed })
    })

    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3))
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      depthTest: false,
    })
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    lineMesh.frustumCulled = false
    scene.add(lineMesh)

    const flowCount = Math.min(260, segments.length * 2)
    const flowGeometry = new THREE.SphereGeometry(0.95, 10, 10)
    const flowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#bef264'),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const flowMesh = new THREE.InstancedMesh(flowGeometry, flowMaterial, flowCount)
    const flowDummy = new THREE.Object3D()
    const flowState = Array.from({ length: flowCount }, (_, i) => {
      const seg = segments[i % segments.length]
      return {
        seg,
        offset: Math.random(),
        speedMul: rand(0.55, 1.45),
      }
    })
    scene.add(flowMesh)

    const startDistance = 2300
    const endDistance = 240
    const startHeight = 180
    const endHeight = 20
    const startAngle = -0.32
    const endAngle = 0.12
    const zoomDelayMs = 1200
    const zoomDurationMs = 28000
    const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

    let destroyed = false
    let startTs = 0
    let previousTs = 0
    let emaFrameMs = 16
    let frameCounter = 0
    let hiddenStartedAt = 0
    let pausedDuration = 0

    const resize = (pixelRatio = currentPixelRatio) => {
      const width = mountEl.clientWidth || window.innerWidth
      const height = mountEl.clientHeight || window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height)
    }
    resize()

    const resizeObserver = new ResizeObserver(() => {
      resize()
    })
    resizeObserver.observe(mountEl)

    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenStartedAt = performance.now()
      } else if (hiddenStartedAt) {
        pausedDuration += performance.now() - hiddenStartedAt
        hiddenStartedAt = 0
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const webGpuDeviceLossPromise = (renderer as unknown as { backend?: { device?: { lost?: Promise<unknown> } } })
      .backend?.device?.lost
    if (webGpuDeviceLossPromise) {
      webGpuDeviceLossPromise.then(() => {
        if (!destroyed) {
          destroyed = true
          renderer.setAnimationLoop(null)
        }
      })
    }

    const adjustPixelRatio = () => {
      const highLoad = emaFrameMs > 19.5
      const lowLoad = emaFrameMs < 14.5
      let next = currentPixelRatio
      if (highLoad && currentPixelRatio > 1) {
        next = Math.max(1, currentPixelRatio - 0.1)
      } else if (lowLoad && currentPixelRatio < maxPixelRatio) {
        next = Math.min(maxPixelRatio, currentPixelRatio + 0.1)
      }
      if (next !== currentPixelRatio) {
        currentPixelRatio = Number(next.toFixed(2))
        resize(currentPixelRatio)
      }
    }

    const animate = (ts: number) => {
      if (destroyed) return
      if (document.hidden) return
      if (startTs === 0) startTs = ts
      if (previousTs === 0) previousTs = ts

      const rawFrameMs = Math.min(100, Math.max(1, ts - previousTs))
      previousTs = ts
      emaFrameMs = emaFrameMs * 0.92 + rawFrameMs * 0.08
      frameCounter += 1
      if (frameCounter % 45 === 0) adjustPixelRatio()

      const elapsed = ts - startTs - pausedDuration
      const zoomElapsed = Math.max(0, elapsed - zoomDelayMs)
      const zoomT = Math.min(zoomElapsed / zoomDurationMs, 1)
      const eased = easeOutExpo(zoomT)

      const angle = startAngle + (endAngle - startAngle) * eased + elapsed * 0.00002
      const distance = startDistance + (endDistance - startDistance) * eased
      const y = startHeight + (endHeight - startHeight) * eased + Math.sin(elapsed * 0.00055) * 9
      camera.position.set(Math.cos(angle) * distance, y, Math.sin(angle) * distance)
      camera.lookAt(0, 0, 0)

      const time = elapsed * 0.001
      stars.rotation.y = time * 0.008
      stars.rotation.x = Math.sin(time * 0.13) * 0.015

      for (let i = 0; i < flowState.length; i++) {
        const flow = flowState[i]
        if (!flow) continue
        const seg = flow.seg
        if (!seg) continue

        const t = (time * (seg.speed * 22) * flow.speedMul + flow.offset) % 1
        flowDummy.position.lerpVectors(seg.start, seg.end, t)
        const pulse = 0.8 + Math.sin((t + i * 0.073) * Math.PI * 2) * 0.25
        flowDummy.scale.setScalar(pulse)
        flowDummy.updateMatrix()
        flowMesh.setMatrixAt(i, flowDummy.matrix)
      }
      flowMesh.instanceMatrix.needsUpdate = true

      renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(animate)

    renderer.init().catch(() => {
      if (!destroyed) {
        destroyed = true
        renderer.setAnimationLoop(null)
      }
    })

    return () => {
      destroyed = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      resizeObserver.disconnect()
      renderer.setAnimationLoop(null)

      starsGeometry.dispose()
      starsMaterial.dispose()
      sphereGeometry.dispose()
      nodeMaterial.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      flowGeometry.dispose()
      flowMaterial.dispose()

      renderer.dispose()
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement)
      }
    }
  }, [graphData])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#02030b]" />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 12% 22%, rgba(255,255,255,0.85), transparent 70%),
            radial-gradient(1.7px 1.7px at 26% 78%, rgba(219,234,254,0.78), transparent 70%),
            radial-gradient(2px 2px at 42% 12%, rgba(196,181,253,0.72), transparent 70%),
            radial-gradient(1.5px 1.5px at 64% 26%, rgba(253,224,71,0.62), transparent 70%),
            radial-gradient(2.2px 2.2px at 81% 61%, rgba(167,139,250,0.75), transparent 70%),
            radial-gradient(1.6px 1.6px at 89% 17%, rgba(255,255,255,0.65), transparent 70%),
            radial-gradient(1.4px 1.4px at 72% 88%, rgba(56,189,248,0.62), transparent 70%),
            radial-gradient(1.8px 1.8px at 17% 58%, rgba(244,114,182,0.58), transparent 70%),
            radial-gradient(ellipse at 16% 26%, rgba(67,56,202,0.24), transparent 55%),
            radial-gradient(ellipse at 84% 74%, rgba(14,165,233,0.2), transparent 58%),
            radial-gradient(ellipse at 66% 18%, rgba(147,51,234,0.18), transparent 52%)
          `,
        }}
      />
      <div className="absolute top-[12%] right-[9%] h-44 w-44 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute bottom-[14%] left-[8%] h-56 w-56 rounded-full bg-fuchsia-500/18 blur-3xl" />
      <div className="absolute top-[42%] left-[40%] h-36 w-36 rounded-full bg-cyan-500/16 blur-3xl" />

      <div ref={mountRef} className="pointer-events-none absolute inset-0 opacity-[0.7]" />
    </div>
  )
}
