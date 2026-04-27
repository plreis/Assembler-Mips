import React from 'react';
import { BookOpen, Cpu, List, Terminal } from 'lucide-react';

export function ReferencePanel() {
  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 text-zinc-300 text-sm space-y-8">
      
      <section>
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          Formatos de Instrução MIPS
        </h3>
        <p className="mb-4 text-zinc-400">
          A arquitetura MIPS possui 3 formatos principais de instrução, todos com 32 bits de tamanho.
        </p>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-zinc-200 mb-2">Tipo R (Register)</h4>
            <div className="flex text-center text-xs font-mono border border-zinc-700 rounded overflow-hidden">
              <div className="w-1/6 bg-zinc-800 p-2 border-r border-zinc-700">opcode<br/><span className="text-zinc-500">6 bits</span></div>
              <div className="w-1/6 bg-zinc-900 p-2 border-r border-zinc-700">rs<br/><span className="text-zinc-500">5 bits</span></div>
              <div className="w-1/6 bg-zinc-800 p-2 border-r border-zinc-700">rt<br/><span className="text-zinc-500">5 bits</span></div>
              <div className="w-1/6 bg-zinc-900 p-2 border-r border-zinc-700">rd<br/><span className="text-zinc-500">5 bits</span></div>
              <div className="w-1/6 bg-zinc-800 p-2 border-r border-zinc-700">shamt<br/><span className="text-zinc-500">5 bits</span></div>
              <div className="w-1/6 bg-zinc-900 p-2">funct<br/><span className="text-zinc-500">6 bits</span></div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Ex: add, sub, and, or, slt</p>
          </div>

          <div>
            <h4 className="font-medium text-zinc-200 mb-2">Tipo I (Immediate)</h4>
            <div className="flex text-center text-xs font-mono border border-zinc-700 rounded overflow-hidden">
              <div className="w-1/6 bg-zinc-800 p-2 border-r border-zinc-700">opcode<br/><span className="text-zinc-500">6 bits</span></div>
              <div className="w-1/6 bg-zinc-900 p-2 border-r border-zinc-700">rs<br/><span className="text-zinc-500">5 bits</span></div>
              <div className="w-1/6 bg-zinc-800 p-2 border-r border-zinc-700">rt<br/><span className="text-zinc-500">5 bits</span></div>
              <div className="w-3/6 bg-zinc-900 p-2">immediate<br/><span className="text-zinc-500">16 bits</span></div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Ex: addi, lw, sw, beq, bne</p>
          </div>

          <div>
            <h4 className="font-medium text-zinc-200 mb-2">Tipo J (Jump)</h4>
            <div className="flex text-center text-xs font-mono border border-zinc-700 rounded overflow-hidden">
              <div className="w-1/6 bg-zinc-800 p-2 border-r border-zinc-700">opcode<br/><span className="text-zinc-500">6 bits</span></div>
              <div className="w-5/6 bg-zinc-900 p-2">address<br/><span className="text-zinc-500">26 bits</span></div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Ex: j, jal</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
          <List className="w-5 h-5 text-green-400" />
          Convenção de Registradores
        </h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">Número</th>
              <th className="pb-2 font-medium">Uso</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300 font-mono text-xs">
            <tr className="border-b border-zinc-800/50"><td className="py-2">$zero</td><td>0</td><td>Constante 0 (não pode ser alterado)</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$at</td><td>1</td><td>Assembler Temporary (reservado)</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$v0-$v1</td><td>2-3</td><td>Valores de retorno de funções / Syscalls</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$a0-$a3</td><td>4-7</td><td>Argumentos de funções</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$t0-$t7</td><td>8-15</td><td>Temporários (não preservados em chamadas)</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$s0-$s7</td><td>16-23</td><td>Salvos (preservados em chamadas)</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$t8-$t9</td><td>24-25</td><td>Mais temporários</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$k0-$k1</td><td>26-27</td><td>Reservados para o Kernel (SO)</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$gp</td><td>28</td><td>Global Pointer</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$sp</td><td>29</td><td>Stack Pointer (topo da pilha)</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">$fp</td><td>30</td><td>Frame Pointer</td></tr>
            <tr><td className="py-2">$ra</td><td>31</td><td>Return Address (endereço de retorno)</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
          <Terminal className="w-5 h-5 text-yellow-400" />
          System Calls (syscall)
        </h3>
        <p className="mb-4 text-zinc-400">
          Carregue o código do serviço em <code className="text-blue-300">$v0</code> e os argumentos em <code className="text-blue-300">$a0-$a3</code>.
        </p>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="pb-2 font-medium">Serviço</th>
              <th className="pb-2 font-medium">$v0</th>
              <th className="pb-2 font-medium">Argumentos</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300 font-mono text-xs">
            <tr className="border-b border-zinc-800/50"><td className="py-2">Print Integer</td><td>1</td><td>$a0 = inteiro a imprimir</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">Print String</td><td>4</td><td>$a0 = endereço da string</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">Read Integer</td><td>5</td><td>Retorna inteiro em $v0</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">Read String</td><td>8</td><td>$a0 = buffer, $a1 = tamanho</td></tr>
            <tr className="border-b border-zinc-800/50"><td className="py-2">Sbrk (Alocar memória)</td><td>9</td><td>$a0 = bytes a alocar. Retorna end. em $v0</td></tr>
            <tr><td className="py-2">Exit</td><td>10</td><td>Encerra o programa</td></tr>
          </tbody>
        </table>
      </section>

    </div>
  );
}
