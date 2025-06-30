import { useState, useEffect } from 'react';

// Mapa de registradores para seus números e nomes
const registerMap = {
  $zero: 0, $at: 1, $v0: 2, $v1: 3, $a0: 4, $a1: 5, $a2: 6, $a3: 7,
  $t0: 8, $t1: 9, $t2: 10, $t3: 11, $t4: 12, $t5: 13, $t6: 14, $t7: 15,
  $s0: 16, $s1: 17, $s2: 18, $s3: 19, $s4: 20, $s5: 21, $s6: 22, $s7: 23,
  $t8: 24, $t9: 25, $k0: 26, $k1: 27, $gp: 28, $sp: 29, $fp: 30, $ra: 31,
};
const registerNames = Object.keys(registerMap);

// Função auxiliar para conversão para binário com preenchimento
function toBinary(num, length) {
  let bin = (num >>> 0).toString(2);
  while (bin.length < length) {
    bin = "0" + bin;
  }
  return bin.slice(-length);
}

// --- FORMATAR O BINÁRIO DE ACORDO COM O FORMATO MIPS ---
const R_TYPE_MNEMONICS = ['add', 'sub', 'mult', 'and', 'or', 'sll', 'slt', 'syscall'];
const I_TYPE_MNEMONICS = ['addi', 'slti', 'lw', 'sw', 'lui'];

function formatBinary(binary, mnemonic) {
  if (binary.length !== 32) return binary; // Retorna se não for uma instrução completa

  // Formato R: op(6) rs(5) rt(5) rd(5) shamt(5) funct(6)
  if (R_TYPE_MNEMONICS.includes(mnemonic)) {
    const op = binary.slice(0, 6);
    const rs = binary.slice(6, 11);
    const rt = binary.slice(11, 16);
    const rd = binary.slice(16, 21);
    const shamt = binary.slice(21, 26);
    const funct = binary.slice(26, 32);
    return `${op} ${rs} ${rt} ${rd} ${shamt} ${funct}`;
  }
  
  // Formato I: op(6) rs(5) rt(5) immediate(16)
  if (I_TYPE_MNEMONICS.includes(mnemonic)) {
    const op = binary.slice(0, 6);
    const rs = binary.slice(6, 11);
    const rt = binary.slice(11, 16);
    const imm = binary.slice(16, 32);
    return `${op} ${rs} ${rt} ${imm}`;
  }

  // Caso não encontre um formato (não deve acontecer), retorna o binário sem formatação.
  return binary;
}


// Estado inicial dos registradores
const initialRegisters = () => {
  const regs = {};
  registerNames.forEach(name => {
    regs[name] = 0;
  });
  regs['$sp'] = 4096; // Stack Pointer
  return regs;
};

export const HomePage = () => {
  const [assemblyCode, setAssemblyCode] = useState(
    `# Exemplo de Código MIPS\n# Calcula 5 + 10 e armazena em $t2\n\n  addi $t0, $zero, 5\n  addi $t1, $zero, 10\n  add $t2, $t0, $t1\n\n# Imprime o resultado (15)\n  li $v0, 1\n  move $a0, $t2\n  syscall \n\n# Sai do programa\n  li $v0, 10\n  syscall`
  );
  const [instructions, setInstructions] = useState([]);
  const [registers, setRegisters] = useState(initialRegisters());
  const [memory, setMemory] = useState({});
  const [pc, setPc] = useState(0);
  const [output, setOutput] = useState([]);
  const [status, setStatus] = useState('Parado');

  // Lógica para executar automaticamente
  useEffect(() => {
    if (status === 'Rodando') {
      const timer = setTimeout(() => {
        handleStep();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [status, pc]);

  // --- ASSEMBLER ---
  const assemble = (code) => {
    handleReset();
    const lines = code.split('\n').map(line => line.trim());
    const assembledInstructions = [];

    lines.forEach((line, index) => {
      if (!line || line.startsWith('#')) return;

      let processedLine = line;
      if (line.startsWith('li')) {
        const [_, rt, imm] = line.replace(/,/g, ' ').split(/\s+/);
        processedLine = `addi ${rt}, $zero, ${imm}`;
      } else if (line.startsWith('move')) {
        const [_, rd, rs] = line.replace(/,/g, ' ').split(/\s+/);
        processedLine = `add ${rd}, ${rs}, $zero`;
      }
      
      const tokens = processedLine.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
      const mnemonic = tokens[0];
      const args = tokens.slice(1);

      let binary = '';
      try {
        binary = generateBinary(mnemonic, args);
        assembledInstructions.push({
          text: line,
          binary: binary,
          mnemonic: mnemonic,
          args: args,
        });
      } catch (e) {
        alert(`Erro na linha ${index + 1}: ${e.message}\n${line}`);
        setStatus('Erro');
        return;
      }
    });

    setInstructions(assembledInstructions);
    setStatus('Pronto');
  };

  const generateBinary = (mnemonic, args) => {
    const opcodeMap = {
      'add': '000000', 'sub': '000000', 'mult': '000000', 'and': '000000', 'or': '000000', 'sll': '000000', 'slt': '000000', 'syscall': '000000',
      'addi': '001000', 'lw': '100011', 'sw': '101011', 'lui': '001111', 'slti': '001010'
    };
    const functMap = {
      'add': '100000', 'sub': '100010', 'mult': '011000', 'and': '100100', 'or': '100101', 'sll': '000000', 'slt': '101010', 'syscall': '001100'
    };

    const opcode = opcodeMap[mnemonic];
    if (opcode === undefined) throw new Error(`Instrução '${mnemonic}' não suportada.`);

    if (opcode === '000000') {
      const funct = functMap[mnemonic];
      let rd = '00000', rs = '00000', rt = '00000', shamt = '00000';
      if (['add', 'sub', 'and', 'or', 'slt'].includes(mnemonic)) {
        rd = toBinary(registerMap[args[0]], 5);
        rs = toBinary(registerMap[args[1]], 5);
        rt = toBinary(registerMap[args[2]], 5);
      } else if (['mult'].includes(mnemonic)) {
        rs = toBinary(registerMap[args[0]], 5);
        rt = toBinary(registerMap[args[1]], 5);
      } else if (['sll'].includes(mnemonic)) {
        rd = toBinary(registerMap[args[0]], 5);
        rt = toBinary(registerMap[args[1]], 5);
        shamt = toBinary(parseInt(args[2]), 5);
      }
      return `${opcode}${rs}${rt}${rd}${shamt}${funct}`;
    }

    if (['addi', 'slti'].includes(mnemonic)) {
      const rt = toBinary(registerMap[args[0]], 5);
      const rs = toBinary(registerMap[args[1]], 5);
      const imm = toBinary(parseInt(args[2]), 16);
      return `${opcode}${rs}${rt}${imm}`;
    }
    if (['lw', 'sw'].includes(mnemonic)) {
      const rt = toBinary(registerMap[args[0]], 5);
      const match = args[1].match(/(-?\d+)\((\$\w+)\)/);
      if (!match) throw new Error('Formato inválido para lw/sw. Use: offset($rs)');
      const imm = toBinary(parseInt(match[1]), 16);
      const rs = toBinary(registerMap[match[2]], 5);
      return `${opcode}${rs}${rt}${imm}`;
    }
    if (mnemonic === 'lui') {
      const rt = toBinary(registerMap[args[0]], 5);
      const rs = '00000';
      const imm = toBinary(parseInt(args[1]), 16);
      return `${opcode}${rs}${rt}${imm}`;
    }

    throw new Error('Erro de lógica no assembler.');
  };

  // --- EXECUTOR ---
  const handleStep = () => {
    if (pc >= instructions.length) {
      setStatus('Finalizado');
      return;
    }

    const instr = instructions[pc];
    const newRegs = { ...registers };
    const newMem = { ...memory };
    const newOut = [...output];
    let nextPc = pc + 1;

    try {
      const { mnemonic, args } = instr;
      const getReg = (regName) => newRegs[regName];
      const setReg = (regName, value) => { if (regName !== '$zero') newRegs[regName] = value | 0; };

      switch (mnemonic) {
        case 'add': setReg(args[0], getReg(args[1]) + getReg(args[2])); break;
        case 'addi': setReg(args[0], getReg(args[1]) + parseInt(args[2])); break;
        case 'sub': setReg(args[0], getReg(args[1]) - getReg(args[2])); break;
        case 'mult': {
          const result = BigInt(getReg(args[0])) * BigInt(getReg(args[1]));
          newOut.push(`[MULT: ${args[0]} * ${args[1]} = ${result}. Resultado em HI/LO não simulado]`);
          break;
        }
        case 'and': setReg(args[0], getReg(args[1]) & getReg(args[2])); break;
        case 'or': setReg(args[0], getReg(args[1]) | getReg(args[2])); break;
        case 'sll': setReg(args[0], getReg(args[1]) << parseInt(args[2])); break;
        case 'slt': setReg(args[0], getReg(args[1]) < getReg(args[2]) ? 1 : 0); break;
        case 'slti': setReg(args[0], getReg(args[1]) < parseInt(args[2]) ? 1 : 0); break;
        case 'lui': setReg(args[0], parseInt(args[1]) << 16); break;
        case 'lw': {
          const match = args[1].match(/(-?\d+)\((\$\w+)\)/);
          const addr = getReg(match[2]) + parseInt(match[1]);
          setReg(args[0], newMem[addr] || 0);
          break;
        }
        case 'sw': {
          const match = args[1].match(/(-?\d+)\((\$\w+)\)/);
          const addr = getReg(match[2]) + parseInt(match[1]);
          newMem[addr] = getReg(args[0]);
          break;
        }
        case 'syscall': {
          const service = getReg('$v0');
          if (service === 1) { newOut.push(getReg('$a0').toString()); }
          else if (service === 4) { newOut.push("[Syscall 4: Imprimir String não implementado]"); }
          else if (service === 10) { nextPc = instructions.length; setStatus('Finalizado'); }
          break;
        }
        default: throw new Error(`Execução da instrução '${mnemonic}' não implementada.`);
      }
    } catch (e) {
      alert(`Erro de execução na linha ${pc + 1}: ${e.message}`);
      setStatus('Erro');
      return;
    }

    setRegisters(newRegs);
    setMemory(newMem);
    setOutput(newOut);
    setPc(nextPc);

    if (nextPc >= instructions.length) {
      setStatus('Finalizado');
    }
  };

  const handleRun = () => { if (status === 'Pronto' || status === 'Pausado') setStatus('Rodando'); };
  const handlePause = () => { if (status === 'Rodando') setStatus('Pausado'); };
  const handleReset = () => {
    setInstructions([]);
    setRegisters(initialRegisters());
    setMemory({});
    setPc(0);
    setOutput([]);
    setStatus('Parado');
  };

  const generateReport = () => {
    let report = "--- Relatório Final de Execução ---\n\n";
    report += "Status: " + status + "\n";
    report += "Instruções Executadas: " + pc + "\n\n";
    report += "--- Conteúdo dos Registradores ---\n";
    for (let i = 0; i < 32; i++) {
        const regName = registerNames.find(name => registerMap[name] === i);
        if (regName) {
            report += `${regName.padEnd(5)} (${String(i).padStart(2)}): ${registers[regName]}\n`;
        }
    }
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_mips.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="simulator-container">
      <div className="main-panel">
        <h1>Simulador MIPS</h1>
        <div className="code-editor">
          <label>Código Assembly MIPS</label>
          <textarea
            value={assemblyCode}
            onChange={(e) => setAssemblyCode(e.target.value)}
            rows="15"
            spellCheck="false"
          />
        </div>

        <div className="controls">
          <button onClick={() => assemble(assemblyCode)}>1. Montar</button>
          <button onClick={handleStep} disabled={status !== 'Pronto' && status !== 'Pausado'}>2. Passo a Passo</button>
          <button onClick={handleRun} disabled={status !== 'Pronto' && status !== 'Pausado'}>3. Rodar Tudo</button>
          <button onClick={handlePause} disabled={status !== 'Rodando'}>Pausar</button>
          <button onClick={handleReset}>Resetar</button>
          <button onClick={generateReport} disabled={status !== 'Finalizado' && status !== 'Erro'}>Gerar Relatório</button>
        </div>
        <div className="status-bar">
          Status: <span>{status}</span> | PC: <span>{pc}</span>
        </div>

        <div className="output-console">
          <label>Saída do Programa (via Syscall)</label>
          <pre>{output.join('\n')}</pre>
        </div>
      </div>

      <div className="side-panel">
        <div className="instruction-view">
          <h2>Instruções Montadas</h2>
          <ul>
            {instructions.map((instr, index) => (
              <li key={index} className={index === pc ? 'current-instruction' : ''}>
                <span className="instr-text">{instr.text}</span>
                {/* --- LINHA ATUALIZADA NO JSX PARA USAR A NOVA FUNÇÃO DE FORMATAÇÃO --- */}
                <span className="instr-binary">{formatBinary(instr.binary, instr.mnemonic)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="register-view">
          <h2>Registradores</h2>
          <table>
            <tbody>
              {Object.entries(registers).map(([name, value]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};