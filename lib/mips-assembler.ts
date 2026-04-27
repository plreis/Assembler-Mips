import {
  registerMap,
  toBinary,
  writeWord,
  Instruction,
  AssembleResult,
} from "./mips-core";

export function assemble(code: string): AssembleResult {
  const dataSection: { line: string; lineNum: number }[] = [];
  const textSection: { line: string; lineNum: number }[] = [];
  const labels: Record<string, number> = {};
  const memory: Record<number, number> = {};
  let currentSection = "text";

  const lines = code.split("\n");

  lines.forEach((line, index) => {
    let inString = false;
    let cleanLine = "";
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inString = !inString;
      if (line[i] === "#" && !inString) break;
      cleanLine += line[i];
    }
    cleanLine = cleanLine.trim();
    if (!cleanLine) return;

    if (cleanLine === ".data") {
      currentSection = "data";
      return;
    }
    if (cleanLine === ".text") {
      currentSection = "text";
      return;
    }

    if (currentSection === "data")
      dataSection.push({ line: cleanLine, lineNum: index + 1 });
    else textSection.push({ line: cleanLine, lineNum: index + 1 });
  });

  let dataMemoryPointer = 0x10010000;
  for (const { line, lineNum } of dataSection) {
    let processLine = line;
    const colonIndex = processLine.indexOf(":");

    if (colonIndex !== -1) {
      const firstQuote = processLine.indexOf('"');
      if (firstQuote === -1 || colonIndex < firstQuote) {
        const label = processLine.slice(0, colonIndex).trim();
        labels[label] = dataMemoryPointer;
        processLine = processLine.slice(colonIndex + 1).trim();
      }
    }

    if (!processLine) continue;

    if (processLine.startsWith(".asciiz")) {
      const strMatch = processLine.match(/\.asciiz\s+"(.*)"/);
      if (strMatch) {
        const str = strMatch[1];
        for (let i = 0; i < str.length; i++) {
          let charCode = str.charCodeAt(i);
          if (str[i] === "\\" && i + 1 < str.length) {
            if (str[i + 1] === "n") {
              charCode = 10;
              i++;
            } else if (str[i + 1] === "t") {
              charCode = 9;
              i++;
            } else if (str[i + 1] === '"') {
              charCode = 34;
              i++;
            } else if (str[i + 1] === "\\") {
              charCode = 92;
              i++;
            }
          }
          memory[dataMemoryPointer++] = charCode;
        }
        memory[dataMemoryPointer++] = 0;
      } else {
        return {
          instructions: [],
          memory: {},
          labels: {},
          error: `Line ${lineNum}: Invalid .asciiz format`,
        };
      }
    } else if (processLine.startsWith(".word")) {
      const argsStr = processLine.replace(".word", "").trim();
      const args = argsStr.split(",").map((s) => s.trim());
      for (const arg of args) {
        const val = parseInt(arg);
        if (isNaN(val))
          return {
            instructions: [],
            memory: {},
            labels: {},
            error: `Line ${lineNum}: Invalid .word value '${arg}'`,
          };
        writeWord(memory, dataMemoryPointer, val);
        dataMemoryPointer += 4;
      }
    }
  }

  let textMemoryPointer = 0x00400000;
  const expandedText: { line: string; lineNum: number; address: number }[] = [];

  for (const { line, lineNum } of textSection) {
    let processLine = line;
    const colonIndex = processLine.indexOf(":");

    if (colonIndex !== -1) {
      const label = processLine.slice(0, colonIndex).trim();
      labels[label] = textMemoryPointer;
      processLine = processLine.slice(colonIndex + 1).trim();
    }

    if (!processLine) continue;

    if (processLine.startsWith("la ")) {
      const argsStr = processLine.replace("la", "").trim();
      const [rt, label] = argsStr.split(",").map((s) => s.trim());
      expandedText.push({
        line: `lui ${rt}, %hi(${label})`,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
      expandedText.push({
        line: `ori ${rt}, ${rt}, %lo(${label})`,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
    } else if (processLine.startsWith("li ")) {
      const argsStr = processLine.replace("li", "").trim();
      const [rt, imm] = argsStr.split(",").map((s) => s.trim());
      const val = parseInt(imm);
      if (val > 65535 || val < -32768) {
        expandedText.push({
          line: `lui ${rt}, ${val >>> 16}`,
          lineNum,
          address: textMemoryPointer,
        });
        textMemoryPointer += 4;
        expandedText.push({
          line: `ori ${rt}, ${rt}, ${val & 0xffff}`,
          lineNum,
          address: textMemoryPointer,
        });
        textMemoryPointer += 4;
      } else {
        expandedText.push({
          line: `addi ${rt}, $zero, ${imm}`,
          lineNum,
          address: textMemoryPointer,
        });
        textMemoryPointer += 4;
      }
    } else if (processLine.startsWith("move ")) {
      const argsStr = processLine.replace("move", "").trim();
      const [rd, rs] = argsStr.split(",").map((s) => s.trim());
      expandedText.push({
        line: `add ${rd}, ${rs}, $zero`,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
    } else if (processLine.startsWith("lw ") && !processLine.includes("(")) {
      const argsStr = processLine.replace("lw", "").trim();
      const [rt, label] = argsStr.split(",").map((s) => s.trim());
      expandedText.push({
        line: `lui $at, %hi(${label})`,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
      expandedText.push({
        line: `lw ${rt}, %lo(${label})($at)`,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
    } else if (processLine.startsWith("sw ") && !processLine.includes("(")) {
      const argsStr = processLine.replace("sw", "").trim();
      const [rt, label] = argsStr.split(",").map((s) => s.trim());
      expandedText.push({
        line: `lui $at, %hi(${label})`,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
      expandedText.push({
        line: `sw ${rt}, %lo(${label})($at)`,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
    } else {
      expandedText.push({
        line: processLine,
        lineNum,
        address: textMemoryPointer,
      });
      textMemoryPointer += 4;
    }
  }

  const instructions: Instruction[] = [];
  for (const { line, lineNum, address } of expandedText) {
    const tokens = line.replace(/,/g, " ").split(/\s+/).filter(Boolean);
    const mnemonic = tokens[0];
    let args = tokens.slice(1);

    if (mnemonic === "lui" && args[1]?.startsWith("%hi(")) {
      const label = args[1].slice(4, -1);
      if (labels[label] === undefined)
        return {
          instructions: [],
          memory: {},
          labels: {},
          error: `Line ${lineNum}: Undefined label '${label}'`,
        };
      args[1] = (labels[label] >>> 16).toString();
    } else if (mnemonic === "ori" && args[2]?.startsWith("%lo(")) {
      const label = args[2].slice(4, -1);
      if (labels[label] === undefined)
        return {
          instructions: [],
          memory: {},
          labels: {},
          error: `Line ${lineNum}: Undefined label '${label}'`,
        };
      args[2] = (labels[label] & 0xffff).toString();
    }

    if (["lw", "sw"].includes(mnemonic)) {
      const match = args[1]?.match(/(.*)\((\$\w+)\)/);
      if (match) {
        let offsetStr = match[1];
        if (offsetStr.startsWith("%lo(")) {
          const label = offsetStr.slice(4, -1);
          if (labels[label] === undefined)
            return {
              instructions: [],
              memory: {},
              labels: {},
              error: `Line ${lineNum}: Undefined label '${label}'`,
            };
          offsetStr = (labels[label] & 0xffff).toString();
          args[1] = `${offsetStr}(${match[2]})`;
        }
      }
    }

    if (["beq", "bne"].includes(mnemonic)) {
      const label = args[2];
      if (isNaN(parseInt(label))) {
        if (labels[label] === undefined)
          return {
            instructions: [],
            memory: {},
            labels: {},
            error: `Line ${lineNum}: Undefined label '${label}'`,
          };
        const offset = (labels[label] - (address + 4)) / 4;
        args[2] = offset.toString();
      }
    }

    if (["j", "jal"].includes(mnemonic)) {
      const label = args[0];
      if (isNaN(parseInt(label))) {
        if (labels[label] === undefined)
          return {
            instructions: [],
            memory: {},
            labels: {},
            error: `Line ${lineNum}: Undefined label '${label}'`,
          };
        args[0] = (labels[label] / 4).toString();
      }
    }

    try {
      const binary = generateBinary(mnemonic, args);
      instructions.push({
        text: line,
        binary,
        mnemonic,
        args,
        address,
        originalLine: lineNum,
      });
    } catch (e: any) {
      return {
        instructions: [],
        memory: {},
        labels: {},
        error: `Line ${lineNum}: ${e.message}`,
      };
    }
  }

  return { instructions, memory, labels };
}

function generateBinary(mnemonic: string, args: string[]): string {
  const opcodeMap: Record<string, string> = {
    add: "000000",
    sub: "000000",
    mult: "000000",
    div: "000000",
    and: "000000",
    or: "000000",
    sll: "000000",
    slt: "000000",
    syscall: "000000",
    jr: "000000",
    mflo: "000000",
    mfhi: "000000",
    addi: "001000",
    ori: "001101",
    lw: "100011",
    sw: "101011",
    lui: "001111",
    slti: "001010",
    beq: "000100",
    bne: "000101",
    j: "000010",
    jal: "000011",
  };
  const functMap: Record<string, string> = {
    add: "100000",
    sub: "100010",
    mult: "011000",
    div: "011010",
    and: "100100",
    or: "100101",
    sll: "000000",
    slt: "101010",
    syscall: "001100",
    jr: "001000",
    mflo: "010010",
    mfhi: "010000",
  };

  const opcode = opcodeMap[mnemonic];
  if (opcode === undefined)
    throw new Error(`Unsupported instruction '${mnemonic}'`);

  if (opcode === "000000") {
    const funct = functMap[mnemonic];
    let rd = "00000",
      rs = "00000",
      rt = "00000",
      shamt = "00000";

    if (["add", "sub", "and", "or", "slt"].includes(mnemonic)) {
      if (args.length !== 3)
        throw new Error(`'${mnemonic}' expects 3 arguments`);
      rd = toBinary(registerMap[args[0]], 5);
      rs = toBinary(registerMap[args[1]], 5);
      rt = toBinary(registerMap[args[2]], 5);
    } else if (["mult", "div"].includes(mnemonic)) {
      if (args.length !== 2)
        throw new Error(`'${mnemonic}' expects 2 arguments`);
      rs = toBinary(registerMap[args[0]], 5);
      rt = toBinary(registerMap[args[1]], 5);
    } else if (["sll"].includes(mnemonic)) {
      if (args.length !== 3)
        throw new Error(`'${mnemonic}' expects 3 arguments`);
      rd = toBinary(registerMap[args[0]], 5);
      rt = toBinary(registerMap[args[1]], 5);
      shamt = toBinary(parseInt(args[2]), 5);
    } else if (["jr"].includes(mnemonic)) {
      if (args.length !== 1)
        throw new Error(`'${mnemonic}' expects 1 argument`);
      rs = toBinary(registerMap[args[0]], 5);
    } else if (["mflo", "mfhi"].includes(mnemonic)) {
      if (args.length !== 1)
        throw new Error(`'${mnemonic}' expects 1 argument`);
      rd = toBinary(registerMap[args[0]], 5);
    }
    return `${opcode}${rs}${rt}${rd}${shamt}${funct}`;
  }

  if (["addi", "slti", "ori"].includes(mnemonic)) {
    if (args.length !== 3) throw new Error(`'${mnemonic}' expects 3 arguments`);
    const rt = toBinary(registerMap[args[0]], 5);
    const rs = toBinary(registerMap[args[1]], 5);
    const imm = toBinary(parseInt(args[2]), 16);
    return `${opcode}${rs}${rt}${imm}`;
  }

  if (["lw", "sw"].includes(mnemonic)) {
    if (args.length !== 2) throw new Error(`'${mnemonic}' expects 2 arguments`);
    const rt = toBinary(registerMap[args[0]], 5);
    const match = args[1].match(/(-?\d+)\((\$\w+)\)/);
    if (!match)
      throw new Error(`Invalid format for ${mnemonic}. Use: offset($rs)`);
    const imm = toBinary(parseInt(match[1]), 16);
    const rs = toBinary(registerMap[match[2]], 5);
    return `${opcode}${rs}${rt}${imm}`;
  }

  if (mnemonic === "lui") {
    if (args.length !== 2) throw new Error(`'${mnemonic}' expects 2 arguments`);
    const rt = toBinary(registerMap[args[0]], 5);
    const rs = "00000";
    const imm = toBinary(parseInt(args[1]), 16);
    return `${opcode}${rs}${rt}${imm}`;
  }

  if (["beq", "bne"].includes(mnemonic)) {
    if (args.length !== 3) throw new Error(`'${mnemonic}' expects 3 arguments`);
    const rs = toBinary(registerMap[args[0]], 5);
    const rt = toBinary(registerMap[args[1]], 5);
    const imm = toBinary(parseInt(args[2]), 16);
    return `${opcode}${rs}${rt}${imm}`;
  }

  if (["j", "jal"].includes(mnemonic)) {
    if (args.length !== 1) throw new Error(`'${mnemonic}' expects 1 argument`);
    const address = toBinary(parseInt(args[0]), 26);
    return `${opcode}${address}`;
  }

  throw new Error("Logic error in assembler");
}
