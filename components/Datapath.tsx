'use client';

import React from 'react';

interface DatapathProps {
  mnemonic?: string;
  instructionText?: string;
}

export function Datapath({ mnemonic, instructionText }: DatapathProps) {
  // Determine active control signals based on mnemonic
  const isRType = ['add', 'sub', 'and', 'or', 'slt', 'sll', 'jr', 'mflo', 'mfhi', 'mult', 'div'].includes(mnemonic || '');
  const isLw = mnemonic === 'lw';
  const isSw = mnemonic === 'sw';
  const isBeq = mnemonic === 'beq' || mnemonic === 'bne';
  const isJ = mnemonic === 'j' || mnemonic === 'jal';
  const isI = ['addi', 'ori', 'slti', 'lui'].includes(mnemonic || '');

  const regDst = isRType ? 1 : 0;
  const aluSrc = (isLw || isSw || isI) ? 1 : 0;
  const memToReg = isLw ? 1 : 0;
  const regWrite = (isRType || isLw || isI || mnemonic === 'jal') && !['jr', 'mult', 'div'].includes(mnemonic || '') ? 1 : 0;
  const memRead = isLw ? 1 : 0;
  const memWrite = isSw ? 1 : 0;
  const branch = isBeq ? 1 : 0;
  const jump = isJ ? 1 : 0;

  const activeColor = "#3b82f6"; // blue-500
  const inactiveColor = "#3f3f46"; // zinc-700
  const textColor = "#e4e4e7"; // zinc-200

  const getStroke = (active: boolean | number) => active ? activeColor : inactiveColor;
  const getFill = (active: boolean | number) => active ? `${activeColor}33` : 'transparent'; // 33 is 20% opacity

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-950 overflow-auto">
      <svg viewBox="0 0 800 500" className="w-full max-w-4xl h-auto font-sans text-[10px]">
        <defs>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={activeColor} />
          </marker>
          <marker id="arrow-inactive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={inactiveColor} />
          </marker>
        </defs>

        {/* Current Instruction */}
        {instructionText && (
          <text x="400" y="40" fill={activeColor} textAnchor="middle" className="font-mono text-lg font-bold">
            {instructionText}
          </text>
        )}

        {/* PC */}
        <rect x="50" y="200" width="30" height="100" rx="4" stroke={getStroke(true)} fill={getFill(true)} strokeWidth="2" />
        <text x="65" y="255" fill={textColor} textAnchor="middle" className="font-bold">PC</text>

        {/* Instruction Memory */}
        <rect x="120" y="150" width="80" height="200" rx="4" stroke={getStroke(true)} fill={getFill(true)} strokeWidth="2" />
        <text x="160" y="250" fill={textColor} textAnchor="middle" className="font-bold">Inst</text>
        <text x="160" y="265" fill={textColor} textAnchor="middle" className="font-bold">Memory</text>

        {/* Registers */}
        <rect x="300" y="150" width="80" height="200" rx="4" stroke={getStroke(regWrite || isRType || isLw || isSw || isBeq || isI)} fill={getFill(regWrite || isRType || isLw || isSw || isBeq || isI)} strokeWidth="2" />
        <text x="340" y="250" fill={textColor} textAnchor="middle" className="font-bold">Registers</text>

        {/* ALU */}
        <path d="M 480 180 L 520 210 L 520 290 L 480 320 L 480 270 L 490 250 L 480 230 Z" stroke={getStroke(isRType || isLw || isSw || isBeq || isI)} fill={getFill(isRType || isLw || isSw || isBeq || isI)} strokeWidth="2" />
        <text x="505" y="255" fill={textColor} textAnchor="middle" className="font-bold">ALU</text>

        {/* Data Memory */}
        <rect x="600" y="180" width="80" height="140" rx="4" stroke={getStroke(memRead || memWrite)} fill={getFill(memRead || memWrite)} strokeWidth="2" />
        <text x="640" y="245" fill={textColor} textAnchor="middle" className="font-bold">Data</text>
        <text x="640" y="260" fill={textColor} textAnchor="middle" className="font-bold">Memory</text>

        {/* Sign Extend */}
        <ellipse cx="340" cy="400" rx="30" ry="20" stroke={getStroke(isLw || isSw || isBeq || isI)} fill={getFill(isLw || isSw || isBeq || isI)} strokeWidth="2" />
        <text x="340" y="400" fill={textColor} textAnchor="middle">Sign</text>
        <text x="340" y="412" fill={textColor} textAnchor="middle">Extend</text>

        {/* Muxes */}
        {/* RegDst Mux */}
        <ellipse cx="260" cy="320" rx="10" ry="25" stroke={getStroke(regWrite)} fill={getFill(regWrite)} strokeWidth="2" />
        <text x="260" y="323" fill={textColor} textAnchor="middle" fontSize="8">M</text>
        
        {/* ALUSrc Mux */}
        <ellipse cx="440" cy="280" rx="10" ry="25" stroke={getStroke(isRType || isLw || isSw || isI)} fill={getFill(isRType || isLw || isSw || isI)} strokeWidth="2" />
        <text x="440" y="283" fill={textColor} textAnchor="middle" fontSize="8">M</text>

        {/* MemtoReg Mux */}
        <ellipse cx="730" cy="250" rx="10" ry="25" stroke={getStroke(regWrite)} fill={getFill(regWrite)} strokeWidth="2" />
        <text x="730" y="253" fill={textColor} textAnchor="middle" fontSize="8">M</text>

        {/* Paths */}
        {/* PC to Inst Mem */}
        <line x1="80" y1="250" x2="115" y2="250" stroke={getStroke(true)} strokeWidth="2" markerEnd={`url(#arrow-${true ? 'active' : 'inactive'})`} />
        
        {/* Inst Mem to Registers (rs, rt) */}
        <line x1="200" y1="180" x2="295" y2="180" stroke={getStroke(true)} strokeWidth="2" markerEnd={`url(#arrow-${true ? 'active' : 'inactive'})`} />
        <line x1="200" y1="220" x2="295" y2="220" stroke={getStroke(true)} strokeWidth="2" markerEnd={`url(#arrow-${true ? 'active' : 'inactive'})`} />
        
        {/* Inst Mem to Sign Extend */}
        <line x1="200" y1="280" x2="220" y2="280" stroke={getStroke(isLw || isSw || isBeq || isI)} strokeWidth="2" />
        <line x1="220" y1="280" x2="220" y2="400" stroke={getStroke(isLw || isSw || isBeq || isI)} strokeWidth="2" />
        <line x1="220" y1="400" x2="305" y2="400" stroke={getStroke(isLw || isSw || isBeq || isI)} strokeWidth="2" markerEnd={`url(#arrow-${isLw || isSw || isBeq || isI ? 'active' : 'inactive'})`} />

        {/* RegDst Mux Inputs */}
        <line x1="200" y1="260" x2="250" y2="260" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="250" y1="260" x2="250" y2="305" stroke={getStroke(regWrite)} strokeWidth="2" markerEnd={`url(#arrow-${regWrite ? 'active' : 'inactive'})`} />
        <line x1="200" y1="300" x2="230" y2="300" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="230" y1="300" x2="230" y2="335" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="230" y1="335" x2="250" y2="335" stroke={getStroke(regWrite)} strokeWidth="2" markerEnd={`url(#arrow-${regWrite ? 'active' : 'inactive'})`} />

        {/* RegDst Mux to Write Register */}
        <line x1="270" y1="320" x2="285" y2="320" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="285" y1="320" x2="285" y2="280" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="285" y1="280" x2="295" y2="280" stroke={getStroke(regWrite)} strokeWidth="2" markerEnd={`url(#arrow-${regWrite ? 'active' : 'inactive'})`} />

        {/* Registers to ALU (Read Data 1) */}
        <line x1="380" y1="180" x2="475" y2="180" stroke={getStroke(isRType || isLw || isSw || isBeq || isI)} strokeWidth="2" markerEnd={`url(#arrow-${isRType || isLw || isSw || isBeq || isI ? 'active' : 'inactive'})`} />

        {/* Registers to ALUSrc Mux (Read Data 2) */}
        <line x1="380" y1="220" x2="400" y2="220" stroke={getStroke(isRType || isSw || isBeq)} strokeWidth="2" />
        <line x1="400" y1="220" x2="400" y2="265" stroke={getStroke(isRType || isSw || isBeq)} strokeWidth="2" />
        <line x1="400" y1="265" x2="430" y2="265" stroke={getStroke(isRType || isSw || isBeq)} strokeWidth="2" markerEnd={`url(#arrow-${isRType || isSw || isBeq ? 'active' : 'inactive'})`} />

        {/* Sign Extend to ALUSrc Mux */}
        <line x1="370" y1="400" x2="410" y2="400" stroke={getStroke(isLw || isSw || isI)} strokeWidth="2" />
        <line x1="410" y1="400" x2="410" y2="295" stroke={getStroke(isLw || isSw || isI)} strokeWidth="2" />
        <line x1="410" y1="295" x2="430" y2="295" stroke={getStroke(isLw || isSw || isI)} strokeWidth="2" markerEnd={`url(#arrow-${isLw || isSw || isI ? 'active' : 'inactive'})`} />

        {/* ALUSrc Mux to ALU */}
        <line x1="450" y1="280" x2="475" y2="280" stroke={getStroke(isRType || isLw || isSw || isI)} strokeWidth="2" markerEnd={`url(#arrow-${isRType || isLw || isSw || isI ? 'active' : 'inactive'})`} />

        {/* ALU to Data Memory (Address) */}
        <line x1="520" y1="250" x2="595" y2="250" stroke={getStroke(isLw || isSw)} strokeWidth="2" markerEnd={`url(#arrow-${isLw || isSw ? 'active' : 'inactive'})`} />

        {/* ALU to MemtoReg Mux */}
        <line x1="540" y1="250" x2="540" y2="150" stroke={getStroke(isRType || isI)} strokeWidth="2" />
        <line x1="540" y1="150" x2="700" y2="150" stroke={getStroke(isRType || isI)} strokeWidth="2" />
        <line x1="700" y1="150" x2="700" y2="235" stroke={getStroke(isRType || isI)} strokeWidth="2" />
        <line x1="700" y1="235" x2="720" y2="235" stroke={getStroke(isRType || isI)} strokeWidth="2" markerEnd={`url(#arrow-${isRType || isI ? 'active' : 'inactive'})`} />

        {/* Registers to Data Memory (Write Data) */}
        <line x1="400" y1="220" x2="400" y2="350" stroke={getStroke(isSw)} strokeWidth="2" />
        <line x1="400" y1="350" x2="570" y2="350" stroke={getStroke(isSw)} strokeWidth="2" />
        <line x1="570" y1="350" x2="570" y2="280" stroke={getStroke(isSw)} strokeWidth="2" />
        <line x1="570" y1="280" x2="595" y2="280" stroke={getStroke(isSw)} strokeWidth="2" markerEnd={`url(#arrow-${isSw ? 'active' : 'inactive'})`} />

        {/* Data Memory to MemtoReg Mux */}
        <line x1="680" y1="250" x2="680" y2="265" stroke={getStroke(isLw)} strokeWidth="2" />
        <line x1="680" y1="265" x2="720" y2="265" stroke={getStroke(isLw)} strokeWidth="2" markerEnd={`url(#arrow-${isLw ? 'active' : 'inactive'})`} />

        {/* MemtoReg Mux to Registers (Write Data) */}
        <line x1="740" y1="250" x2="760" y2="250" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="760" y1="250" x2="760" y2="450" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="760" y1="450" x2="280" y2="450" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="280" y1="450" x2="280" y2="330" stroke={getStroke(regWrite)} strokeWidth="2" />
        <line x1="280" y1="330" x2="295" y2="330" stroke={getStroke(regWrite)} strokeWidth="2" markerEnd={`url(#arrow-${regWrite ? 'active' : 'inactive'})`} />

        {/* Control Unit (Simplified) */}
        <ellipse cx="260" cy="100" rx="40" ry="25" stroke={getStroke(true)} fill={getFill(true)} strokeWidth="2" />
        <text x="260" y="103" fill={textColor} textAnchor="middle" className="font-bold">Control</text>
        <line x1="200" y1="160" x2="200" y2="100" stroke={getStroke(true)} strokeWidth="2" />
        <line x1="200" y1="100" x2="220" y2="100" stroke={getStroke(true)} strokeWidth="2" markerEnd={`url(#arrow-${true ? 'active' : 'inactive'})`} />

        {/* Control Signals Text */}
        <text x="260" y="140" fill={getStroke(regDst)} fontSize="10" textAnchor="middle">RegDst</text>
        <text x="320" y="100" fill={getStroke(jump)} fontSize="10">Jump</text>
        <text x="320" y="115" fill={getStroke(branch)} fontSize="10">Branch</text>
        <text x="320" y="130" fill={getStroke(memRead)} fontSize="10">MemRead</text>
        <text x="320" y="145" fill={getStroke(memToReg)} fontSize="10">MemtoReg</text>
        <text x="320" y="160" fill={getStroke(true)} fontSize="10">ALUOp</text>
        <text x="320" y="175" fill={getStroke(memWrite)} fontSize="10">MemWrite</text>
        <text x="320" y="190" fill={getStroke(aluSrc)} fontSize="10">ALUSrc</text>
        <text x="320" y="205" fill={getStroke(regWrite)} fontSize="10">RegWrite</text>

      </svg>
    </div>
  );
}
