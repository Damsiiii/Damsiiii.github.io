'use client'
import * as React from 'react'
import { useEffect, useRef } from 'react'
import { createNoise2D } from 'simplex-noise'

interface Point {
    x: number
    y: number
    wave: { x: number; y: number }
    cursor: {
        x: number
        y: number
        vx: number
        vy: number
    }
}

interface WavesProps {
    className?: string
    strokeColor?: string
    backgroundColor?: string
    pointerSize?: number
}

export function Waves({
    className = "",
    strokeColor = "#2d2d2d",  // Pencil lead color
    backgroundColor = "#fdfbf7",  // Warm paper background
    pointerSize = 0.5
}: WavesProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const mouseRef = useRef({
        x: -10,
        y: 0,
        lx: 0,
        ly: 0,
        sx: 0,
        sy: 0,
        v: 0,
        vs: 0,
        a: 0,
        set: false,
    })
    const pathsRef = useRef<SVGPathElement[]>([])
    const linesRef = useRef<Point[][]>([])  // 替换any为Point[][]
    const noiseRef = useRef<((x: number, y: number) => number) | null>(null)  // 替换any为具体的函数类型
    const rafRef = useRef<number | null>(null)
    const boundingRef = useRef<DOMRect | null>(null)

    // Initialization
    useEffect(() => {
        if (!containerRef.current || !svgRef.current) return

        // Initialize noise generator
        noiseRef.current = createNoise2D()

        // Initialize size and lines
        setSize()
        setLines()

        // Bind events
        window.addEventListener('resize', onResize)
        window.addEventListener('mousemove', onMouseMove)
        containerRef.current.addEventListener('touchmove', onTouchMove, { passive: false })

        // Start animation
        rafRef.current = requestAnimationFrame(tick)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', onResize)
            window.removeEventListener('mousemove', onMouseMove)
            containerRef.current?.removeEventListener('touchmove', onTouchMove)
        }
    }, [])

    // Set SVG size
    const setSize = () => {
        if (!containerRef.current || !svgRef.current) return

        boundingRef.current = containerRef.current.getBoundingClientRect()
        const { width, height } = boundingRef.current

        svgRef.current.style.width = `${width}px`
        svgRef.current.style.height = `${height}px`
    }

    // Setup lines - more points for smoother curves
    const setLines = () => {
        if (!svgRef.current || !boundingRef.current) return

        const { width, height } = boundingRef.current
        linesRef.current = []

        // Clear existing paths
        pathsRef.current.forEach(path => {
            path.remove()
        })
        pathsRef.current = []

        // Use smaller spacing to generate more lines and points for smoother results
        const xGap = 8  // Reduced horizontal spacing
        const yGap = 8  // Reduced vertical spacing for denser points

        const oWidth = width + 200
        const oHeight = height + 30

        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)

        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        // Create vertical lines
        for (let i = 0; i < totalLines; i++) {
            const points: Point[] = []

            for (let j = 0; j < totalPoints; j++) {
                const point: Point = {
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                }

                points.push(point)
            }

            // Create SVG path
            const path = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            )
            path.classList.add('a__line')
            path.classList.add('js-line')
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', strokeColor)
            path.setAttribute('stroke-width', '1')

            svgRef.current.appendChild(path)
            pathsRef.current.push(path)

            // Add points
            linesRef.current.push(points)
        }
    }

    // Resize handler
    const onResize = () => {
        setSize()
        setLines()
    }

    // Mouse handler
    const onMouseMove = (e: MouseEvent) => {
        updateMousePosition(e.clientX, e.clientY)
    }

    // Touch handler
    const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            updateMousePosition(e.touches[0].clientX, e.touches[0].clientY)
        }
    }

    // Update mouse position
    const updateMousePosition = (clientX: number, clientY: number) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const mouse = mouseRef.current
        mouse.x = clientX - rect.left
        mouse.y = clientY - rect.top

        if (!mouse.set) {
            mouse.sx = mouse.x
            mouse.sy = mouse.y
            mouse.lx = mouse.x
            mouse.ly = mouse.y
            mouse.set = true
            containerRef.current.style.setProperty('--opacity', '1')
        }

        containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
        containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
    }

    // Move points - smoother wave motion with interactive mouse repulsion
    const movePoints = (time: number) => {
        const { current: lines } = linesRef
        const { current: mouse } = mouseRef
        const { current: noise } = noiseRef

        if (!noise) return

        const radius = 160

        lines.forEach((points) => {
            points.forEach((p: Point) => {
                // Ambient wave movement
                const move = noise(
                    (p.x + time * 0.008) * 0.003,
                    (p.y + time * 0.003) * 0.002
                ) * 8

                p.wave.x = Math.cos(move) * 12
                p.wave.y = Math.sin(move) * 6

                // Cursor interactive force
                if (mouse.set) {
                    const dx = p.x - mouse.sx
                    const dy = p.y - mouse.sy
                    const d = Math.hypot(dx, dy)

                    if (d < radius && d > 0) {
                        const s = 1 - d / radius
                        const force = Math.sin(s * Math.PI) * 12
                        const angle = Math.atan2(dy, dx)

                        // Proximity push
                        p.cursor.vx += Math.cos(angle) * force * 0.04
                        p.cursor.vy += Math.sin(angle) * force * 0.04

                        // Motion directional force if moving
                        if (mouse.vs > 0.5) {
                            p.cursor.vx += Math.cos(mouse.a) * s * mouse.vs * 0.005
                            p.cursor.vy += Math.sin(mouse.a) * s * mouse.vs * 0.005
                        }
                    }
                }

                // Restoration spring force
                p.cursor.vx += (0 - p.cursor.x) * 0.03
                p.cursor.vy += (0 - p.cursor.y) * 0.03

                // Damping
                p.cursor.vx *= 0.92
                p.cursor.vy *= 0.92

                p.cursor.x += p.cursor.vx
                p.cursor.y += p.cursor.vy

                // Limits
                p.cursor.x = Math.min(60, Math.max(-60, p.cursor.x))
                p.cursor.y = Math.min(60, Math.max(-60, p.cursor.y))
            })
        })
    }

    // Get moved point coordinates
    const moved = (point: Point, withCursorForce = true) => {
        const coords = {
            x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
            y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
        }

        return coords
    }

    // Draw lines - using line segments
    const drawLines = () => {
        const { current: lines } = linesRef
        const { current: paths } = pathsRef

        lines.forEach((points, lIndex) => {
            if (points.length < 2 || !paths[lIndex]) return;

            // First point
            const firstPoint = moved(points[0], false)
            let d = `M ${firstPoint.x} ${firstPoint.y}`

            // Connect points with lines
            for (let i = 1; i < points.length; i++) {
                const current = moved(points[i])
                d += `L ${current.x} ${current.y}`
            }

            paths[lIndex].setAttribute('d', d)
        })
    }

    // Animation logic
    const tick = (time: number) => {
        const { current: mouse } = mouseRef

        if (mouse.set) {
            // Smooth mouse movement
            mouse.sx += (mouse.x - mouse.sx) * 0.12
            mouse.sy += (mouse.y - mouse.sy) * 0.12

            // Mouse velocity
            const dx = mouse.x - mouse.lx
            const dy = mouse.y - mouse.ly
            const d = Math.hypot(dx, dy)

            mouse.v = d
            mouse.vs += (d - mouse.vs) * 0.1
            mouse.vs = Math.min(100, mouse.vs)

            // Previous mouse position
            mouse.lx = mouse.x
            mouse.ly = mouse.y

            // Mouse angle
            if (d > 0.01) {
                mouse.a = Math.atan2(dy, dx)
            }

            if (containerRef.current) {
                containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
                containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
            }
        }

        movePoints(time)
        drawLines()

        rafRef.current = requestAnimationFrame(tick)
    }

    return (
        <div
            ref={containerRef}
            className={`waves-component relative overflow-hidden ${className}`}
            style={{
                backgroundColor,
                position: 'absolute',
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                '--x': '-100px',
                '--y': '-100px',
                '--opacity': '0',
            } as React.CSSProperties}
        >
            <svg
                ref={svgRef}
                className="block w-full h-full js-svg pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
            />
            <div
                className="pointer-dot pointer-events-none"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    width: `${pointerSize}rem`,
                    height: `${pointerSize}rem`,
                    background: strokeColor,
                    borderRadius: '50%',
                    opacity: 'var(--opacity, 0)',
                    transform: 'translate3d(calc(var(--x, -100px) - 50%), calc(var(--y, -100px) - 50%), 0)',
                    transition: 'opacity 0.25s ease',
                    willChange: 'transform, opacity',
                }}
            />
        </div>
    )
}
