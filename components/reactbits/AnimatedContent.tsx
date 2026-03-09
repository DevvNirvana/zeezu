"use client";

import React, { useRef, useEffect, useState } from 'react';
import './AnimatedContent.css';

interface AnimatedContentProps {
    children: React.ReactNode;
    className?: string;
    /** Unique key to trigger re-animation on change */
    animationKey?: string | number;
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
    distance?: number;
}

export default function AnimatedContent({
    children,
    className = '',
    animationKey,
    direction = 'up',
    duration = 400,
    distance = 12,
}: AnimatedContentProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(false);
        const t = setTimeout(() => setVisible(true), 20);
        return () => clearTimeout(t);
    }, [animationKey]);

    const transform = visible
        ? 'translateY(0) translateX(0) scale(1)'
        : direction === 'up'
            ? `translateY(${distance}px) scale(0.98)`
            : direction === 'down'
                ? `translateY(-${distance}px) scale(0.98)`
                : direction === 'left'
                    ? `translateX(${distance}px) scale(0.98)`
                    : `translateX(-${distance}px) scale(0.98)`;

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform,
                transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}
