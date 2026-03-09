import React, { useRef, useCallback } from 'react';
import './SpotlightCard.css';

interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}

export default function SpotlightCard({
    children,
    className = '',
    spotlightColor = 'rgba(138, 46, 255, 0.15)',
}: SpotlightCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--x', `${x}%`);
        card.style.setProperty('--y', `${y}%`);
        card.style.setProperty('--spotlight-color', spotlightColor);
    }, [spotlightColor]);

    return (
        <div
            ref={cardRef}
            className={`spotlight-card-rb ${className}`}
            onMouseMove={handleMouseMove}
        >
            {children}
        </div>
    );
}
