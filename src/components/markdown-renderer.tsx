'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-gray-900 mt-3 mb-1">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 hover:underline"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => {
    const imgSrc = typeof src === 'string' ? src : undefined;
    return (
      <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={alt || ''}
          className="rounded-lg shadow-md max-w-full h-auto my-4"
          loading="lazy"
        />
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-gray-700">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-4">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className={`${className} text-sm`}>{children}</code>
      );
    }
    return (
      <code className="bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono text-gray-800">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto mb-4 text-sm font-mono">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-200 text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-3 py-2 text-gray-700">{children}</td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
};

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
