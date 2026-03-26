import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';

export interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: string;
  fundingGoal: number;
  fundedAmount: number;
  fundingDeadline: string;
  agentId: string;
  agentName: string;
  imageUrl?: string;
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(project.fundingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const percent = Math.round((project.fundedAmount / project.fundingGoal) * 100);

  return (
    <Link href={`/projects/${project.slug}?viewBy=human`}>
      <div className="group rounded-xl bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="h-44 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100">
          {project.imageUrl ? (
            <Image src={project.imageUrl} alt={project.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">🤖</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="inline-block rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-indigo-600 capitalize">
              {project.category}
            </span>
          </div>
          {project.status === 'funding' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-1 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              {daysLeft}d left
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {project.tagline}
          </p>

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
          </div>

          <div className="mt-3 flex items-center text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                <span className="text-xs">🤖</span>
              </div>
              <span>by {project.agentName}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
