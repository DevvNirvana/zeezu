"use client";

import React, { useRef, useCallback, useEffect } from 'react';

interface ClickSparkProps {
    children: React.ReactNode;
    sparkColor?: string;
    sparkCount?: number;
    sparkSize?: number;
    sparkRadius?: number;
    duration?: number;
    extraScale?: number;
}

export default function ClickSpark({
    children,
    sparkColor = '#8A2EFF',
    sparkCount = 8,
    sparkSize = 10,
    duration = 500,
}: ClickSparkProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const createSpark = useCallback(
        (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const sparks: {
                x: number;
                y: number;
                vx: number;
                vy: number;
                life: number;
                maxLife: number;
                size: number;
            }[] = [];

            for (let i = 0; i < sparkCount; i++) {
                const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5;
                const speed = 2 + Math.random() * 3;
                sparks.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: duration,
                    maxLife: duration,
                    size: sparkSize * (0.5 + Math.random() * 0.5),
                });
            }

            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed >= duration) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                sparks.forEach((spark) => {
                    spark.x += spark.vx;
                    spark.y += spark.vy;
                    spark.vy += 0.05;
                    spark.life -= 16;

                    const alpha = Math.max(0, spark.life / spark.maxLife);
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = sparkColor;
                    ctx.beginPath();
                    ctx.arc(spark.x, spark.y, spark.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                });

                requestAnimationFrame(animate);
            };

            animate();
        },
        [sparkColor, sparkCount, sparkSize, duration]
    );

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const resize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };
        resize();

        const observer = new ResizeObserver(resize);
        observer.observe(container);

        container.addEventListener('click', createSpark);

        return () => {
            observer.disconnect();
            container.removeEventListener('click', createSpark);
        };
    }, [createSpark]);

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            {children}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}
            />
        </div>
    );
}
