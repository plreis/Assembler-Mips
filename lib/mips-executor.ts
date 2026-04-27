import { Instruction, readWord, writeWord } from "./mips-core";

export interface ExecutionState {
  registers: Record<string, number>;
  memory: Record<number, number>;
  pc: number;
  output: string[];
  status: "Idle" | "Ready" | "Running" | "Paused" | "Finished" | "Error";
  error?: string;
}

export function executeStep(
  state: ExecutionState,
  instructions: Instruction[],
): ExecutionState {
  if (state.pc < 0 || state.pc >= instructions.length) {
    return { ...state, status: "Finished" };
  }

  const instr = instructions[state.pc];
  const newRegs = { ...state.registers };
  const newMem = { ...state.memory };
  const newOut = [...state.output];
  let nextPc = state.pc + 1;

  const getReg = (regName: string) => newRegs[regName] || 0;
  const setReg = (regName: string, value: number) => {
    if (regName !== "$zero" && regName !== "$0") {
      newRegs[regName] = value | 0; // Force 32-bit integer
    }
  };

  try {
    const { mnemonic, args } = instr;

    switch (mnemonic) {
      case "add":
        setReg(args[0], getReg(args[1]) + getReg(args[2]));
        break;
      case "addi":
        setReg(args[0], getReg(args[1]) + parseInt(args[2]));
        break;
      case "sub":
        setReg(args[0], getReg(args[1]) - getReg(args[2]));
        break;
      case "mult": {
        const result = BigInt(getReg(args[0])) * BigInt(getReg(args[1]));
        newRegs["LO"] = Number(result & BigInt(0xffffffff)) | 0;
        newRegs["HI"] = Number((result >> BigInt(32)) & BigInt(0xffffffff)) | 0;
        break;
      }
      case "div": {
        const rs = getReg(args[0]);
        const rt = getReg(args[1]);
        if (rt !== 0) {
          newRegs["LO"] = Math.trunc(rs / rt) | 0;
          newRegs["HI"] = (rs % rt) | 0;
        }
        break;
      }
      case "mflo":
        setReg(args[0], newRegs["LO"] || 0);
        break;
      case "mfhi":
        setReg(args[0], newRegs["HI"] || 0);
        break;
      case "and":
        setReg(args[0], getReg(args[1]) & getReg(args[2]));
        break;
      case "or":
        setReg(args[0], getReg(args[1]) | getReg(args[2]));
        break;
      case "ori":
        setReg(args[0], getReg(args[1]) | parseInt(args[2]));
        break;
      case "sll":
        setReg(args[0], getReg(args[1]) << parseInt(args[2]));
        break;
      case "slt":
        setReg(args[0], getReg(args[1]) < getReg(args[2]) ? 1 : 0);
        break;
      case "slti":
        setReg(args[0], getReg(args[1]) < parseInt(args[2]) ? 1 : 0);
        break;
      case "lui":
        setReg(args[0], parseInt(args[1]) << 16);
        break;
      case "lw": {
        const match = args[1].match(/(-?\d+)\((\$\w+)\)/);
        if (match) {
          const addr = getReg(match[2]) + parseInt(match[1]);
          setReg(args[0], readWord(newMem, addr));
        }
        break;
      }
      case "sw": {
        const match = args[1].match(/(-?\d+)\((\$\w+)\)/);
        if (match) {
          const addr = getReg(match[2]) + parseInt(match[1]);
          writeWord(newMem, addr, getReg(args[0]));
        }
        break;
      }
      case "beq": {
        if (getReg(args[0]) === getReg(args[1])) {
          nextPc += parseInt(args[2]);
        }
        break;
      }
      case "bne": {
        if (getReg(args[0]) !== getReg(args[1])) {
          nextPc += parseInt(args[2]);
        }
        break;
      }
      case "j": {
        // Absolute jump (simplified for simulator: just jump to instruction index)
        // The assembler stored the target instruction index in args[0] (address / 4)
        // Actually, we need to map address to instruction index.
        // Let's assume instructions are contiguous starting at 0x00400000
        const targetAddress = parseInt(args[0]) * 4;
        const targetIndex = instructions.findIndex(
          (i) => i.address === targetAddress,
        );
        if (targetIndex !== -1) {
          nextPc = targetIndex;
        } else {
          throw new Error(
            `Jump target address 0x${targetAddress.toString(16)} not found`,
          );
        }
        break;
      }
      case "jal": {
        setReg("$ra", instr.address + 4);
        const targetAddress = parseInt(args[0]) * 4;
        const targetIndex = instructions.findIndex(
          (i) => i.address === targetAddress,
        );
        if (targetIndex !== -1) {
          nextPc = targetIndex;
        } else {
          throw new Error(
            `Jump target address 0x${targetAddress.toString(16)} not found`,
          );
        }
        break;
      }
      case "jr": {
        const targetAddress = getReg(args[0]);
        const targetIndex = instructions.findIndex(
          (i) => i.address === targetAddress,
        );
        if (targetIndex !== -1) {
          nextPc = targetIndex;
        } else {
          throw new Error(
            `Jump register target address 0x${targetAddress.toString(16)} not found`,
          );
        }
        break;
      }
      case "syscall": {
        const service = getReg("$v0");
        if (service === 1) {
          // Print Integer
          newOut.push(getReg("$a0").toString());
        } else if (service === 4) {
          // Print String
          let str = "";
          let addr = getReg("$a0");
          let charCode = newMem[addr];
          while (charCode !== 0 && charCode !== undefined) {
            str += String.fromCharCode(charCode);
            addr++;
            charCode = newMem[addr];
          }
          newOut.push(str);
        } else if (service === 10) {
          // Exit
          nextPc = instructions.length;
          return {
            ...state,
            registers: newRegs,
            memory: newMem,
            output: newOut,
            pc: nextPc,
            status: "Finished",
          };
        } else {
          newOut.push(`[Syscall ${service} not implemented]`);
        }
        break;
      }
      default:
        throw new Error(`Execution of '${mnemonic}' not implemented.`);
    }
  } catch (e: any) {
    return {
      ...state,
      status: "Error",
      error: `Runtime error at line ${instr.originalLine}: ${e.message}`,
    };
  }

  return {
    ...state,
    registers: newRegs,
    memory: newMem,
    output: newOut,
    pc: nextPc,
    status: nextPc >= instructions.length ? "Finished" : state.status,
  };
}
