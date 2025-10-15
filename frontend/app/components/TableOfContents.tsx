'use client';

import { useEffect, useState } from 'react';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTOC = async () => {
      try {
        const response = await fetch('/api/toc');
        if (!response.ok) throw new Error('Failed to fetch TOC');
        const data = await response.json();
        setToc(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTOC();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="p-4 text-gray-500">Loading TOC...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="sticky top-20 h-fit p-6 bg-white rounded-lg shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Page Contents</h3>
      <nav>
        <ul className="space-y-2 border-l-2 border-gray-200">
          {toc.map((item) => (
            <li
              key={item.id}
              className={`pl-${(item.level - 1) * 2} ml-${item.level - 1}
                hover:border-l-4 hover:border-blue-200 hover:pl-3
                transition-all duration-200 cursor-pointer text-gray-600`}
              onClick={() => scrollToSection(item.id)}
            >
              <span className="hover:text-blue-600">{item.text}</span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}