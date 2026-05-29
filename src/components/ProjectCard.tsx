import Link from 'next/link';
import { GitBranch, ExternalLink, ArrowUpRight } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  index: number;
  viewMode?: 'grid' | 'list';
}

export function ProjectCard({ project, index, viewMode = 'grid' }: ProjectCardProps) {
  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    paused: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    stuck: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    completed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  };

  const status = statusConfig[project.status] || statusConfig.active;
  const delay = index * 0.05;
  const githubUrl = `https://github.com/Namoneo/${project.name}`;

  // List View
  if (viewMode === 'list') {
    return (
      <Link
        href={`/projects/${project.id}`}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
          {project.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{project.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {project.task_count}
          </span>
          <span>🤖 {project.agent_count}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(githubUrl, '_blank', 'noopener,noreferrer');
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="View on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </Link>
    );
  }

  // Grid View (default)
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer animate-slide-up relative overflow-hidden block"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-blue-50/30 group-hover:via-purple-50/20 group-hover:to-pink-50/30 transition-all duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
              {project.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                <span className={`text-xs font-medium ${status.text}`}>{project.status}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(githubUrl, '_blank', 'noopener,noreferrer');
            }}
            className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-gray-100 rounded-lg"
            title="View on GitHub"
          >
            <ArrowUpRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{project.description || 'No description'}</p>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-medium">{project.task_count} tasks</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="font-medium">🤖 {project.agent_count} agents</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
