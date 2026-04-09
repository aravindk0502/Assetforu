'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdsBadge } from '@/components/AdsBadge';

interface CampaignImageCarouselProps {
    images: string[];
    title: string;
    showAds?: boolean;
}

export function CampaignImageCarousel({ images, title, showAds = true }: CampaignImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);

    // Auto-scroll every 5 seconds
    useEffect(() => {
        if (!isAutoPlay || !images.length) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [isAutoPlay, images.length]);

    // Resume autoplay after 10 seconds of manual interaction
    useEffect(() => {
        if (!isAutoPlay) {
            const timer = setTimeout(() => {
                setIsAutoPlay(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isAutoPlay]);

    const goToPrevious = () => {
        setIsAutoPlay(false);
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToNext = () => {
        setIsAutoPlay(false);
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const goToSlide = (index: number) => {
        setIsAutoPlay(false);
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <span className="text-slate-500 text-sm">No images available</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-100">
            {/* Image Container */}
            <div className="relative w-full h-full">
                {/* Current Image */}
                <img
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={`${title} - Slide ${currentIndex + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                />

                <AdsBadge show={showAds} />

                {/* Previous Button */}
                <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-slate-900 transition-all shadow-md hover:shadow-lg"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next Button */}
                <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-slate-900 transition-all shadow-md hover:shadow-lg"
                    aria-label="Next image"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Image Counter */}
                <div className="absolute top-2 right-2 z-20 bg-slate-900/70 text-white px-2.5 py-1.5 rounded-full text-xs font-semibold">
                    {currentIndex + 1}/{images.length}
                </div>

                {/* Indicator Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`transition-all rounded-full ${index === currentIndex
                                        ? 'bg-white w-6 h-2'
                                        : 'bg-white/50 w-2 h-2 hover:bg-white/75'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
