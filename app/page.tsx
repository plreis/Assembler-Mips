"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  StepForward,
  RotateCcw,
  Pause,
  Download,
  AlertCircle,
  Cpu,
  Database,
  Terminal,
  Code2,
  Upload,
  BookOpen,
  BookMarked,
} from "lucide-react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { assemble } from "@/lib/mips-assembler";
import { executeStep, ExecutionState } from "@/lib/mips-executor";
import { Datapath } from "@/components/Datapath";
import { ReferencePanel } from "@/components/ReferencePanel";
import {
  initialRegisters,
  Instruction,
  formatBinary,
  registerNames,
} from "@/lib/mips-core";

const EXAMPLES = [
  {
    name: "Hello World",
    code: `.data
mensagem: .asciiz "Ola, André!\\n"
numero: .word 123

.text
main:
  # Imprime a string
  la $a0, mensagem
  li $v0, 4
  syscall

  # Imprime um inteiro para teste
  lw $a0, numero
  li $v0, 1
  syscall

  # Sai do programa
  li $v0, 10
  syscall
`
  },
  {
    name: "Multiplicação com Somas",
    code: `.data
str_result: .asciiz "Resultado: "

.text
main:
  li $t0, 5      # Multiplicando
  li $t1, 4      # Multiplicador
  li $t2, 0      # Resultado

loop:
  beq $t1, $zero, end_loop
  add $t2, $t2, $t0
  addi $t1, $t1, -1
  j loop

end_loop:
  la $a0, str_result
  li $v0, 4
  syscall

  add $a0, $t2, $zero
  li $v0, 1
  syscall

  li $v0, 10
  syscall
`
  },
  {
    name: "Fatorial",
    code: `.data
str_result: .asciiz "Fatorial de 5: "

.text
main:
  li $t0, 5      # N = 5
  li $t1, 1      # Resultado = 1

loop:
  beq $t0, $zero, end_loop
  mult $t1, $t0
  mflo $t1
  addi $t0, $t0, -1
  j loop

end_loop:
  la $a0, str_result
  li $v0, 4
  syscall

  add $a0, $t1, $zero
  li $v0, 1
  syscall

  li $v0, 10
  syscall
`
  },
  {
    name: "Divisão",
    code: `.data
str_quo: .asciiz "Quociente: "
str_rem: .asciiz "\\nResto: "

.text
main:
  li $t0, 17     # Dividendo
  li $t1, 5      # Divisor
  
  div $t0, $t1   # 17 / 5
  mflo $t2       # Quociente (3)
  mfhi $t3       # Resto (2)

  # Imprime quociente
  la $a0, str_quo
  li $v0, 4
  syscall
  add $a0, $t2, $zero
  li $v0, 1
  syscall

  # Imprime resto
  la $a0, str_rem
  li $v0, 4
  syscall
  add $a0, $t3, $zero
  li $v0, 1
  syscall

  li $v0, 10
  syscall
`
  }
];

export default function MipsSimulator() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [activeTab, setActiveTab] = useState<"instructions" | "datapath" | "reference">("instructions");
  const [state, setState] = useState<ExecutionState>({
    registers: initialRegisters(),
    memory: {},
    pc: 0,
    output: [],
    status: "Idle",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const outputEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleEditorScroll = () => {
    if (gutterRef.current && editorRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const lineCount = code.split("\n").length;
  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  const handleStep = useCallback(() => {
    if (
      state.status === "Idle" ||
      state.status === "Error" ||
      state.status === "Finished"
    )
      return;
    const newState = executeStep(state, instructions);
    setState(newState);
    if (newState.error) {
      setErrorMsg(newState.error);
    }
  }, [state, instructions]);

  useEffect(() => {
    if (state.status === "Running") {
      const timer = setTimeout(() => {
        handleStep();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [state.status, handleStep]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.output]);

  const handleAssemble = () => {
    handleReset();
    const result = assemble(code);
    if (result.error) {
      setErrorMsg(result.error);
      setState((s) => ({ ...s, status: "Error" }));
    } else {
      setInstructions(result.instructions);
      setState((s) => ({
        ...s,
        memory: result.memory,
        status: "Ready",
        error: undefined,
      }));
      setErrorMsg(null);
    }
  };

  const handleRun = () => {
    if (state.status === "Ready" || state.status === "Paused") {
      setState((s) => ({ ...s, status: "Running" }));
    }
  };

  const handlePause = () => {
    if (state.status === "Running") {
      setState((s) => ({ ...s, status: "Paused" }));
    }
  };

  const handleReset = () => {
    setInstructions([]);
    setState({
      registers: initialRegisters(),
      memory: {},
      pc: 0,
      output: [],
      status: "Idle",
    });
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        handleReset();
      };
      reader.readAsText(file);
    }
  };

  const handleExampleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const example = EXAMPLES.find(ex => ex.name === e.target.value);
    if (example) {
      setCode(example.code);
      handleReset();
    }
  };

  const generateReport = () => {
    let report = "--- Relatório Final de Execução ---\n\n";
    report += "Status: " + state.status + "\n";
    report += "Instruções Executadas: " + state.pc + "\n\n";
    report += "--- Conteúdo dos Registradores ---\n";

    registerNames.forEach((name, i) => {
      report += `${name.padEnd(5)} (${String(i).padStart(2)}): ${state.registers[name] || 0}\n`;
    });

    report += "\n--- Conteúdo da Memória (Primeiros 100 bytes) ---\n";
    Object.keys(state.memory)
      .map(Number)
      .sort((a, b) => a - b)
      .slice(0, 100)
      .forEach((addr) => {
        report += `[0x${addr.toString(16).padStart(8, "0")}]: ${state.memory[addr]}\n`;
      });

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio_mips.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-300">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-semibold text-zinc-100">
            MIPS Simulator
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                state.status === "Running"
                  ? "bg-green-500/10 text-green-400"
                  : state.status === "Error"
                    ? "bg-red-500/10 text-red-400"
                    : state.status === "Finished"
                      ? "bg-blue-500/10 text-blue-400"
                      : state.status === "Ready"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {state.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">PC:</span>
            <span className="font-mono text-zinc-100">{state.pc}</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 overflow-x-auto">
        <button
          onClick={handleAssemble}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Code2 className="w-4 h-4" /> Montar
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-2" />
        <button
          onClick={handleStep}
          disabled={state.status !== "Ready" && state.status !== "Paused"}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <StepForward className="w-4 h-4" /> Passo
        </button>
        <button
          onClick={handleRun}
          disabled={state.status !== "Ready" && state.status !== "Paused"}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <Play className="w-4 h-4" /> Rodar
        </button>
        <button
          onClick={handlePause}
          disabled={state.status !== "Running"}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <Pause className="w-4 h-4" /> Pausar
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" /> Resetar
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-2" />
        <button
          onClick={generateReport}
          disabled={state.status !== "Finished" && state.status !== "Error"}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Relatório
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-2" />
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 cursor-pointer transition-colors whitespace-nowrap">
          <Upload className="w-4 h-4" /> Upload .s
          <input type="file" accept=".s,.txt" className="hidden" onChange={handleFileUpload} />
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <BookOpen className="w-4 h-4 text-zinc-500" />
          <select 
            onChange={handleExampleSelect} 
            className="bg-zinc-800 text-zinc-300 text-sm rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:border-blue-500"
          >
            {EXAMPLES.map(ex => (
              <option key={ex.name} value={ex.name}>{ex.name}</option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border-b border-red-500/20 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup orientation="horizontal">
          {/* Left Panel: Code & Output */}
          <Panel defaultSize={40} minSize={20} className="flex flex-col border-r border-zinc-800">
            <PanelGroup orientation="vertical">
              <Panel defaultSize={70} minSize={20} className="flex flex-col min-h-0">
                <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                  <Code2 className="w-4 h-4 mr-2 text-zinc-500" />
                  <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Editor
                  </h2>
                </div>
                <div className="flex flex-1 overflow-hidden bg-zinc-950">
                  <div 
                    ref={gutterRef}
                    className="w-12 flex flex-col items-end pr-2 py-4 font-mono text-sm text-zinc-600 bg-zinc-900/50 overflow-hidden select-none"
                  >
                    {lines.map(line => (
                      <div key={line} className="h-[21px] leading-[21px]">{line}</div>
                    ))}
                  </div>
                  <textarea
                    ref={editorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={handleEditorScroll}
                    className="flex-1 w-full p-4 font-mono text-sm bg-transparent text-zinc-300 resize-none focus:outline-none leading-[21px]"
                    spellCheck="false"
                  />
                </div>
              </Panel>
              
              <PanelResizeHandle className="h-1.5 bg-zinc-800 hover:bg-blue-500/50 transition-colors cursor-row-resize" />
              
              <Panel defaultSize={30} minSize={10} className="flex flex-col min-h-0">
                <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                  <Terminal className="w-4 h-4 mr-2 text-zinc-500" />
                  <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Output
                  </h2>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-zinc-950">
                  {state.output.map((line, i) => (
                    <div key={i} className="text-zinc-300 whitespace-pre-wrap">
                      {line}
                    </div>
                  ))}
                  <div ref={outputEndRef} />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-zinc-800 hover:bg-blue-500/50 transition-colors cursor-col-resize" />

          {/* Right Panel: Instructions/Datapath, Registers, Memory */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col">
            <PanelGroup orientation="vertical">
              {/* Top Right: Tabs */}
              <Panel defaultSize={50} minSize={20} className="flex flex-col min-h-0">
                <div className="flex items-center px-4 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("instructions")}
                    className={`flex items-center px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors whitespace-nowrap ${activeTab === "instructions" ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <Cpu className="w-4 h-4 mr-2" />
                    Instruções
                  </button>
                  <button
                    onClick={() => setActiveTab("datapath")}
                    className={`flex items-center px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors whitespace-nowrap ${activeTab === "datapath" ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Caminho de Dados
                  </button>
                  <button
                    onClick={() => setActiveTab("reference")}
                    className={`flex items-center px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors whitespace-nowrap ${activeTab === "reference" ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <BookMarked className="w-4 h-4 mr-2" />
                    Referência MIPS
                  </button>
                </div>
                
                {activeTab === "instructions" ? (
                  <div className="flex-1 overflow-y-auto bg-zinc-950 p-2">
                    {instructions.length === 0 ? (
                      <div className="text-zinc-600 text-sm p-2">
                        Nenhuma instrução montada.
                      </div>
                    ) : (
                      <table className="w-full text-left text-sm font-mono border-collapse">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800">
                            <th className="pb-2 font-normal w-8 text-center">PC</th>
                            <th className="pb-2 font-normal">Instrução</th>
                            <th className="pb-2 font-normal">Binário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {instructions.map((instr, index) => (
                            <tr
                              key={index}
                              className={`border-b border-zinc-800/50 ${index === state.pc ? "bg-blue-500/20 text-blue-300" : "text-zinc-400"}`}
                            >
                              <td className="py-1.5 text-center text-zinc-600">
                                {index}
                              </td>
                              <td className="py-1.5">{instr.text}</td>
                              <td className="py-1.5 text-xs opacity-70">
                                {formatBinary(instr.binary, instr.mnemonic)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : activeTab === "datapath" ? (
                  <div className="flex-1 overflow-hidden bg-zinc-950">
                    <Datapath 
                      mnemonic={instructions[state.pc]?.mnemonic} 
                      instructionText={instructions[state.pc]?.text}
                    />
                  </div>
                ) : (
                  <ReferencePanel />
                )}
              </Panel>

              <PanelResizeHandle className="h-1.5 bg-zinc-800 hover:bg-blue-500/50 transition-colors cursor-row-resize" />

              {/* Registers & Memory */}
              <Panel defaultSize={50} minSize={20} className="flex min-h-0">
                <PanelGroup orientation="horizontal">
                  {/* Registers */}
                  <Panel defaultSize={50} minSize={20} className="flex flex-col border-r border-zinc-800 min-h-0">
                    <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                      <Database className="w-4 h-4 mr-2 text-zinc-500" />
                      <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                        Registradores
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-zinc-950 p-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                        {registerNames.map((name, i) => (
                          <div
                            key={name}
                            className="flex justify-between py-1 border-b border-zinc-800/50"
                          >
                            <span className="text-zinc-500">
                              {name}{" "}
                              <span className="text-zinc-700 text-xs">({i})</span>
                            </span>
                            <span className="text-zinc-300">
                              {state.registers[name] || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Panel>

                  <PanelResizeHandle className="w-1.5 bg-zinc-800 hover:bg-blue-500/50 transition-colors cursor-col-resize" />

                  {/* Memory */}
                  <Panel defaultSize={50} minSize={20} className="flex flex-col min-h-0">
                    <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                      <Database className="w-4 h-4 mr-2 text-zinc-500" />
                      <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                        Memória (Data)
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-zinc-950 p-2">
                      <table className="w-full text-left text-sm font-mono border-collapse">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800">
                            <th className="pb-2 font-normal">Endereço</th>
                            <th className="pb-2 font-normal text-right">
                              Valor (Byte)
                            </th>
                            <th className="pb-2 font-normal text-right">Char</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(state.memory).length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-2 text-zinc-600">
                                Memória vazia.
                              </td>
                            </tr>
                          ) : (
                            Object.keys(state.memory)
                              .map(Number)
                              .sort((a, b) => a - b)
                              .map((addr) => {
                                const val = state.memory[addr];
                                const char =
                                  val >= 32 && val <= 126
                                    ? String.fromCharCode(val)
                                    : ".";
                                return (
                                  <tr
                                    key={addr}
                                    className="border-b border-zinc-800/50 text-zinc-400"
                                  >
                                    <td className="py-1">
                                      0x{addr.toString(16).padStart(8, "0")}
                                    </td>
                                    <td className="py-1 text-right">{val}</td>
                                    <td className="py-1 text-right text-zinc-500">
                                      {char}
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
