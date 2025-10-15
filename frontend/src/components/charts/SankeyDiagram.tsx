import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph, SankeyNode, SankeyLink } from 'd3-sankey';

// --- Sevensa Branding Colors ---
const SEVENSA_PRIMARY = '#00A896'; // Teal
const SEVENSA_SECONDARY = '#2D3A45'; // Dark Gray

// --- TypeScript Interfaces ---

/**
 * Represents a node in the Sankey diagram.
 * The 'id' is used to link the nodes and must be unique.
 */
export interface Node {
  id: string;
  name: string;
  color?: string; // Optional custom color for the node
}

/**
 * Represents a link (flow) between two nodes.
 * 'source' and 'target' must match the 'id' of the Node objects.
 */
export interface Link {
  source: string;
  target: string;
  value: number;
  color?: string; // Optional custom color for the link
}

/**
 * The main data structure for the Sankey diagram.
 */
export interface SankeyData {
  nodes: Node[];
  links: Link[];
}

/**
 * Props for the SankeyDiagram component.
 */
export interface SankeyDiagramProps {
  data: SankeyData;
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  className?: string;
}

// --- Custom Hook for Measuring Container Dimensions (Responsiveness) ---
// A simple implementation of useMeasure for responsiveness
const useMeasure = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setBounds({ width, height });
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return [ref, bounds] as const;
};

// --- Tooltip Component ---
interface TooltipProps {
  x: number;
  y: number;
  content: React.ReactNode;
  isVisible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ x, y, content, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className="absolute z-50 p-2 text-xs text-white bg-gray-800 rounded shadow-lg pointer-events-none transition-opacity duration-200"
      style={{
        left: x + 10,
        top: y + 10,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {content}
    </div>
  );
};

// --- Main Sankey Diagram Component ---

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  data,
  width: propWidth,
  height: propHeight,
  nodeWidth = 15,
  nodePadding = 10,
  className = '',
}) => {
  const [containerRef, bounds] = useMeasure();
  const svgRef = useRef<SVGSVGElement>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
    isVisible: boolean;
  }>({ x: 0, y: 0, content: null, isVisible: false });

  const effectiveWidth = propWidth || bounds.width;
  const effectiveHeight = propHeight || bounds.height;

  // D3 color scale for nodes
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  useEffect(() => {
    if (!effectiveWidth || !effectiveHeight || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // 1. Setup Sankey Generator
    const sankeyGenerator = sankey<Node, Link>()
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [1, 1],
        [effectiveWidth - 1, effectiveHeight - 1],
      ]);

    // 2. Prepare Data for D3
    // D3 Sankey requires nodes to be objects and links to reference nodes by index.
    // We map the string IDs to the actual node objects for D3.
    const graph: SankeyGraph<Node, Link> = sankeyGenerator({
      nodes: data.nodes.map(d => ({ ...d })), // Deep copy to avoid mutation
      links: data.links.map(d => ({ ...d })),
    });

    // 3. Run the Sankey Layout
    sankeyGenerator(graph);

    // 4. Draw Links
    const link = svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.5)
      .selectAll('g')
      .data(graph.links)
      .join('g')
      .attr('class', 'sankey-link');

    const linkPath = sankeyLinkHorizontal();

    link
      .append('path')
      .attr('d', linkPath)
      .attr('stroke', (d) => d.color || SEVENSA_PRIMARY)
      .attr('stroke-width', (d) => Math.max(1, d.width || 0))
      .attr('fill', 'none')
      .on('mousemove', (event, d) => {
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: (
            <>
              <div className="font-bold">{d.source.name} → {d.target.name}</div>
              <div>Value: <span className="font-mono">{d.value.toLocaleString()}</span></div>
            </>
          ),
          isVisible: true,
        });
      })
      .on('mouseleave', () => {
        setTooltip((prev) => ({ ...prev, isVisible: false }));
      });

    // 5. Draw Nodes
    const node = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .attr('class', 'sankey-node')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    // Node Rectangles
    node
      .append('rect')
      .attr('height', (d) => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', nodeWidth)
      .attr('fill', (d) => d.color || SEVENSA_SECONDARY)
      .attr('stroke', SEVENSA_SECONDARY)
      .on('mousemove', (event, d) => {
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: (
            <>
              <div className="font-bold">Node: {d.name}</div>
              <div>Total Flow: <span className="font-mono">{(d.value || 0).toLocaleString()}</span></div>
            </>
          ),
          isVisible: true,
        });
      })
      .on('mouseleave', () => {
        setTooltip((prev) => ({ ...prev, isVisible: false }));
      });

    // Node Labels
    node
      .append('text')
      .attr('x', nodeWidth + 6)
      .attr('y', (d) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', SEVENSA_SECONDARY)
      .text((d) => d.name)
      .filter((d) => (d.x0 || 0) < effectiveWidth / 2)
      .attr('x', -6)
      .attr('text-anchor', 'end');

  }, [data, effectiveWidth, effectiveHeight, nodeWidth, nodePadding]);

  // --- Example Data for Preview/Default ---
  const exampleData: SankeyData = {
    nodes: [
      { id: 'A', name: 'Source A' },
      { id: 'B', name: 'Source B' },
      { id: 'C', name: 'Intermediate C' },
      { id: 'D', name: 'Target D' },
      { id: 'E', name: 'Target E' },
    ],
    links: [
      { source: 'A', target: 'C', value: 100 },
      { source: 'B', target: 'C', value: 50 },
      { source: 'C', target: 'D', value: 70 },
      { source: 'C', target: 'E', value: 80 },
    ],
  };

  const finalData = data.nodes.length > 0 ? data : exampleData;

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`relative w-full h-full min-h-[300px] ${className}`}
    >
      {effectiveWidth > 0 && effectiveHeight > 0 ? (
        <svg
          ref={svgRef}
          width={effectiveWidth}
          height={effectiveHeight}
          viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          Loading Sankey Diagram...
        </div>
      )}
      <Tooltip {...tooltip} />
    </div>
  );
};

export default SankeyDiagram;

// --- Example Usage (for documentation/testing) ---
/*
const App = () => {
  const data: SankeyData = {
    nodes: [
      { id: 'A', name: 'Marketing' },
      { id: 'B', name: 'Sales' },
      { id: 'C', name: 'Product' },
      { id: 'D', name: 'Revenue' },
      { id: 'E', name: 'Churn' },
      { id: 'F', name: 'Expansion' },
    ],
    links: [
      { source: 'A', target: 'C', value: 150, color: '#00A896' },
      { source: 'B', target: 'C', value: 100, color: '#00A896' },
      { source: 'C', target: 'D', value: 120, color: '#2D3A45' },
      { source: 'C', target: 'E', value: 80, color: '#2D3A45' },
      { source: 'C', target: 'F', value: 50, color: '#2D3A45' },
    ],
  };

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Sankey Diagram Example</h1>
      <div className="w-full h-[500px] border border-gray-300 rounded shadow-lg">
        <SankeyDiagram data={data} />
      </div>
    </div>
  );
};
*/