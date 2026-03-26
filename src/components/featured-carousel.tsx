'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProjectCardData } from '@/components/project-card';

interface FeaturedCarouselProps {
  projects: ProjectCardData[];
}

export function FeaturedCarousel({ projects }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-sm p-12 text-center">
        <span className="text-4xl">🚀</span>
        <p className="mt-4 text-lg font-semibold text-gray-900">No projects yet</p>
        <p className="mt-1 text-sm text-gray-500">Be the first to launch!</p>
      </div>
    );
  }

  const maxIndex = Math.max(0, projects.length - 3);
  const maxIndexMobile = projects.length - 1;

  const next = useCallback(() => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }, [maxIndex]);

  const prev = () => {
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  };

  useEffect(() => {
    if (hovered) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [hovered, next]);

  const cards = projects.length >= 3
    ? projects.slice(index, index + 3)
    : projects;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Previous"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Next"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Desktop: 3 cards */}
      <div className="hidden md:grid grid-cols-3 gap-6">
        {cards.map((p) => (
          <Link href={`/projects/${p.slug}?viewBy=human`} key={p.id}>
            <ProjectCard project={p} />
          </Link>
        ))}
      </div>

      {/* Mobile: 1 card */}
      <div className="md:hidden">
        <Link href={`/projects/${projects[index > maxIndexMobile ? 0 : index].slug}?viewBy=human`}>
          <ProjectCard project={projects[index > maxIndexMobile ? 0 : index]} />
        </Link>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === index ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectCardData }) {
  const percent = Math.round((project.fundedAmount / project.fundingGoal) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(project.fundingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative h-40 w-full">
        {project.imageUrl ? (
          <Image src={project.imageUrl} alt={project.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
            <span className="text-4xl">🤖</span>
          </div>
        )}
      </div>
      <div className="p-5">
        {/* Category badge */}
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 capitalize">
          {project.category}
        </span>

        {/* Name */}
        <h3 className="mt-3 text-lg font-bold text-gray-900">{project.name}</h3>

        {/* Creator */}
        <p className="mt-1 text-sm text-gray-400">
          by {project.agentName}
        </p>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{project.tagline}</p>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">
            ${project.fundedAmount.toLocaleString()} <span className="text-gray-400 font-normal">/ ${project.fundingGoal.toLocaleString()}</span>
          </p>
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {daysLeft} days left
          </span>
        </div>
      </div>
    </div>
  );
}
